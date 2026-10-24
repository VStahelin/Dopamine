import type { PassiveDef, PassiveId, RunStatKey, WeaponId } from '../../config';
import type { BaseSource } from './rules';
import { addBonus, newWeapon, type BonusSource, type RunState } from './state';
import { agentBonus, computeStats, statDef, type RunStats } from './stats';
import { COUNT_KINDS, weaponMaxLevel } from './weaponParams';

export type UpgradeChoice =
  /**
   * Arma nova (nível 1) ou o próximo nível de uma arma que o agente já tem. O nível sorteia
   * raridade, que multiplica o ganho dele (decisão 0027); a arma nova não tem.
   */
  | { kind: 'weapon'; id: WeaponId; level: number; rarity?: number }
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
  | { kind: 'heal'; amount: number }
  /**
   * Superdosagem (fase 5.6, decisão 0030): com armas e receptores no máximo, um bônus pequeno de
   * atributo, comum, sem ocupar espaço. Usa o valor por nível do passivo daquele atributo.
   */
  | { kind: 'boost'; id: PassiveId; amount: number; rarity?: number }
  /** Nada mais para subir: ATP em moedas do valor atual (Fosfocreatina). */
  | { kind: 'phosphocreatine'; coins: number };

/** Atributos que a Mutação não sorteia: os de level up e espaços, que só vêm do Laboratório. */
const MUTATION_SKIP: readonly RunStatKey[] = [
  'choices',
  'rerolls',
  'skips',
  'banishes',
  'weaponSlots',
  'modifierSlots',
  'curse',
];

/** Interações recuperadas quando não sobra nenhum upgrade para oferecer. */
const FALLBACK_HEAL = 30;

