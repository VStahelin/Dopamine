import type { PassiveDef, PassiveId } from '../../config';
import type { RunState } from './state';
import { computeStats, weaponMaxLevel } from './stats';

export type UpgradeChoice =
  | { kind: 'weapon'; level: number }
  | {
      kind: 'passive';
      id: PassiveId;
      level: number;
      /** Índice da raridade em rarities.json (0 = comum). */
      rarity: number;
      /** Quanto soma ao atributo, já com o multiplicador da raridade. */
      amount: number;
    }
  | { kind: 'heal'; amount: number };

/** Interações recuperadas quando não sobra nenhum upgrade para oferecer. */
const FALLBACK_HEAL = 30;

/** Identifica a opção para banir: a arma ou um modificador, sem nível nem raridade. */
export function choiceKey(choice: UpgradeChoice): string {
  if (choice.kind === 'passive') return `passive:${choice.id}`;
  return choice.kind;
}

/** Usos restantes de Rerrolar, Pular ou Banir nesta run. */
export function remaining(state: RunState, action: 'rerolls' | 'skips' | 'banishes'): number {
  return Math.max(0, Math.floor(state.stats[action]) - state.used[action]);
}

/**
 * Sorteia a raridade. Com Sorte `s`, o peso da raridade de índice `i` é multiplicado por
 * s^(i × expoente), então mais sorte puxa as raridades altas.
 */
export function rollRarity(state: RunState): number {
  const { tiers, luckExponentPerTier } = state.rules.rarities;
  const luck = Math.max(0.01, state.stats.luck);
  const indices = tiers.map((_, i) => i);
  return (
    state.rng.weighted(indices, (i) => tiers[i]!.weight * luck ** (i * luckExponentPerTier)) ?? 0
  );
}

/** Valor do modificador com a raridade; atributos inteiros arredondam, sem ficar abaixo do comum. */
export function passiveAmount(def: PassiveDef, multiplier: number): number {
  const value = def.perLevel * multiplier;
  if (!def.integer) return value;
  const rounded = Math.round(value);
  return Math.abs(rounded) < Math.abs(def.perLevel) ? def.perLevel : rounded;
}

/** Modificadores que ainda podem aparecer, respeitando nível máximo, banidos e espaços. */
function availablePassives(state: RunState): PassiveId[] {
  const { passives } = state.rules;
  const ids = Object.keys(passives) as PassiveId[];
  const held = ids.filter((id) => (state.passives[id]?.level ?? 0) > 0 && !passives[id].freeSlot);
  const slotsFull = held.length >= Math.floor(state.stats.modifierSlots);
  return ids.filter((id) => {
    const level = state.passives[id]?.level ?? 0;
    if (level >= passives[id].maxLevel) return false;
    if (state.banished.includes(`passive:${id}`)) return false;
    // Com os espaços cheios, só melhora o que já tem (ou o que não ocupa espaço).
    if (slotsFull && level === 0 && !passives[id].freeSlot) return false;
    return true;
  });
}

/** Opções do level up atual; sorteia na primeira chamada e repete até a escolha. */
export function levelUpOffer(state: RunState): UpgradeChoice[] {
  if (state.offer) return state.offer;

  type Candidate = { kind: 'weapon' } | { kind: 'passive'; id: PassiveId };
  const pool: Candidate[] = [];
  if (state.weaponLevel < weaponMaxLevel(state.rules) && !state.banished.includes('weapon')) {
    pool.push({ kind: 'weapon' });
  }
  for (const id of availablePassives(state)) pool.push({ kind: 'passive', id });

  const count = Math.floor(state.stats.choices);
  const offer: UpgradeChoice[] = [];
  while (offer.length < count && pool.length > 0) {
    const pick = pool.splice(state.rng.int(pool.length), 1)[0]!;
    if (pick.kind === 'weapon') {
      offer.push({ kind: 'weapon', level: state.weaponLevel + 1 });
      continue;
    }
    const def = state.rules.passives[pick.id];
    const rarity = rollRarity(state);
    offer.push({
      kind: 'passive',
      id: pick.id,
      level: (state.passives[pick.id]?.level ?? 0) + 1,
      rarity,
      amount: passiveAmount(def, state.rules.rarities.tiers[rarity]!.multiplier),
    });
  }
  if (offer.length === 0) offer.push({ kind: 'heal', amount: FALLBACK_HEAL });

  state.offer = offer;
  return offer;
}

export function applyChoice(state: RunState, choice: UpgradeChoice): void {
  if (state.pendingLevelUps <= 0) return;

  const before = state.stats.maxInteractions;
  switch (choice.kind) {
    case 'weapon':
      state.weaponLevel = choice.level;
      break;
    case 'passive': {
      const current = state.passives[choice.id] ?? { level: 0, bonus: 0 };
      state.passives[choice.id] = {
        level: current.level + 1,
        bonus: current.bonus + choice.amount,
      };
      break;
    }
    case 'heal':
      state.agent.interactions = Math.min(
        state.stats.maxInteractions,
        state.agent.interactions + choice.amount,
      );
      break;
  }
  state.stats = computeStats(state.rules, state.passives);
  // Interações máximas a mais também entram no estoque atual.
  state.agent.interactions += Math.max(0, state.stats.maxInteractions - before);

  state.offer = null;
  state.pendingLevelUps--;
}

/** Sorteia novas opções, gastando um Rerrolar. Devolve false se não houver usos. */
export function rerollOffer(state: RunState): boolean {
  if (state.pendingLevelUps <= 0 || remaining(state, 'rerolls') === 0) return false;
  state.used.rerolls++;
  state.offer = null;
  return true;
}

/** Recusa este level up, gastando um Pular. */
export function skipLevelUp(state: RunState): boolean {
  if (state.pendingLevelUps <= 0 || remaining(state, 'skips') === 0) return false;
  state.used.skips++;
  state.offer = null;
  state.pendingLevelUps--;
  return true;
}

/** Tira a opção do sorteio pelo resto da run e sorteia de novo, gastando um Banir. */
export function banishChoice(state: RunState, choice: UpgradeChoice): boolean {
  if (choice.kind === 'heal' || state.pendingLevelUps <= 0) return false;
  if (remaining(state, 'banishes') === 0) return false;
  state.used.banishes++;
  state.banished.push(choiceKey(choice));
  state.offer = null;
  return true;
}
