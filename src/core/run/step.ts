import type { EnemyKind } from '../../config';
import { clampLength, type Vec2 } from '../math/vec2';
import { heal } from './combat';
import { difficultyAt, enemyHpAt, waveFactorAt, xpToNextLevel } from './progression';
import { addAggregate } from './aggregates';
import { updateFormations } from './formations';
import { collideWithMap, updateDestructibles, updateRunMap } from './mapStep';
import { updateStructures } from './structures';
import { extendFever, updateItems } from './items';
import { hurtAgent } from './hurt';
import { agentFxSpeed, updateBehaviors } from './behaviors';
import { refreshStats } from './upgrades';
import { SpatialGrid } from './spatialGrid';
import { applySpecialFields, updateSpecial } from './specials';
import { addEnemy, type Enemy, type RunState } from './state';
import {
  applyFields,
  GRID_CELL,
  moveProjectiles,
  updatePulses,
  updateWeapons,
  updateZones,
} from './weapons';

export interface StepInput {
  /** Direção pedida pelo jogador, comprimento de 0 a 1. */
  move: Vec2;
  /** Distância do agente até a borda mais longe da tela; os inimigos nascem além dela. */
  viewRadius: number;
  /** O jogador pediu o especial neste passo. */
  special?: boolean;
}

const grid = new SpatialGrid(GRID_CELL);

/**
 * Avança a run em `dt` segundos. Chamado em passos fixos (decisão 0012). Não faz nada com a run
 * encerrada ou com um level up esperando escolha.
 */
export function stepRun(state: RunState, input: StepInput, dt: number): void {
  if (state.over || state.pendingLevelUps > 0 || state.capsule || state.ampoule) return;
  if (state.synapseOffer) return;
  state.time += dt;
  state.viewRadius = input.viewRadius;

  moveAgent(state, input.move, dt);
  updateRunMap(state);
  updateSpecial(state, input.special === true, dt);
  spawnEnemies(state, input.viewRadius, dt);

  grid.clear();
  state.enemies.forEach((e, i) => grid.insert(i, e.x, e.y));

  // Acontecimentos a partir daqui são deste passo (as vesículas olham só os golpes dele).
  const firstEvent = state.events.length;
  applyFields(state, dt, grid);
  updateBehaviors(state, dt, grid);
  applySpecialFields(state);
  moveEnemies(state, dt);
  collideWithMap(state);
  updateWeapons(state, dt, grid);
  moveProjectiles(state, dt, grid);
  updatePulses(state, dt, grid);
  updateZones(state, dt, grid);
  updateItems(state, dt, grid, firstEvent);
  updateDestructibles(state, firstEvent);
  touchAgent(state, dt);
  updateGems(state, dt);
  updateCoins(state, dt);
  removeDead(state);
}

function moveAgent(state: RunState, intent: Vec2, dt: number): void {
  const dir = clampLength(intent, 1);
  const speed =
    state.rules.run.agent.moveSpeedPxPerSecond * state.stats.moveSpeed * agentFxSpeed(state);
  state.agent.x += dir.x * speed * dt;
  state.agent.y += dir.y * speed * dt;
  if (dir.x !== 0) state.agent.facingX = Math.sign(dir.x);
  const len = Math.hypot(dir.x, dir.y);
  if (len > 0.01) {
    state.agent.dirX = dir.x / len;
    state.agent.dirY = dir.y / len;
  }
}

function spawnAround(state: RunState, distance: number): { x: number; y: number } {
  const angle = state.rng.range(0, Math.PI * 2);
  return {
    x: state.agent.x + Math.cos(angle) * distance,
    y: state.agent.y + Math.sin(angle) * distance,
  };
}

