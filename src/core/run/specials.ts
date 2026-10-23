import type { MoleculeType, SpecialKind } from '../../config';
import { hitEnemy } from './combat';
import type { RunState } from './state';
import { NO_MODS, type WeaponMods } from './weaponParams';

/** Recarga, força e duração base do especial (grupo special de stats.json). */
function specialStat(state: RunState, key: 'cooldown' | 'power' | 'duration' | 'charges'): number {
  return (state.rules.stats.special[key]?.base ?? 1) + (state.specialBonus[key] ?? 0);
}

/** Fração da recarga do especial que já passou (0 a 1), para o botão na HUD. */
export function specialReadiness(state: RunState): number {
  if (state.special.charges > 0) return 1;
  const total = specialCooldown(state);
  return total <= 0 ? 1 : 1 - state.special.cooldown / total;
}

/** Cargas máximas do especial (atributo Cargas de stats.json). */
export function maxCharges(state: RunState): number {
  return Math.max(1, Math.floor(specialStat(state, 'charges')));
}

function specialCooldown(state: RunState): number {
  return state.rules.agents[state.agentId].special.cooldownSeconds * specialStat(state, 'cooldown');
}

/**
 * Ajustes na ação do agente: Pico de recompensa e a queda depois dele, Vínculo (mais aliados) e
 * o pró-fármaco do Venvanse, que começa fraco e chega ao dano cheio em alguns minutos.
 */
export function actionMods(state: RunState): WeaponMods {
  const agent = state.rules.agents[state.agentId];
  const def = agent.special;
  const mods = { ...NO_MODS };
  if (agent.prodrug) mods.damage = prodrugMultiplier(state);
  if (state.special.active > 0) {
    if (def.kind === 'frenzy') {
      mods.cooldown = def.cooldownMultiplier ?? 1;
      mods.area = def.areaMultiplier ?? 1;
    }
    if (def.kind === 'bond') mods.count = def.countMultiplier ?? 1;
  } else if (state.special.crash > 0 && def.kind === 'frenzy') {
    mods.cooldown = def.crashCooldownMultiplier ?? 1;
  }
  return mods;
}

/** Fração do dano da ação do pró-fármaco (Venvanse) no tempo atual da run; 1 sem pró-fármaco. */
export function prodrugMultiplier(state: RunState): number {
  const p = state.rules.agents[state.agentId].prodrug;
  if (!p) return 1;
  const t = Math.min(1, state.time / (p.fullMinutes * 60));
  return p.startMultiplier + (1 - p.startMultiplier) * t;
}

/** Especial com efeito agora (Hiperfoco, Calmaria...), para os sistemas que dependem dele. */
export function specialActive(state: RunState, kind: SpecialKind): boolean {
  return state.special.active > 0 && state.rules.agents[state.agentId].special.kind === kind;
}

/**
 * Efeitos do especial nos inimigos a cada passo, depois de `applyFields` (que zera a lentidão):
 * o Hiperfoco desacelera todos.
 */
export function applySpecialFields(state: RunState): void {
  if (!specialActive(state, 'hyperfocus')) return;
  const slow = 1 - (state.rules.agents[state.agentId].special.slow ?? 0);
  for (const e of state.enemies) e.slow *= slow;
}

/** Atualiza tempos e, se o jogador pediu e está pronto, dispara o especial do agente. */
export function updateSpecial(state: RunState, pressed: boolean, dt: number): void {
  const sp = state.special;
  const def = state.rules.agents[state.agentId].special;
  // Recarga: uma carga por vez, até o máximo.
  const max = maxCharges(state);
  if (sp.charges < max) {
    sp.cooldown = Math.max(0, sp.cooldown - dt);
    if (sp.cooldown === 0) {
      sp.charges++;
      if (sp.charges === 1) state.events.push({ type: 'specialReady' });
      if (sp.charges < max) sp.cooldown = specialCooldown(state);
    }
  }
  if (sp.active > 0) {
    sp.active = Math.max(0, sp.active - dt);
    if (sp.active === 0) sp.blocks = 0;
    if (sp.active === 0 && def.crashSeconds) sp.crash = def.crashSeconds;
  } else {
    sp.crash = Math.max(0, sp.crash - dt);
  }

  if (!pressed || sp.charges <= 0) return;
  sp.charges--;
  if (sp.cooldown === 0) sp.cooldown = specialCooldown(state);
  const power = specialStat(state, 'power');
  const duration = def.durationSeconds * specialStat(state, 'duration');
  const { agent } = state;
  switch (def.kind) {
    case 'frenzy':
      sp.active = duration;
      sp.crash = 0;
      break;
    case 'emulsion':
      state.zones.push({
        kind: 'emulsion',
        x: agent.x,
        y: agent.y,
        radius: def.radiusPx ?? 60,
        life: duration,
        damage: 0,
        hitInterval: 1,
        lastHit: new Map(),
        slow: 0,
        vulnerability: (def.vulnerability ?? 0) * power,
        vulnerableType: def.type,
      });
      break;
    case 'uptake':
      for (const e of state.enemies) {
        if (e.hp <= 0 || (def.type && e.type !== def.type)) continue;
        const dx = agent.x - e.x;
        const dy = agent.y - e.y;
        const d = Math.hypot(dx, dy);
        const step = Math.min(def.pullPx ?? 0, Math.max(0, d - 12));
        if (d > 0) {
          e.x += (dx / d) * step;
          e.y += (dy / d) * step;
        }
        hitEnemy(state, e, (def.damage ?? 0) * power, { continuous: true });
      }
      break;
    case 'shield':
      sp.active = duration;
      sp.blocks = Math.max(1, Math.round((def.blocks ?? 1) * power));
      break;
    case 'alert':
      alertBurst(state, (def.damage ?? 0) * power, def.count ?? 12);
      // Devolve parte da recarga: o próximo uso vem antes.
      sp.cooldown *= 1 - (def.refund ?? 0);
      break;
    case 'hyperfocus':
    case 'bond':
      sp.active = duration;
      break;
    case 'calm':
      sp.active = duration;
      hitType(state, def.type, (def.damage ?? 0) * power);
      break;
    case 'detox':
      state.hazards = [];
      hitType(state, def.type, (def.damage ?? 0) * power);
      break;
  }
  state.events.push({ type: 'special', kind: def.kind });
}

/** Fere todas as moléculas do tipo (Calmaria, Desintoxicação). */
function hitType(state: RunState, type: MoleculeType | undefined, damage: number): void {
  for (const e of state.enemies) {
    if (e.hp > 0 && (!type || e.type === type)) hitEnemy(state, e, damage, { continuous: true });
  }
}

/** Alerta (Cafeína): um anel de disparos em volta do agente, com o desenho da ação. */
function alertBurst(state: RunState, damage: number, count: number): void {
  const { agent } = state;
  const action = state.weapons[0];
  const speed = 300;
  const range = 180;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    state.projectiles.push({
      weapon: action?.id ?? 'radical',
      x: agent.x,
      y: agent.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: range / speed,
      damage,
      pierceLeft: 1,
      radius: 4,
      hits: [],
      ricochetLeft: 0,
    });
  }
}
