import type { PassiveDef, PassiveId, WeaponId } from '../../config';
import { newWeapon, type RunState } from './state';
import { computeStats } from './stats';
import { weaponMaxLevel } from './weaponParams';

export type UpgradeChoice =
  /** Arma nova (nível 1) ou o próximo nível de uma arma que o agente já tem. */
  | { kind: 'weapon'; id: WeaponId; level: number }
  /** Arma no máximo + reagente: vira a arma evoluída. */
  | { kind: 'evolve'; id: WeaponId; into: WeaponId }
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
  if (choice.kind === 'heal') return 'heal';
  return `${choice.kind}:${choice.id}`;
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

/** Evoluções prontas: arma no nível máximo com o reagente que ela pede. */
function readyEvolutions(state: RunState): UpgradeChoice[] {
  const out: UpgradeChoice[] = [];
  for (const w of state.weapons) {
    const def = state.rules.weapons[w.id];
    if (!def.evolution || w.level < weaponMaxLevel(def)) continue;
    const reagent = def.evolution.reagent as PassiveId;
    if ((state.passives[reagent]?.level ?? 0) === 0) continue;
    if (state.banished.includes(`evolve:${w.id}`)) continue;
    out.push({ kind: 'evolve', id: w.id, into: def.evolution.into as WeaponId });
  }
  return out;
}

/** Armas que podem aparecer: melhorias das que já tem e, com espaço, as do pool. */
function availableWeapons(state: RunState): UpgradeChoice[] {
  const { weapons } = state.rules;
  const out: UpgradeChoice[] = [];
  for (const w of state.weapons) {
    if (w.level < weaponMaxLevel(weapons[w.id]) && !state.banished.includes(`weapon:${w.id}`)) {
      out.push({ kind: 'weapon', id: w.id, level: w.level + 1 });
    }
  }
  if (state.weapons.length < Math.floor(state.stats.weaponSlots)) {
    const owned = new Set(state.weapons.map((w) => w.id));
    for (const id of Object.keys(weapons) as WeaponId[]) {
      if (weapons[id].source !== 'pool' || owned.has(id)) continue;
      // Uma arma evoluída ocupa o lugar da original: a original não volta.
      if (state.weapons.some((w) => weapons[id].evolution?.into === w.id)) continue;
      if (state.banished.includes(`weapon:${id}`)) continue;
      out.push({ kind: 'weapon', id, level: 1 });
    }
  }
  return out;
}

/** Opções do level up atual; sorteia na primeira chamada e repete até a escolha. */
export function levelUpOffer(state: RunState): UpgradeChoice[] {
  if (state.offer) return state.offer;

  const count = Math.floor(state.stats.choices);
  // Evoluções prontas aparecem sempre, antes do sorteio.
  const offer: UpgradeChoice[] = readyEvolutions(state).slice(0, count);
  type Candidate = UpgradeChoice | { kind: 'passiveSlot'; id: PassiveId };
  const pool: Candidate[] = [
    ...availableWeapons(state),
    ...availablePassives(state).map((id) => ({ kind: 'passiveSlot' as const, id })),
  ];
  while (offer.length < count && pool.length > 0) {
    const pick = pool.splice(state.rng.int(pool.length), 1)[0]!;
    if (pick.kind !== 'passiveSlot') {
      offer.push(pick);
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
    case 'weapon': {
      const owned = state.weapons.find((w) => w.id === choice.id);
      if (owned) owned.level = choice.level;
      else state.weapons.push(newWeapon(choice.id));
      break;
    }
    case 'evolve': {
      const i = state.weapons.findIndex((w) => w.id === choice.id);
      if (i >= 0) state.weapons[i] = newWeapon(choice.into);
      break;
    }
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
