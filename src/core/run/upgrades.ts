import type { PassiveId } from '../../config';
import type { RunState } from './state';
import { computeStats, weaponMaxLevel } from './stats';

export type UpgradeChoice =
  | { kind: 'weapon'; level: number }
  | { kind: 'passive'; id: PassiveId; level: number }
  | { kind: 'heal'; amount: number };

/** Interações recuperadas quando não sobra nenhum upgrade para oferecer. */
const FALLBACK_HEAL = 30;

/** Opções do level up atual; sorteia na primeira chamada e repete até a escolha. */
export function levelUpOffer(state: RunState): UpgradeChoice[] {
  if (state.offer) return state.offer;

  const pool: UpgradeChoice[] = [];
  if (state.weaponLevel < weaponMaxLevel(state.rules)) {
    pool.push({ kind: 'weapon', level: state.weaponLevel + 1 });
  }
  for (const id of Object.keys(state.rules.passives) as PassiveId[]) {
    const current = state.passives[id] ?? 0;
    if (current < state.rules.passives[id].maxLevel) {
      pool.push({ kind: 'passive', id, level: current + 1 });
    }
  }

  const count = state.rules.stats.levelUp.choices!.base;
  const offer: UpgradeChoice[] = [];
  while (offer.length < count && pool.length > 0) {
    offer.push(pool.splice(state.rng.int(pool.length), 1)[0]!);
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
    case 'passive':
      state.passives[choice.id] = choice.level;
      break;
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
