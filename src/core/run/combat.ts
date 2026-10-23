import type { EnemyKind, WeaponId } from '../../config';
import { enemyHpAt } from './progression';
import { addEnemy, type Enemy, type RunState } from './state';
import { onHit, onKill } from './supplements';
import { coinValue, nativeLevel } from './upgrades';

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

/**
 * Para onde as armas com mira apontam: a molécula mais perto, ou o que quebra (destrutível do
 * mapa ou vesícula) se ele estiver mais perto que ela e a menos de `objectAimRangePx`. Sem isso,
 * os disparos só passavam pelos objetos por acaso.
 */
export function aimPoint(
  state: RunState,
  x: number,
  y: number,
  maxDistance: number,
): { x: number; y: number; enemy?: Enemy } | undefined {
  const enemy = nearestEnemy(state, x, y, maxDistance);
  const reach = Math.min(maxDistance, state.rules.run.combat.objectAimRangePx);
  let bestD2 = enemy ? (enemy.x - x) ** 2 + (enemy.y - y) ** 2 : reach * reach;
  bestD2 = Math.min(bestD2, reach * reach);
  let best: { x: number; y: number } | undefined;
  const consider = (ox: number, oy: number) => {
    const d2 = (ox - x) ** 2 + (oy - y) ** 2;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = { x: ox, y: oy };
    }
  };
  for (const { object: o } of state.map.solids) if (o.kind === 'destructible') consider(o.x, o.y);
  for (const v of state.vesicles) consider(v.x, v.y);
  if (best) return best;
  return enemy ? { x: enemy.x, y: enemy.y, enemy } : undefined;
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
  const native = state.rules.agents[state.agentId].nativeReceptor;
  if (native.type === e.type) amount *= 1 + native.perLevel * nativeLevel(state);
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
  if (!opts.continuous) onHit(state, e);
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
  dropXp(state, e);
  dropCoin(state, e);
  dropAmpoule(state, e);
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
  onKill(state, e);
}

/** Cascata: a molécula decomposta se quebra nas mais fracas, em volta de onde estava. */
function spawnFragments(state: RunState, e: Enemy): void {
  const fragments = state.rules.enemies[e.kind].fragments ?? [];
  const difficulty = enemyHpAt(state.time, state.rules.economy.difficulty);
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
      ).fragment = true;
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
  const chance =
    e.elite || e.boss
      ? c.eliteDropChance
      : state.effects.fever > 0
        ? state.rules.drops.fever.dropChance
        : c.dropChance;
  if (state.rng.next() >= chance) return;
  let value = coinValue(state);
  if (e.boss) value *= c.bossValueMultiplier;
  state.coins.push({ x: e.x, y: e.y, value, attracted: false });
}

/**
 * Gema de XP com chance pelo tipo de molécula (decisão 0028): a que cai vale o XP dividido pela
 * chance, então o XP médio não muda.
 */
function dropXp(state: RunState, e: Enemy): void {
  const c = state.rules.drops.gems.chance;
  let chance = e.elite || e.boss ? c.strong : e.fragment ? c.fragment : c.common;
  // Formação: a gema sai menos e não vale mais por isso (o XP fica abaixo do normal).
  const value = e.xp / chance;
  if (e.formation) chance *= state.rules.run.formations.gemChanceFactor;
  if (chance <= 0 || state.rng.next() >= chance) return;
  dropGem(state, e.x, e.y, value);
}

/**
 * Ampola: sempre no chefe (raridade mínima alta) e no agregado (mínimo Raro); chance pequena nas outras, pela Sorte e pelo
 * Estresse, com garantia contra seca e intervalo mínimo nas comuns.
 */
function dropAmpoule(state: RunState, e: Enemy): void {
  const a = state.rules.drops.ampoule;
  // Agregado do Coágulo: ampolas garantidas.
  for (let i = 0; i < e.extraAmpoules; i++) {
    const min = state.rules.run.aggregates.minRarity;
    state.pickups.push({
      x: e.x + i * 12,
      y: e.y,
      kind: 'ampoule',
      attracted: false,
      minRarity: min,
    });
  }
  if (e.extraAmpoules > 0) return;
  if (e.aggregate) {
    state.pickups.push({
      x: e.x,
      y: e.y,
      kind: 'ampoule',
      attracted: false,
      minRarity: state.rules.run.aggregates.minRarity,
    });
    return;
  }
  if (e.boss) {
    state.pickups.push({
      x: e.x,
      y: e.y,
      kind: 'ampoule',
      attracted: false,
      minRarity: a.bossMinRarity,
    });
    return;
  }
  if (e.fragment) return;
  const common = !e.elite;
  const since = state.time - state.lastAmpouleAt;
  if (common && since < a.minIntervalSeconds) return;
  let chance = (common ? a.chance.common : a.chance.strong) * Math.max(0.01, state.stats.luck);
  chance *= 1 + state.stats.curse;
  if (common && since >= a.guaranteeSeconds) chance *= 2;
  if (state.rng.next() >= chance) return;
  if (common) state.lastAmpouleAt = state.time;
  state.pickups.push({ x: e.x, y: e.y, kind: 'ampoule', attracted: false, minRarity: 'common' });
}

function dropGem(state: RunState, x: number, y: number, value: number): void {
  if (state.gems.length >= state.rules.run.gems.maxOnField) {
    state.gems[0]!.value += value;
    return;
  }
  state.gems.push({ x, y, value, attracted: false });
}
