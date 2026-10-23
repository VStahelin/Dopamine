import type { PassiveId, RunStatKey } from '../../config';
import { addAggregate } from './aggregates';
import { spawnFormation } from './formations';
import { addBonus, type RunState, type Structure } from './state';
import {
  applyUpgrade,
  coinValue,
  passiveAmount,
  rarityMultiplier,
  refreshStats,
  rollRarity,
  type UpgradeChoice,
} from './upgrades';

/**
 * Sinapses e estruturas (fase 5.11, decisão 0029), os santuários do Megabonk: ficar dentro da
 * sinapse até encher dá 3 cartões de bônus; o Foco chama um cerco que vale ampola; o Coágulo chama
 * um agregado mais forte; a Glândula troca Estresse por ATP. Números em structures.json.
 */

/** Atributos que a sinapse não oferece: espaços e Opções, que só vêm do Laboratório. */
const SYNAPSE_SKIP: readonly RunStatKey[] = ['choices', 'weaponSlots', 'modifierSlots', 'curse'];

/** Quimiotaxia: cópias somam enchimento mais rápido e estruturas a mais. */
function chemotaxis(state: RunState): { fill: number; extra: number } {
  let fill = 0;
  let extra = 0;
  for (const [id, n] of Object.entries(state.supplements)) {
    const e = state.rules.supplements.items[id]?.effect;
    if (e?.kind !== 'chemotaxis') continue;
    fill += e.fillBonus * n;
    extra += e.extraStructures * n;
  }
  return { fill, extra };
}

function add(state: RunState, kind: Structure['kind'], x0: number, y0: number): void {
  const uses = kind === 'adrenal' ? state.rules.structures.adrenal.uses : 1;
  // Numa clareira (fase 5.7): se o círculo cai em cima de um obstáculo, gira em volta do agente
  // até achar lugar livre.
  const { agent, map } = state;
  const clear = state.rules.structures.radiusPx * 0.8;
  let x = x0;
  let y = y0;
  for (let k = 0; k < 12; k++) {
    let blocked = false;
    map.grid.query(x, y, clear + 32, (i) => {
      const o = map.solids[i]!.object;
      if ((o.x - x) ** 2 + (o.y - y) ** 2 < (clear + o.radius) ** 2) blocked = true;
    });
    if (!blocked) break;
    const a = Math.atan2(y0 - agent.y, x0 - agent.x) + (k + 1) * 0.5;
    const d = Math.hypot(x0 - agent.x, y0 - agent.y);
    x = agent.x + Math.cos(a) * d;
    y = agent.y + Math.sin(a) * d;
  }
  state.structures.push({
    id: state.nextStructureId++,
    kind,
    x,
    y,
    progress: 0,
    inside: false,
    uses,
  });
}

/** Sorteia o tipo da próxima estrutura; a sinapse pode sair potenciada. */
function pickKind(state: RunState): Structure['kind'] {
  const s = state.rules.structures;
  const kinds = Object.keys(s.weights) as (keyof typeof s.weights)[];
  const kind = state.rng.weighted(kinds, (k) => s.weights[k]) ?? 'synapse';
  if (kind === 'synapse' && state.rng.next() < s.synapse.potentiatedChance) return 'synapseLTP';
  return kind;
}