function spawnEnemies(state: RunState, viewRadius: number, dt: number): void {
  const { run, economy, enemies } = state.rules;
  const difficulty = difficultyAt(state.time, economy.difficulty);
  const hp = enemyHpAt(state.time, economy.difficulty);
  const distance = viewRadius + run.spawn.marginOutsideViewPx;

  // Chefes no começo de cada pico do dente de serra.
  // O chefe marcado com `local` vira o chefe do local da run (fase 5.14).
  run.bosses.forEach((b, i) => {
    if (b.max !== undefined && state.bossesSpawned[i]! >= b.max) return;
    const next = (state.bossesSpawned[i]! + 1) * b.everyMinutes * 60;
    if (state.time < next) return;
    state.bossesSpawned[i]!++;
    const env = state.rules.mapEnv;
    const kind = (b.local && env ? state.rules.map.environments[env].boss : b.kind) as EnemyKind;
    const at = spawnAround(state, distance);
    addEnemy(state, kind, at.x, at.y, hp);
    state.events.push({ type: 'boss', kind });
  });

  spawnAggregate(state, distance, hp);
  updateFormations(state, distance, hp);
  updateStructures(state, dt, distance, hp);

  const rate =
    run.spawn.baseEnemiesPerSecond *
    difficulty *
    waveFactorAt(state.time, economy.difficulty) *
    (1 + state.stats.curse * run.curse.quantity);
  state.spawnBudget += rate * dt;

  const minute = state.time / 60;
  const unlocked = (Object.keys(enemies) as EnemyKind[]).filter(
    (k) => enemies[k].unlockMinute <= minute && enemies[k].spawnWeight > 0 && !enemies[k].boss,
  );

  while (state.spawnBudget >= 1 && state.enemies.length < run.spawn.maxEnemies) {
    const kind = state.rng.weighted(unlocked, (k) => enemies[k].spawnWeight);
    if (!kind) break;
    const c = spawnAround(state, distance);
    const group = enemies[kind].groupSize;
    for (let i = 0; i < group && state.enemies.length < run.spawn.maxEnemies; i++) {
      const spread = i === 0 ? 0 : run.spawn.groupSpreadPx;
      addEnemy(
        state,
        kind,
        c.x + state.rng.range(-spread, spread),
        c.y + state.rng.range(-spread, spread),
        hp,
      );
    }
    state.spawnBudget -= group;
  }
  // Não acumula nascimentos enquanto a tela está cheia.
  if (state.enemies.length >= run.spawn.maxEnemies) {
    state.spawnBudget = Math.min(state.spawnBudget, 1);
  }

  // Inimigos que ficaram muito para trás voltam para perto, como no Vampire Survivors;
  // sem isso, fugir em linha reta deixa o limite de inimigos ocupado por quem não alcança.
  // Chefes nunca são reposicionados; agregados voltam pela frente (abaixo).
  const far = distance * 2;
  const ag = run.aggregates;
  const farAggregate = distance * ag.relocateDistanceFactor;
  for (const e of state.enemies) {
    if (e.boss) continue;
    const d2 = (e.x - state.agent.x) ** 2 + (e.y - state.agent.y) ** 2;
    // Agregado (mini chefe) que ficou para trás reaparece na frente do agente, logo fora da
    // tela na direção do movimento, com a vida que tinha.
    if (e.aggregate) {
      if (d2 < farAggregate * farAggregate) continue;
      const angle =
        Math.atan2(state.agent.dirY, state.agent.dirX) +
        state.rng.range(-ag.relocateSpreadRadians, ag.relocateSpreadRadians);
      e.x = state.agent.x + Math.cos(angle) * distance;
      e.y = state.agent.y + Math.sin(angle) * distance;
      continue;
    }
    if (d2 < far * far) continue;
    // Quem atravessa a tela em linha reta só some: voltar para perto desfaria a formação.
    if (e.straight) {
      e.hp = 0;
      continue;
    }
    const at = spawnAround(state, distance);
    e.x = at.x;
    e.y = at.y;
  }
}

/**
 * Agregado (mini chefe, fase 5.10): num momento sorteado, pelo menos um por minuto, a molécula
 * forte mais comum agora (o peso já vem puxado pela doença) nasce maior e bem mais forte. Antes
 * de haver molécula forte liberada, vem a que libera primeiro.
 */
function spawnAggregate(state: RunState, distance: number, hp: number): void {
  const ag = state.rules.run.aggregates;
  const gap = () => state.rng.range(ag.minGapSeconds, ag.maxGapSeconds);
  if (state.nextAggregateAt < 0) state.nextAggregateAt = gap();
  if (state.time < state.nextAggregateAt) return;
  state.nextAggregateAt = state.time + gap();
  const at = spawnAround(state, distance);
  addAggregate(state, at.x, at.y, hp);
}

function moveEnemies(state: RunState, dt: number): void {
  const { agent } = state;
  const push = Math.min(1, state.rules.run.separation.strength * dt);
  // Gelo seco: as moléculas ficam paradas, inclusive as que chegam durante o efeito.
  const frozen = state.effects.freeze > 0;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i]!;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    const dx = agent.x - e.x;
    const dy = agent.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.frozen = Math.max(0, e.frozen - dt);
    if (e.straight && !frozen && e.frozen <= 0) {
      e.x += e.dirX * e.speed * e.slow * dt;
      e.y += e.dirY * e.speed * e.slow * dt;
    } else if (dist > 0.001 && !frozen && e.frozen <= 0) {
      // Rumo: direto ao agente, girado pelo desvio dos erráticos; quem mantém distância recua.
      const away = e.keepAway > 0 && dist < e.keepAway ? -1 : 1;
      const room = e.keepAway > 0 ? Math.abs(dist - e.keepAway) : dist;
      const step = Math.min(e.speed * e.slow * dt, room);
      const c = Math.cos(e.heading);
      const s = Math.sin(e.heading);
      const ux = ((dx * c - dy * s) / dist) * away;
      const uy = ((dx * s + dy * c) / dist) * away;
      e.x += ux * step;
      e.y += uy * step;
    }
    grid.query(e.x, e.y, e.radius * 2, (j) => {
      if (j <= i) return;
      const o = state.enemies[j];
      if (!o) return;
      const ox = o.x - e.x;
      const oy = o.y - e.y;
      const d = Math.hypot(ox, oy);
      const overlap = e.radius + o.radius - d;
      if (overlap <= 0 || d < 0.001) return;
      // O chefe não é empurrado pelos menores.
      const share = e.boss ? 0 : o.boss ? 1 : 0.5;
      const nx = (ox / d) * overlap * push;
      const ny = (oy / d) * overlap * push;
      e.x -= nx * share;
      e.y -= ny * share;
      o.x += nx * (1 - share);
      o.y += ny * (1 - share);
    });
  }
}

