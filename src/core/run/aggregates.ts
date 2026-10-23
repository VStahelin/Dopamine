import type { EnemyKind } from '../../config';
import { addEnemy, type Enemy, type RunState } from './state';

/**
 * Agregados, os mini chefes (fase 5.10): a molécula forte mais comum agora (o peso já vem puxado
 * pela doença) nasce maior e bem mais forte. Antes de haver molécula forte liberada, vem a que
 * libera primeiro. Usado pelo relógio dos agregados e pelo Coágulo (fase 5.11).
 */
export function aggregateKind(state: RunState): EnemyKind | undefined {
  const { enemies } = state.rules;
  const strong = (Object.keys(enemies) as EnemyKind[]).filter(
    (k) => enemies[k].contactDamage === 'strong' && !enemies[k].boss,
  );
  const unlocked = strong.filter((k) => enemies[k].unlockMinute <= state.time / 60);
  const pool = unlocked.length > 0 ? unlocked : strong;
  const by =
    unlocked.length > 0
      ? (k: EnemyKind) => enemies[k].spawnWeight
      : (k: EnemyKind) => -enemies[k].unlockMinute;
  return pool.reduce<EnemyKind | undefined>(
    (best, k) => (!best || by(k) > by(best) ? k : best),
    undefined,
  );
}

/** Cria um agregado em (x, y); `hp` é o multiplicador de vida do momento. */
export function addAggregate(state: RunState, x: number, y: number, hp: number): Enemy | null {
  const kind = aggregateKind(state);
  if (!kind) return null;
  const ag = state.rules.run.aggregates;
  const e = addEnemy(state, kind, x, y, hp * ag.hpMultiplier);
  e.aggregate = true;
  e.radius *= ag.sizeMultiplier;
  e.speed *= ag.speedMultiplier;
  e.xp *= ag.xpMultiplier;
  if (!state.seenAggregates.includes(kind)) state.seenAggregates.push(kind);
  state.events.push({ type: 'aggregate', kind });
  return e;
}
