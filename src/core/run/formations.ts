import type { EnemyKind, FormationDef, MoleculeType } from '../../config';
import { addEnemy, type RunState } from './state';

/**
 * Formações e crises (fase 5.6, decisão 0030): grupos programados que nascem fora da tela com
 * aviso. A doença escolhe qual vem (o peso é o da família no organismo), e a cada pico do dente
 * de serra vem uma crise: a formação da família mais puxada, em dobro.
 */

/** Peso de uma formação: o peso da família dela no organismo (1 sem organismo). */
function weight(state: RunState, def: FormationDef): number {
  return state.rules.familyWeights?.[def.family] ?? 1;
}

function pickFormation(state: RunState): string | undefined {
  const list = state.rules.run.formations.list;
  return state.rng.weighted(Object.keys(list), (id) => weight(state, list[id]!));
}

/** A formação da família mais puxada pela doença; empate fica com a primeira da lista. */
function crisisFormation(state: RunState): string | undefined {
  const list = state.rules.run.formations.list;
  let best: string | undefined;
  for (const id of Object.keys(list)) {
    if (!best || weight(state, list[id]!) > weight(state, list[best]!)) best = id;
  }
  return best;
}

/** Moléculas comuns mais puxadas agora: o Cerco inflamatório é feito delas. */
function topCommons(state: RunState): EnemyKind[] {
  const { enemies } = state.rules;
  return (Object.keys(enemies) as EnemyKind[])
    .filter((k) => enemies[k].contactDamage === 'common' && enemies[k].spawnWeight > 0)
    .filter((k) => enemies[k].unlockMinute <= state.time / 60)
    .sort((a, b) => enemies[b].spawnWeight - enemies[a].spawnWeight)
    .slice(0, 2);
}

function schedule(state: RunState, id: string, crisis: boolean, angle: number): void {
  const f = state.rules.run.formations;
  state.formations.pending.push({ id, at: state.time + f.warningSeconds, angle, crisis });
}

/** Agenda, avisa e faz nascer as formações e as crises. */
export function updateFormations(state: RunState, distance: number, hp: number): void {
  const f = state.rules.run.formations;
  const fs = state.formations;
  if (fs.next < 0) fs.next = f.firstAtSeconds;
  if (state.time >= fs.next) {
    fs.next += f.everySeconds;
    const id = pickFormation(state);
    if (id) {
      const angle = state.rng.range(0, Math.PI * 2);
      schedule(state, id, false, angle);
      state.events.push({ type: 'formationWarning', name: f.list[id]!.name, angle, crisis: false });
    }
  }

  // Crise no começo de cada pico do dente de serra.
  const cycle = state.rules.economy.difficulty.peakEveryMinutes * 60;
  const peak = Math.floor(state.time / cycle);
  if (peak >= 1 && peak > fs.crises) {
    fs.crises = peak;
    const id = crisisFormation(state);
    if (id) {
      const def = f.list[id]!;
      const angle = state.rng.range(0, Math.PI * 2);
      schedule(state, id, true, angle);
      schedule(state, id, true, angle + Math.PI);
      const until =
        state.time + f.warningSeconds + state.rules.economy.difficulty.peakDurationSeconds;
      fs.crisis = { family: def.family, until };
      state.events.push({
        type: 'formationWarning',
        name: f.crisisNames[def.family],
        angle,
        crisis: true,
      });
    }
  }
  if (fs.crisis && state.time >= fs.crisis.until) fs.crisis = null;

  const due = fs.pending.filter((p) => state.time >= p.at);
  if (due.length === 0) return;
  fs.pending = fs.pending.filter((p) => state.time < p.at);
  for (const p of due) {
    spawnFormation(state, p.id, p.angle, distance, hp);
    if (!fs.seen.includes(p.id)) fs.seen.push(p.id);
  }
}

/** Faz nascer uma formação fora da tela, do lado de `angle` (visto do agente). */
export function spawnFormation(
  state: RunState,
  id: string,
  angle: number,
  distance: number,
  hp: number,
): void {
  const def = state.rules.run.formations.list[id];
  if (!def) return;
  const kinds = def.kinds.length > 0 ? (def.kinds as EnemyKind[]) : topCommons(state);
  if (kinds.length === 0) return;
  const { agent, rng } = state;
  const ox = Math.cos(angle);
  const oy = Math.sin(angle);
  // Centro da formação fora da tela; `d` aponta para o agente e `p` é a perpendicular.
  const cx = agent.x + ox * distance;
  const cy = agent.y + oy * distance;
  const d = { x: -ox, y: -oy };
  const p = { x: -oy, y: ox };
  const add = (i: number, x: number, y: number, straight: { x: number; y: number } | null) => {
    const e = addEnemy(state, kinds[i % kinds.length]!, x, y, hp);
    e.speed *= def.speedMultiplier;
    e.formation = true;
    if (straight) {
      e.straight = true;
      e.dirX = straight.x;
      e.dirY = straight.y;
    }
  };
  switch (def.shape) {
    case 'swarm': {
      // Mira um ponto perto do agente e atravessa em linha reta.
      const miss = rng.range(-60, 60);
      const tx = agent.x + p.x * miss - cx;
      const ty = agent.y + p.y * miss - cy;
      const len = Math.hypot(tx, ty) || 1;
      for (let i = 0; i < def.count; i++) {
        add(i, cx + rng.range(-40, 40), cy + rng.range(-40, 40), { x: tx / len, y: ty / len });
      }
      break;
    }
    case 'row': {
      const spacing = 24;
      for (let i = 0; i < def.count; i++) {
        const t = (i - (def.count - 1) / 2) * spacing;
        add(i, cx + p.x * t, cy + p.y * t, d);
      }
      break;
    }
    case 'diagonal': {
      // Três linhas em coluna, cruzando a tela na diagonal.
      const tilt = 0.4;
      const dir = {
        x: d.x * Math.cos(tilt) - d.y * Math.sin(tilt),
        y: d.x * Math.sin(tilt) + d.y * Math.cos(tilt),
      };
      const per = Math.ceil(def.count / 3);
      for (let i = 0; i < def.count; i++) {
        const line = Math.floor(i / per) - 1;
        const k = i % per;
        add(i, cx + p.x * line * 70 - dir.x * k * 22, cy + p.y * line * 70 - dir.y * k * 22, dir);
      }
      break;
    }
    case 'ring': {
      // Anel em volta do agente, na borda da tela, que fecha devagar.
      for (let i = 0; i < def.count; i++) {
        const a = (i / def.count) * Math.PI * 2;
        add(i, agent.x + Math.cos(a) * distance, agent.y + Math.sin(a) * distance, null);
      }
      break;
    }
    case 'surge': {
      // A primeira molécula no centro, o resto em volta, todos acelerados atrás do agente.
      add(0, cx, cy, null);
      for (let i = 1; i < def.count; i++) {
        const a = (i / (def.count - 1)) * Math.PI * 2;
        add(i, cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, null);
      }
      break;
    }
  }
}

/** Família da crise em andamento, para tingir o mapa; nula fora da crise. */
export function crisisFamily(state: RunState): MoleculeType | null {
  return state.formations.crisis?.family ?? null;
}
