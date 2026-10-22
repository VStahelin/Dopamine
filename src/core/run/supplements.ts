import {
  SUPPLEMENT_RARITIES,
  type PassiveId,
  type SupplementEffect,
  type SupplementRarity,
} from '../../config';
import { damageEnemy, nearestEnemy } from './combat';
import type { Enemy, RunState } from './state';
import { statDef } from './stats';
import { refreshStats } from './upgrades';
import { weaponMaxLevel } from './weaponParams';

/**
 * Suplementos (fase 5.9, decisão 0028): passivos da run que saem de ampolas, não ocupam espaço e
 * acumulam. Números em supplements.json; as chances da ampola em drops.json.
 */

/** Quantas cópias o agente tem de um suplemento. */
export function copies(state: RunState, id: string): number {
  return state.supplements[id] ?? 0;
}

/** Suplementos que o agente tem com o efeito `kind`: cópias e o efeito de cada um. */
function holding<K extends SupplementEffect['kind']>(
  state: RunState,
  kind: K,
): { n: number; effect: Extract<SupplementEffect, { kind: K }> }[] {
  const out: { n: number; effect: Extract<SupplementEffect, { kind: K }> }[] = [];
  for (const [id, n] of Object.entries(state.supplements)) {
    const effect = state.rules.supplements.items[id]?.effect;
    if (effect?.kind === kind)
      out.push({ n, effect: effect as Extract<SupplementEffect, { kind: K }> });
  }
  return out;
}

/** Pode sair agora? Reagente só uma cópia; atributo no teto da run sai do sorteio. */
function available(state: RunState, id: string): boolean {
  const def = state.rules.supplements.items[id]!;
  const e = def.effect;
  if (e.kind === 'reagent') return (state.passives[e.passive as PassiveId]?.level ?? 0) === 0;
  if (e.kind === 'stat') {
    const cap = statDef(state.rules, e.stat).runCap;
    if (cap === null) return true;
    const base = statDef(state.rules, e.stat).base;
    return cap < base ? state.stats[e.stat] > cap : state.stats[e.stat] < cap;
  }
  return true;
}

/** Peso no sorteio: o reagente de uma arma no máximo que ainda não o tem pesa mais. */
function weight(state: RunState, id: string): number {
  const e = state.rules.supplements.items[id]!.effect;
  if (e.kind !== 'reagent') return 1;
  const ready = state.weapons.some((w) => {
    const def = state.rules.weapons[w.id];
    return def.evolution?.reagent === e.passive && w.level >= weaponMaxLevel(def);
  });
  return ready ? state.rules.supplements.reagentBoost : 1;
}

/**
 * Sorteia a raridade pela Sorte (a regra da decisão 0013) e depois o suplemento dentro dela.
 * Sem nada na raridade sorteada, tenta as outras, das mais altas para as mais baixas.
 */
export function rollSupplement(state: RunState, min: SupplementRarity = 'common'): string | null {
  const { supplements, rarities } = state.rules;
  const from = SUPPLEMENT_RARITIES.indexOf(min);
  const tiers = SUPPLEMENT_RARITIES.slice(from);
  const luck = Math.max(0.01, state.stats.luck);
  const rolled = state.rng.weighted(
    tiers.map((_, i) => i),
    (i) =>
      supplements.rarities[tiers[i]!].weight * luck ** ((from + i) * rarities.luckExponentPerTier),
  );
  const order = [
    tiers[rolled ?? 0]!,
    ...[...tiers].reverse().filter((t) => t !== tiers[rolled ?? 0]),
  ];
  for (const rarity of order) {
    const ids = Object.keys(supplements.items).filter(
      (id) => supplements.items[id]!.rarity === rarity && available(state, id),
    );
    const pick = state.rng.weighted(ids, (id) => weight(state, id));
    if (pick) return pick;
  }
  return null;
}

/** Toma uma cópia do suplemento: atributo, especial ou reagente; os de efeito agem nos ganchos. */
export function applySupplement(state: RunState, id: string): void {
  const def = state.rules.supplements.items[id];
  if (!def) return;
  state.supplements[id] = copies(state, id) + 1;
  if (!state.seenSupplements.includes(id)) state.seenSupplements.push(id);
  const e = def.effect;
  const before = state.stats.maxInteractions;
  if (e.kind === 'stat') state.bonus[e.stat] = (state.bonus[e.stat] ?? 0) + e.value;
  if (e.kind === 'special') {
    state.specialBonus[e.stat] = (state.specialBonus[e.stat] ?? 0) + e.value;
  }
  if (e.kind === 'reagent') {
    const passive = e.passive as PassiveId;
    state.passives[passive] = { level: 1, bonus: state.rules.passives[passive].perLevel };
  }
  refreshStats(state);
  state.agent.interactions += Math.max(0, state.stats.maxInteractions - before);
}

/** Abre a ampola: sorteia e toma o suplemento; a run para até o jogador ver. */
export function openAmpoule(state: RunState, min: SupplementRarity): void {
  const id = rollSupplement(state, min);
  if (!id) return;
  applySupplement(state, id);
  state.ampoule = { id };
}

export function closeAmpoule(state: RunState): void {
  state.ampoule = null;
}

// --- Ganchos dos suplementos de efeito ---

/** Nitrogênio líquido: chance de congelar a molécula atingida. */
export function onHit(state: RunState, e: Enemy): void {
  for (const { n, effect } of holding(state, 'freezeOnHit')) {
    if (state.rng.next() < effect.chance * n) e.frozen = Math.max(e.frozen, effect.seconds);
  }
}

/** Eletrodo e Termita ao decompor. Os golpes deles não disparam outra faísca nem explosão. */
export function onKill(state: RunState, e: Enemy): void {
  if (state.chaining) return;
  state.chaining = true;
  for (const { n, effect } of holding(state, 'spark')) {
    if (state.rng.next() >= effect.chance * n) continue;
    const hit: number[] = [e.id];
    for (let t = 0; t < effect.targets; t++) {
      const target = nearestEnemy(state, e.x, e.y, effect.rangePx, hit);
      if (!target) break;
      hit.push(target.id);
      state.events.push({ type: 'spark', x1: e.x, y1: e.y, x2: target.x, y2: target.y });
      damageEnemy(state, target, effect.damage * state.stats.damage);
    }
  }
  for (const { n, effect } of holding(state, 'thermite')) {
    state.events.push({ type: 'strike', x: e.x, y: e.y, radius: effect.radiusPx });
    for (const o of [...state.enemies]) {
      if (o.hp <= 0 || o.id === e.id) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 > effect.radiusPx ** 2) continue;
      damageEnemy(state, o, effect.damage * n * state.stats.damage);
    }
  }
  state.chaining = false;
}

/** Criopreservação: perder interações congela tudo na tela, com recarga. */
export function onHurt(state: RunState): void {
  if (state.cryoCooldown > 0) return;
  const cryo = holding(state, 'cryo')[0];
  if (!cryo) return;
  state.effects.freeze = Math.max(state.effects.freeze, cryo.effect.seconds);
  state.cryoCooldown = cryo.effect.cooldownSeconds;
}

/** Tempos dos suplementos a cada passo: recarga da Criopreservação e o pulso da Aquaporina. */
export function updateSupplements(state: RunState, dt: number): void {
  state.cryoCooldown = Math.max(0, state.cryoCooldown - dt);
  const pulse = holding(state, 'gemPulse')[0];
  if (!pulse) return;
  state.gemPulseTimer += dt;
  if (state.gemPulseTimer < pulse.effect.seconds) return;
  state.gemPulseTimer = 0;
  for (const g of state.gems) g.attracted = true;
}
