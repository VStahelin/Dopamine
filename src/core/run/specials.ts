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

/** Ajustes do especial na ação do agente: Pico de recompensa e a queda depois dele. */
export function actionMods(state: RunState): WeaponMods {
  const def = state.rules.agents[state.agentId].special;
  if (def.kind !== 'frenzy') return NO_MODS;
  if (state.special.active > 0) {
    return { cooldown: def.cooldownMultiplier ?? 1, area: def.areaMultiplier ?? 1 };
  }
  if (state.special.crash > 0) return { cooldown: def.crashCooldownMultiplier ?? 1, area: 1 };
  return NO_MODS;
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
      if (sp.charges < max) sp.cooldown = specialCooldown(state);
    }
  }
  if (sp.active > 0) {
    sp.active = Math.max(0, sp.active - dt);
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
  }
  state.events.push({ type: 'special', kind: def.kind });
}
