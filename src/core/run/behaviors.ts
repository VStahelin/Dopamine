import type { EnemyBehavior, EnemyKind } from '../../config';
import { enemyHpAt } from './progression';
import { hurtAgent } from './hurt';
import { specialActive } from './specials';
import type { SpatialGrid } from './spatialGrid';
import { addEnemy, type Enemy, type RunState } from './state';
import { GRID_CELL } from './weapons';

/**
 * Comportamento por família (fase 5.14, decisão 0035): radicais erráticos, aura do estresse,
 * poças das toxinas, inflamação que gera moléculas e o Peróxido que estoura. Os números ficam em
 * `behaviors` de enemies.json; o movimento em si continua em step.ts (`moveEnemies`), que lê o
 * `heading` e o `keepAway` de cada molécula.
 */

function behaviorsOf(state: RunState, e: Enemy): readonly EnemyBehavior[] {
  return state.rules.enemies[e.kind].behaviors ?? [];
}

/** Põe uma poça tóxica no chão. */
export function addHazard(
  state: RunState,
  x: number,
  y: number,
  radius: number,
  seconds: number,
): void {
  state.hazards.push({ x, y, radius, life: seconds, maxLife: seconds });
}

/**
 * Um passo dos comportamentos, depois das auras e poças das armas (que zeram `slow` e
 * `vulnerability`) e antes do movimento.
 */
export function updateBehaviors(state: RunState, dt: number, grid: SpatialGrid): void {
  const { agent, rules } = state;
  const agentRadius = rules.run.agent.radiusPx;
  const children = new Map<number, number>();
  for (const e of state.enemies) {
    if (e.parent && e.hp > 0) children.set(e.parent, (children.get(e.parent) ?? 0) + 1);
  }
  // Aura do estresse: vale a mais forte em cada molécula, sem somar auras.
  const boost = new Map<Enemy, { speed: number; damageTaken: number }>();

  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    e.age += dt;
    for (const b of behaviorsOf(state, e)) {
      switch (b.kind) {
        case 'erratic':
          e.turnTimer -= dt;
          if (e.turnTimer <= 0) {
            e.turnTimer = b.turnSeconds;
            e.heading = state.rng.range(-1, 1) * ((b.angleDegrees * Math.PI) / 180);
          }
          break;
        case 'aura':
          // Calmaria (Serotonina): as auras do estresse ficam desligadas.
          if (specialActive(state, 'calm')) break;
          grid.query(e.x, e.y, b.radiusPx + GRID_CELL, (j) => {
            const o = state.enemies[j];
            if (!o || o === e || o.hp <= 0) return;
            if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 > b.radiusPx ** 2) return;
            const cur = boost.get(o);
            boost.set(o, {
              speed: Math.max(cur?.speed ?? 0, b.speed),
              damageTaken: Math.min(cur?.damageTaken ?? 0, b.damageTaken),
            });
          });
          break;
        case 'lifetime':
          // Some sem recompensa: não passa por damageEnemy.
          if (e.age >= b.seconds) e.hp = 0;
          break;
        case 'poolTrail':
          e.actTimer -= dt;
          if (e.actTimer <= 0) {
            e.actTimer = b.everySeconds;
            addHazard(state, e.x, e.y, b.radiusPx, b.seconds);
          }
          break;
        case 'spawner':
          e.actTimer -= dt;
          if (e.actTimer <= 0) {
            e.actTimer = b.everySeconds;
            if ((children.get(e.id) ?? 0) >= b.max) break;
            if (state.enemies.length >= rules.run.spawn.maxEnemies) break;
            const angle = state.rng.range(0, Math.PI * 2);
            const d = e.radius + 8;
            const child = addEnemy(
              state,
              b.spawn as EnemyKind,
              e.x + Math.cos(angle) * d,
              e.y + Math.sin(angle) * d,
              enemyHpAt(state.time, rules.economy.difficulty),
            );
            child.parent = e.id;
            child.fragment = true;
            children.set(e.id, (children.get(e.id) ?? 0) + 1);
            state.events.push({ type: 'spawned', x: e.x, y: e.y });
          }
          break;
        case 'burst': {
          const r = e.radius + agentRadius;
          if ((e.x - agent.x) ** 2 + (e.y - agent.y) ** 2 > r * r) break;
          e.hp = 0;
          state.events.push({ type: 'strike', x: e.x, y: e.y, radius: e.radius * 2 });
          if (agent.invulnerableFor <= 0 && state.effects.freeze <= 0) {
            hurtAgent(state, e.contactDamage, e);
          }
          break;
        }
        default:
          break;
      }
    }
  }
  for (const [o, b] of boost) {
    o.slow *= 1 + b.speed;
    o.vulnerability += b.damageTaken;
  }
  updateHazards(state, dt);
}

/** Poças tóxicas: somem com o tempo; dentro delas, o agente fica lento e perde interações. */
function updateHazards(state: RunState, dt: number): void {
  const { agent, rules } = state;
  const fx = state.agentFx;
  fx.slow = Math.max(0, fx.slow - dt);
  fx.rush = Math.max(0, fx.rush - dt);
  for (const h of state.hazards) h.life -= dt;
  state.hazards = state.hazards.filter((h) => h.life > 0);
  const inside = state.hazards.some(
    (h) => (h.x - agent.x) ** 2 + (h.y - agent.y) ** 2 <= h.radius ** 2,
  );
  if (!inside) {
    fx.poolTick = 0;
    return;
  }
  fx.slow = rules.run.agentEffects.slow.lingerSeconds;
  fx.poolTick += dt;
  if (fx.poolTick < rules.run.pools.tickSeconds) return;
  fx.poolTick = 0;
  if (state.effects.freeze > 0 || state.over) return;
  hurtAgent(state, rules.run.pools.interactionsPerTick);
}

/** Multiplicador da Mobilidade do agente pelos efeitos de inimigo (Lentidão, Adrenalina). */
export function agentFxSpeed(state: RunState): number {
  const fx = state.rules.run.agentEffects;
  let m = 1;
  if (state.agentFx.slow > 0) m += fx.slow.mobility;
  if (state.agentFx.rush > 0) m += fx.adrenaline.mobility;
  return Math.max(0.1, m);
}