function touchAgent(state: RunState, dt: number): void {
  const { agent, stats, rules } = state;
  // Homeostase: recupera interações aos poucos.
  if (stats.regenPerSecond > 0) heal(state, stats.regenPerSecond * dt);
  agent.invulnerableFor = Math.max(0, agent.invulnerableFor - dt);
  const agentRadius = rules.run.agent.radiusPx;
  // Gelo seco: moléculas congeladas não gastam interações, e o agente as empurra.
  if (state.effects.freeze > 0) {
    grid.query(agent.x, agent.y, agentRadius + GRID_CELL * 2, (j) => {
      const e = state.enemies[j];
      if (!e) return;
      const dx = e.x - agent.x;
      const dy = e.y - agent.y;
      const d = Math.hypot(dx, dy);
      const overlap = e.radius + agentRadius - d;
      if (overlap <= 0 || d < 0.001 || e.boss) return;
      e.x += (dx / d) * overlap;
      e.y += (dy / d) * overlap;
    });
    return;
  }
  if (agent.invulnerableFor > 0) return;

  let attacker: Enemy | undefined;
  grid.query(agent.x, agent.y, agentRadius + GRID_CELL * 2, (j) => {
    const e = state.enemies[j];
    if (!e || e.hp <= 0) return;
    if ((e.x - agent.x) ** 2 + (e.y - agent.y) ** 2 > (e.radius + agentRadius) ** 2) return;
    if (!attacker || e.contactDamage > attacker.contactDamage) attacker = e;
  });
  if (!attacker) return;

  hurtAgent(state, attacker.contactDamage, attacker);
}

/** ATP no chão: atraído pelo mesmo raio de coleta das gemas, com Rendimento ao coletar. */
function updateCoins(state: RunState, dt: number): void {
  const { agent, rules, stats } = state;
  const pull = rules.run.agent.pickupRadiusPx * stats.magnet;
  const speed = rules.run.gems.attractSpeedPxPerSecond;
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i]!;
    const dx = agent.x - c.x;
    const dy = agent.y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= rules.run.gems.collectRadiusPx) {
      state.atp += c.value * stats.currencyGain;
      extendFever(state);
      state.coins[i] = state.coins[state.coins.length - 1]!;
      state.coins.pop();
      continue;
    }
    if (dist < pull) c.attracted = true;
    if (c.attracted) {
      const step = Math.min(speed * dt, dist);
      c.x += (dx / dist) * step;
      c.y += (dy / dist) * step;
    }
  }
}

function updateGems(state: RunState, dt: number): void {
  const { agent, rules, stats } = state;
  const pull = rules.run.agent.pickupRadiusPx * stats.magnet;
  const speed = rules.run.gems.attractSpeedPxPerSecond;

  for (let i = state.gems.length - 1; i >= 0; i--) {
    const g = state.gems[i]!;
    const dx = agent.x - g.x;
    const dy = agent.y - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= rules.run.gems.collectRadiusPx) {
      state.xp += g.value * stats.xpGain;
      state.gems[i] = state.gems[state.gems.length - 1]!;
      state.gems.pop();
      continue;
    }
    if (dist < pull) g.attracted = true;
    if (g.attracted) {
      const step = Math.min(speed * dt, dist);
      g.x += (dx / dist) * step;
      g.y += (dy / dist) * step;
    }
  }

  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level++;
    state.xpToNext = xpToNextLevel(state.level, rules.economy.xp);
    state.pendingLevelUps++;
    state.events.push({ type: 'levelUp', level: state.level });
    if (state.level % rules.run.nativeReceptor.everyLevels === 0) refreshStats(state);
  }
}

function removeDead(state: RunState): void {
  state.enemies = state.enemies.filter((e) => e.hp > 0);
  state.projectiles = state.projectiles.filter((p) => p.life > 0);
  // Limpa marcas de golpe de inimigos que já morreram.
  if (Math.floor(state.time) !== Math.floor(state.time - 1 / 60)) {
    const alive = new Set(state.enemies.map((e) => e.id));
    for (const w of state.weapons)
      for (const id of w.lastHit.keys()) if (!alive.has(id)) w.lastHit.delete(id);
  }
}