/** Identifica a opção para banir: a arma ou um modificador, sem nível nem raridade. */
export function choiceKey(choice: UpgradeChoice): string {
  if (choice.kind === 'heal' || choice.kind === 'phosphocreatine') return choice.kind;
  if (choice.kind === 'boost') return `boost:${choice.id}`;
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

/**
 * Receptores e reagentes que ainda podem aparecer, respeitando liberados, nível máximo, banidos e
 * espaços. Os outros modificadores ficam fora do level up (decisão 0027).
 */
function availablePassives(state: RunState): PassiveId[] {
  const { passives, unlockedReceptors } = state.rules;
  // Os reagentes saíram das cartas: vêm das ampolas, como suplemento (decisão 0028).
  const ids = (Object.keys(passives) as PassiveId[]).filter(
    (id) =>
      passives[id].kind === 'receptor' && (!unlockedReceptors || unlockedReceptors.includes(id)),
  );
  const held = ids.filter((id) => (state.passives[id]?.level ?? 0) > 0 && !passives[id].freeSlot);
  const slotsFull = held.length >= Math.floor(state.stats.modifierSlots);
  return ids.filter((id) => {
    const level = state.passives[id]?.level ?? 0;
    if (level >= passives[id].maxLevel) return false;
    if (!receptorUseful(state, passives[id].stat)) return false;
    if (state.banished.includes(`passive:${id}`)) return false;
    // Com os espaços cheios, só melhora o que já tem (ou o que não ocupa espaço).
    if (slotsFull && level === 0 && !passives[id].freeSlot) return false;
    return true;
  });
}

/**
 * O receptor muda algo nas armas de agora? A Dose só aparece com uma arma que dispara vários
 * objetos; antes, ela vinha para quem só tinha o pulso e parecia upgrade de arma alheia (MEC-1).
 */
function receptorUseful(state: RunState, stat: RunStatKey): boolean {
  if (stat !== 'projectiles') return true;
  return state.weapons.some((w) => COUNT_KINDS.includes(state.rules.weapons[w.id].kind));
}

/** Evoluções prontas: arma no nível máximo com o reagente que ela pede. */
export function readyEvolutions(state: RunState): UpgradeChoice[] {
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
      // Armas ainda não desbloqueadas no menu não aparecem.
      if (state.rules.unlockedWeapons && !state.rules.unlockedWeapons.includes(id)) continue;
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
    if (pick.kind === 'weapon' && pick.level > 1) {
      offer.push({ ...pick, rarity: rollRarity(state) });
      continue;
    }
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
  if (offer.length === 0) {
    const boosts = overdoseOffer(state, count);
    if (boosts.length > 0 && !state.overdose) {
      state.overdose = true;
      state.events.push({ type: 'overdose' });
    }
    offer.push(...boosts, { kind: 'heal', amount: FALLBACK_HEAL });
    if (boosts.length === 0) {
      offer.push({ kind: 'phosphocreatine', coins: state.rules.drops.phosphocreatine.coins });
    }
  }

  state.offer = offer;
  return offer;
}

export function applyChoice(state: RunState, choice: UpgradeChoice): void {
  if (state.pendingLevelUps <= 0) return;
  applyUpgrade(state, choice);
  state.offer = null;
  state.pendingLevelUps--;
}

/** Aplica um upgrade (do level up ou da cápsula) e recalcula os atributos. */
export function applyUpgrade(state: RunState, choice: UpgradeChoice): void {
  const before = state.stats.maxInteractions;
  switch (choice.kind) {
    case 'weapon': {
      const owned = state.weapons.find((w) => w.id === choice.id);
      if (owned) {
        // Sempre o próximo nível da arma, nunca o da carta: uma carta sorteada antes (level up,
        // cápsula) com o mesmo nível sobrescrevia o ganho de raridade e tirava disparos (BUG-2).
        if (owned.level >= weaponMaxLevel(state.rules.weapons[owned.id])) break;
        owned.level++;
        owned.boosts[owned.level - 2] = rarityMultiplier(state, choice.rarity);
      } else state.weapons.push(newWeapon(choice.id));
      break;
    }
    case 'evolve': {
      const i = state.weapons.findIndex((w) => w.id === choice.id);
      if (i >= 0) state.weapons[i] = newWeapon(choice.into);
      break;
    }
    case 'passive': {
      if (state.rules.passives[choice.id].mutation) mutate(state, choice.rarity);
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
    case 'phosphocreatine':
      state.atp += choice.coins * coinValue(state) * state.stats.currencyGain;
      break;
    case 'boost': {
      const def = state.rules.passives[choice.id];
      for (const stat of [def.stat, def.alsoStat]) {
        if (stat) addBonus(state, 'card', stat, choice.amount);
      }
      break;
    }
  }
  refreshStats(state);
  // Interações máximas a mais também entram no estoque atual.
  state.agent.interactions += Math.max(0, state.stats.maxInteractions - before);
}

/** Recalcula os atributos com os receptores, o receptor nativo e o que a run somou fora deles. */
export function refreshStats(state: RunState): void {
  state.stats = statsWith(state, state.passives, state.bonus);
}

function statsWith(
  state: RunState,
  passives: RunState['passives'],
  extra: RunState['bonus'],
): RunStats {
  const bonus = { ...extra };
  const own = agentBonus(state.rules, state.agentId, nativeLevel(state));
  for (const [k, v] of Object.entries(own) as [RunStatKey, number][])
    bonus[k] = (bonus[k] ?? 0) + v;
  return computeStats(state.rules, passives, bonus);
}

/**
 * Atributos depois de um receptor ou bônus, sem mexer na run (prévia do level up). Devolve
 * `null` para o que não mexe em atributo ou é sorteado na hora (Mutação).
 */
export function statsAfter(state: RunState, choice: UpgradeChoice): RunStats | null {
  if (choice.kind === 'passive') {
    if (state.rules.passives[choice.id].mutation) return null;
    const current = state.passives[choice.id] ?? { level: 0, bonus: 0 };
    const passives = {
      ...state.passives,
      [choice.id]: { level: current.level + 1, bonus: current.bonus + choice.amount },
    };
    return statsWith(state, passives, state.bonus);
  }
  if (choice.kind === 'boost') {
    const def = state.rules.passives[choice.id];
    const bonus = { ...state.bonus };
    for (const stat of [def.stat, def.alsoStat]) {
      if (stat) bonus[stat] = (bonus[stat] ?? 0) + choice.amount;
    }
    return statsWith(state, state.passives, bonus);
  }
  return null;
}

/**
 * Nível do receptor nativo: 1 a cada tantos níveis de run, até o máximo (fase 5.6), somado ao
 * nível inicial da sinergia agente × local (fase 5.12).
 */
export function nativeLevel(state: RunState): number {
  const n = state.rules.run.nativeReceptor;
  const start = state.rules.nativeReceptorStart ?? 0;
  return Math.min(n.maxLevel, start + Math.floor(state.level / n.everyLevels));
}

/**
 * Cartas da Superdosagem: atributos abaixo do teto na run, um por passivo (sem reagentes, sem a
 * Mutação e sem os de level up), sorteados.
 */
function overdoseOffer(state: RunState, count: number): UpgradeChoice[] {
  const { passives } = state.rules;
  const seen = new Set<string>();
  const ids = (Object.keys(passives) as PassiveId[]).filter((id) => {
    const def = passives[id];
    if (def.kind === 'reagent' || def.mutation || MUTATION_SKIP.includes(def.stat)) return false;
    if (seen.has(def.stat) || atCap(state, def.stat)) return false;
    seen.add(def.stat);
    return true;
  });
  const out: UpgradeChoice[] = [];
  while (out.length < count && ids.length > 0) {
    const id = ids.splice(state.rng.int(ids.length), 1)[0]!;
    out.push({ kind: 'boost', id, amount: passives[id].perLevel });
  }
  return out;
}

function atCap(state: RunState, stat: RunStatKey): boolean {
  const def = statDef(state.rules, stat);
  if (def.runCap === null) return false;
  return def.runCap < def.base ? state.stats[stat] <= def.runCap : state.stats[stat] >= def.runCap;
}

export function rarityMultiplier(state: RunState, rarity: number | undefined): number {
  return rarity === undefined ? 1 : (state.rules.rarities.tiers[rarity]?.multiplier ?? 1);
}

/**
 * Mutação: soma um nível de um atributo sorteado entre todos os receptores e modificadores, com a
 * raridade da carta. O bônus vai em `state.bonus`, fora do receptor.
 */
function mutate(state: RunState, rarity: number): void {
  const { passives } = state.rules;
  const ids = (Object.keys(passives) as PassiveId[]).filter((id) => {
    const def = passives[id];
    return def.kind !== 'reagent' && !def.mutation && !MUTATION_SKIP.includes(def.stat);
  });
  const id = ids[state.rng.int(ids.length)];
  if (!id) return;
  const def = passives[id];
  const amount = passiveAmount(def, rarityMultiplier(state, rarity));
  for (const stat of [def.stat, def.alsoStat]) {
    if (stat) addBonus(state, 'mutation', stat, amount);
  }
}

/** Valor de uma moeda de ATP agora: cresce com o tempo de run (economy.json runCurrency). */
export function coinValue(state: RunState): number {
  const c = state.rules.economy.runCurrency;
  return c.baseValue * (1 + (c.valuePerMinute * state.time) / 60);
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
  if (choice.kind === 'heal' || choice.kind === 'phosphocreatine' || choice.kind === 'boost') {
    return false;
  }
  if (state.pendingLevelUps <= 0) return false;
  if (remaining(state, 'banishes') === 0) return false;
  state.used.banishes++;
  state.banished.push(choiceKey(choice));
  state.offer = null;
  return true;
}

/** Origem de um bônus de atributo, na ordem em que a pausa mostra. */
export type StatSource = BaseSource | 'native' | 'receptor' | BonusSource;

/**
 * "De onde vem" um atributo (fase 5.13): quanto cada origem soma por cima da base do stats.json.
 * Só aparecem as origens que somam algo; o teto da run vale depois, sobre o total.
 */
export function statSources(
  state: RunState,
  key: RunStatKey,
): { source: StatSource; amount: number }[] {
  const out: { source: StatSource; amount: number }[] = [];
  const push = (source: StatSource, amount: number | undefined) => {
    if (amount && Math.abs(amount) > 1e-9) out.push({ source, amount });
  };
  const base = state.rules.baseSources ?? {};
  push('lab', base.lab?.[key]);
  push('organism', base.organism?.[key]);
  push('local', base.local?.[key]);
  push('native', agentBonus(state.rules, state.agentId, nativeLevel(state))[key]);
  let receptors = 0;
  for (const [id, p] of Object.entries(state.passives) as [PassiveId, { bonus: number }][]) {
    const def = state.rules.passives[id];
    if (def.mutation) continue;
    if (def.stat === key || def.alsoStat === key) receptors += p.bonus;
  }
  push('receptor', receptors);
  for (const source of ['supplement', 'card', 'mutation', 'structure'] as const) {
    push(source, state.bonusBy[source]?.[key]);
  }
  return out;
}
