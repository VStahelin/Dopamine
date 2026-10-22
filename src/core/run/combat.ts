import type { EnemyKind, WeaponId } from '../../config';
import { difficultyAt } from './progression';
import { addEnemy, type Enemy, type RunState } from './state';
import { coinValue } from './upgrades';

/** Inimigo vivo mais perto de (x, y), ignorando os ids em `skip`. */
export function nearestEnemy(
  state: RunState,
  x: number,
  y: number,
  maxDistance: number,
  skip: readonly number[] = [],
): Enemy | undefined {
  let best: Enemy | undefined;
  let bestD2 = maxDistance * maxDistance;
  for (const e of state.enemies) {
    if (e.hp <= 0 || skip.includes(e.id)) continue;
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = e;
    }
  }
  return best;
}

/** Multiplicador de efetividade do agente contra o tipo da molécula (aba Personagens). */
export function affinityMultiplier(state: RunState, e: Enemy): number {
  const level = state.rules.agents[state.agentId].affinity[e.type] ?? 'neutral';
  return state.rules.run.affinity[level];
}

export interface HitOptions {
  /** Direção do golpe, para o empurrão. */
  dirX?: number;
  dirY?: number;
  /** Golpes contínuos (aura, poça) não rolam crítico nem empurram. */
  continuous?: boolean;
  /** Arma que deu o golpe, para o dano por arma da pausa. */
  source?: WeaponId;
}

/**
 * Golpe de uma arma: efetividade por tipo, bônus contra inimigos fortes, vulnerabilidade,
 * crítico e empurrão.
 */
export function hitEnemy(state: RunState, e: Enemy, base: number, opts: HitOptions = {}): void {
  const { stats, rng, rules } = state;
  const affinity = affinityMultiplier(state, e);
  let amount = base * affinity * (1 + e.vulnerability);
  if (e.elite) amount *= stats.eliteDamage;
  let crit = false;
  if (!opts.continuous) {
    crit = rng.next() < stats.critChance;
    if (crit) amount *= stats.critDamage;
    const len = Math.hypot(opts.dirX ?? 0, opts.dirY ?? 0);
    if (len > 0) {
      const push = (rules.run.combat.knockbackPx * stats.knockback) / Math.max(1, e.radius / 8);
      e.x += ((opts.dirX ?? 0) / len) * push;
      e.y += ((opts.dirY ?? 0) / len) * push;
    }
  }
  if (crit) state.tally.crits++;
  if (opts.source) {
    const t = state.tally.damageByWeapon;
    t[opts.source] = (t[opts.source] ?? 0) + Math.min(amount, Math.max(0, e.hp));
  }
  damageEnemy(state, e, amount, crit, affinity, opts.continuous ?? false);
}

/** Tira vida; na morte, conta a decomposição, deixa a gema e solta os fragmentos (cascata). */
export function damageEnemy(
  state: RunState,
  e: Enemy,
  amount: number,
  crit = false,
  affinity = 1,
  continuous = false,
): void {
  if (e.hp <= 0) return;
  e.hp -= amount;
  e.hitFlash = 0.1;
  state.events.push({ type: 'damage', x: e.x, y: e.y, amount, crit, affinity, continuous });
  if (e.hp > 0) return;

  state.kills++;
  state.events.push({ type: 'kill', x: e.x, y: e.y, kind: e.kind });
  dropGem(state, e.x, e.y, e.xp);
  dropCoin(state, e);
  // O chefe solta a cápsula; a de prata, depois dos 10 minutos, pode evoluir uma arma.
  if (e.boss) {
    const silver = state.time >= state.rules.drops.capsule.silverAfterMinutes * 60;
    state.pickups.push({ x: e.x, y: e.y, kind: 'capsule', attracted: false, silver });
  }
  // Absorção: chance de recuperar 1 interação ao decompor.
  if (state.rng.next() < state.stats.lifesteal) heal(state, 1);
  for (const w of state.weapons) {
    const def = state.rules.weapons[w.id];
    if (def.growPerKillPx) w.growth = Math.min(def.growMaxPx ?? 0, w.growth + def.growPerKillPx);
  }
  spawnFragments(state, e);
}

/** Cascata: a molécula decomposta se quebra nas mais fracas, em volta de onde estava. */
function spawnFragments(state: RunState, e: Enemy): void {
  const fragments = state.rules.enemies[e.kind].fragments ?? [];
  const difficulty = difficultyAt(state.time, state.rules.economy.difficulty);
  const total = fragments.reduce((a, f) => a + f.count, 0);
  let i = 0;
  for (const f of fragments) {
    for (let n = 0; n < f.count; n++, i++) {
      const angle = (i / Math.max(1, total)) * Math.PI * 2 + state.rng.range(0, 0.5);
      const d = e.radius * 0.8;
      addEnemy(
        state,
        f.kind as EnemyKind,
        e.x + Math.cos(angle) * d,
        e.y + Math.sin(angle) * d,
        difficulty,
      );
    }
  }
}

export function heal(state: RunState, amount: number): void {
  const before = state.agent.interactions;
  state.agent.interactions = Math.min(state.stats.maxInteractions, before + amount);
  const gained = state.agent.interactions - before;
  if (gained > 0) state.events.push({ type: 'heal', amount: gained });
}

/**
 * ATP no chão: chance por molécula, sempre nas elites e durante a Febre de ATP; vale mais com o
 * tempo de run.
 */
function dropCoin(state: RunState, e: Enemy): void {
  const c = state.rules.economy.runCurrency;
  const chance = e.elite || e.boss ? c.eliteDropChance : state.effects.fever > 0 ? 1 : c.dropChance;
  if (state.rng.next() >= chance) return;
  let value = coinValue(state);
  if (e.boss) value *= c.bossValueMultiplier;
  state.coins.push({ x: e.x, y: e.y, value, attracted: false });
}

function dropGem(state: RunState, x: number, y: number, value: number): void {
  if (state.gems.length >= state.rules.run.gems.maxOnField) {
    state.gems[0]!.value += value;
    return;
  }
  state.gems.push({ x, y, value, attracted: false });
}