/** Nascimento, efeitos e o desafio do Foco, a cada passo. */
export function updateStructures(state: RunState, dt: number, distance: number, hp: number): void {
  const s = state.rules.structures;
  const { agent } = state;
  const chemo = chemotaxis(state);

  // Uma sinapse perto logo no começo; depois uma estrutura nova a cada tanto, até o máximo.
  if (state.nextStructureAt < 0) {
    const a = state.rng.range(0, Math.PI * 2);
    const d = s.firstSynapseDistancePx;
    add(state, 'synapse', agent.x + Math.cos(a) * d, agent.y + Math.sin(a) * d);
    state.nextStructureAt = state.time + s.everySeconds;
  }
  const far = distance * s.despawnViewMultiplier;
  state.structures = state.structures.filter(
    (st) => (st.x - agent.x) ** 2 + (st.y - agent.y) ** 2 < far * far,
  );
  if (state.time >= state.nextStructureAt) {
    state.nextStructureAt = state.time + s.everySeconds;
    if (state.structures.length < s.maxOnField + chemo.extra) {
      const a = state.rng.range(0, Math.PI * 2);
      add(
        state,
        pickKind(state),
        agent.x + Math.cos(a) * distance,
        agent.y + Math.sin(a) * distance,
      );
    }
  }

  const done: number[] = [];
  for (const st of state.structures) {
    const inside = (st.x - agent.x) ** 2 + (st.y - agent.y) ** 2 <= s.radiusPx ** 2;
    const entered = inside && !st.inside;
    st.inside = inside;
    switch (st.kind) {
      case 'synapse':
      case 'synapseLTP': {
        const ltp = st.kind === 'synapseLTP';
        const fill =
          (ltp ? s.synapse.potentiatedFillSeconds : s.synapse.fillSeconds) / (1 + chemo.fill);
        st.progress = inside
          ? st.progress + dt / fill
          : Math.max(0, st.progress - (dt / fill) * s.synapse.drainFactor);
        if (st.progress >= 1) {
          state.synapseOffer = synapseOffer(state, ltp);
          state.tally.synapses++;
          done.push(st.id);
        }
        break;
      }
      case 'focus':
        if (!entered) break;
        startChallenge(state, distance, hp);
        done.push(st.id);
        break;
      case 'clot': {
        if (!entered) break;
        const e = addAggregate(state, st.x, st.y, hp * s.clot.hpMultiplier);
        if (e) e.extraAmpoules = s.clot.ampoules;
        done.push(st.id);
        break;
      }
      case 'adrenal':
        if (!entered) break;
        state.atp += s.adrenal.coins * coinValue(state) * state.stats.currencyGain;
        addBonus(state, 'structure', 'curse', s.adrenal.stress);
        refreshStats(state);
        st.uses--;
        if (st.uses <= 0) done.push(st.id);
        break;
    }
    if (done.includes(st.id))
      state.events.push({ type: 'structure', kind: st.kind, x: st.x, y: st.y });
  }
  if (done.length > 0) state.structures = state.structures.filter((st) => !done.includes(st.id));
  updateChallenge(state);
}

/** Foco inflamatório: o cerco nasce em volta do agente e começa a contar o tempo. */
function startChallenge(state: RunState, distance: number, hp: number): void {
  const f = state.rules.structures.focus;
  const from = state.nextEnemyId;
  spawnFormation(state, f.formation, 0, Math.min(distance, f.ringRadiusPx), hp);
  state.challenge = { from, to: state.nextEnemyId, until: state.time + f.seconds };
}

function updateChallenge(state: RunState): void {
  const c = state.challenge;
  if (!c) return;
  const alive = state.enemies.some((e) => e.id >= c.from && e.id < c.to && e.hp > 0);
  if (!alive) {
    const { agent } = state;
    const min = state.rules.structures.focus.minRarity;
    state.pickups.push({
      x: agent.x,
      y: agent.y + 20,
      kind: 'ampoule',
      attracted: false,
      minRarity: min,
    });
    state.events.push({ type: 'challenge', won: true });
    state.challenge = null;
  } else if (state.time >= c.until) {
    state.events.push({ type: 'challenge', won: false });
    state.challenge = null;
  }
}

/**
 * Cartões da sinapse: bônus de atributo entre todos os do jogo (com Rerrolar, Pular e Banir), um
 * por atributo, com raridade pela Sorte; a potenciada só tem as raridades mais altas.
 */
export function synapseOffer(state: RunState, potentiated: boolean): UpgradeChoice[] {
  const { passives, rarities, structures } = state.rules;
  const seen = new Set<string>();
  const ids = (Object.keys(passives) as PassiveId[]).filter((id) => {
    const def = passives[id];
    if (def.kind === 'reagent' || def.mutation || SYNAPSE_SKIP.includes(def.stat)) return false;
    if (seen.has(def.stat)) return false;
    seen.add(def.stat);
    return true;
  });
  const out: UpgradeChoice[] = [];
  const top = rarities.tiers.length - 1;
  while (out.length < structures.synapse.choices && ids.length > 0) {
    const id = ids.splice(state.rng.int(ids.length), 1)[0]!;
    const rarity = potentiated
      ? state.rng.int(top - structures.synapse.potentiatedMinRarity + 1) +
        structures.synapse.potentiatedMinRarity
      : rollRarity(state);
    const amount = passiveAmount(passives[id], rarityMultiplier(state, rarity));
    out.push({ kind: 'boost', id, amount, rarity });
  }
  return out;
}

/** O jogador escolheu um cartão da sinapse: a run continua. */
export function chooseSynapse(state: RunState, choice: UpgradeChoice): void {
  if (!state.synapseOffer) return;
  applyUpgrade(state, choice);
  state.synapseOffer = null;
}
