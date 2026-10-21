import type { EnemyKind } from '../../config';
import { clampLength, type Vec2 } from '../math/vec2';
import { difficultyAt, waveFactorAt, xpToNextLevel } from './progression';
import { SpatialGrid } from './spatialGrid';
import { addEnemy, type Enemy, type Projectile, type RunState } from './state';
import { weaponStats } from './stats';

export interface StepInput {
  /** Direção pedida pelo jogador, comprimento de 0 a 1. */
  move: Vec2;
  /** Distância do agente até a borda mais longe da tela; os inimigos nascem além dela. */
  viewRadius: number;
}

const GRID_CELL = 32;
const grid = new SpatialGrid(GRID_CELL);

/**
 * Avança a run em `dt` segundos. Chamado em passos fixos (decisão 0012). Não faz nada com a run
 * encerrada ou com um level up esperando escolha.
 */
export function stepRun(state: RunState, input: StepInput, dt: number): void {
  if (state.over || state.pendingLevelUps > 0) return;
  state.time += dt;

  moveAgent(state, input.move, dt);
  spawnEnemies(state, input.viewRadius, dt);

  grid.clear();
  state.enemies.forEach((e, i) => grid.insert(i, e.x, e.y));

  moveEnemies(state, dt);
  fireWeapon(state, dt);
  moveProjectiles(state, dt);
  touchAgent(state, dt);
  updateGems(state, dt);
  removeDead(state);
}

function moveAgent(state: RunState, intent: Vec2, dt: number): void {
  const dir = clampLength(intent, 1);
  const speed = state.rules.run.agent.moveSpeedPxPerSecond * state.stats.moveSpeed;
  state.agent.x += dir.x * speed * dt;
  state.agent.y += dir.y * speed * dt;
  if (dir.x !== 0) state.agent.facingX = Math.sign(dir.x);
}

function spawnEnemies(state: RunState, viewRadius: number, dt: number): void {
  const { run, economy, enemies } = state.rules;
  const difficulty = difficultyAt(state.time, economy.difficulty);
  const rate =
    run.spawn.baseEnemiesPerSecond *
    difficulty *
    waveFactorAt(state.time, economy.difficulty) *
    (1 + state.stats.curse * run.curse.quantity);
  state.spawnBudget += rate * dt;

  const minute = state.time / 60;
  const unlocked = (Object.keys(enemies) as EnemyKind[]).filter(
    (k) => enemies[k].unlockMinute <= minute,
  );
  const distance = viewRadius + run.spawn.marginOutsideViewPx;

  while (state.spawnBudget >= 1 && state.enemies.length < run.spawn.maxEnemies) {
    const kind = state.rng.weighted(unlocked, (k) => enemies[k].spawnWeight);
    if (!kind) break;
    const angle = state.rng.range(0, Math.PI * 2);
    const cx = state.agent.x + Math.cos(angle) * distance;
    const cy = state.agent.y + Math.sin(angle) * distance;
    const group = enemies[kind].groupSize;
    for (let i = 0; i < group && state.enemies.length < run.spawn.maxEnemies; i++) {
      const spread = i === 0 ? 0 : run.spawn.groupSpreadPx;
      addEnemy(
        state,
        kind,
        cx + state.rng.range(-spread, spread),
        cy + state.rng.range(-spread, spread),
        difficulty,
      );
    }
    state.spawnBudget -= group;
  }
  // Não acumula nascimentos enquanto a tela está cheia.
  if (state.enemies.length >= run.spawn.maxEnemies)
    state.spawnBudget = Math.min(state.spawnBudget, 1);

  // Inimigos que ficaram muito para trás voltam para perto, como no Vampire Survivors;
  // sem isso, fugir em linha reta deixa o limite de inimigos ocupado por quem não alcança.
  const far = distance * 2;
  for (const e of state.enemies) {
    if ((e.x - state.agent.x) ** 2 + (e.y - state.agent.y) ** 2 < far * far) continue;
    const angle = state.rng.range(0, Math.PI * 2);
    e.x = state.agent.x + Math.cos(angle) * distance;
    e.y = state.agent.y + Math.sin(angle) * distance;
  }
}

function moveEnemies(state: RunState, dt: number): void {
  const { agent } = state;
  const push = Math.min(1, state.rules.run.separation.strength * dt);
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i]!;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    const dx = agent.x - e.x;
    const dy = agent.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.001) {
      const step = Math.min(e.speed * dt, dist);
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    }
    grid.query(e.x, e.y, e.radius * 2, (j) => {
      if (j <= i) return;
      const o = state.enemies[j]!;
      const ox = o.x - e.x;
      const oy = o.y - e.y;
      const d = Math.hypot(ox, oy);
      const overlap = e.radius + o.radius - d;
      if (overlap <= 0 || d < 0.001) return;
      const nx = (ox / d) * overlap * 0.5 * push;
      const ny = (oy / d) * overlap * 0.5 * push;
      e.x -= nx;
      e.y -= ny;
      o.x += nx;
      o.y += ny;
    });
  }
}

/** Inimigo vivo mais perto de (x, y), ignorando os ids em `skip`. */
function nearestEnemy(
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

function fireWeapon(state: RunState, dt: number): void {
  state.weaponCooldown = Math.max(0, state.weaponCooldown - dt);
  if (state.weaponCooldown > 0) return;

  const w = weaponStats(state.rules, state.weaponLevel, state.stats);
  const target = nearestEnemy(state, state.agent.x, state.agent.y, w.range);
  if (!target) return;

  const base = Math.atan2(target.y - state.agent.y, target.x - state.agent.x);
  for (let i = 0; i < w.projectiles; i++) {
    const angle = base + (i - (w.projectiles - 1) / 2) * w.spreadRadians;
    state.projectiles.push({
      x: state.agent.x,
      y: state.agent.y,
      vx: Math.cos(angle) * w.speed,
      vy: Math.sin(angle) * w.speed,
      life: (w.range * 1.3) / w.speed,
      damage: w.damage,
      pierceLeft: w.pierce,
      radius: w.radius,
      hits: [],
      ricochetLeft: w.ricochet,
    });
  }
  state.weaponCooldown = w.cooldownSeconds;
  state.events.push({ type: 'shoot' });
}

function moveProjectiles(state: RunState, dt: number): void {
  const { combat } = state.rules.run;
  for (const p of state.projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) continue;

    let done = false;
    grid.query(p.x, p.y, p.radius + GRID_CELL, (j) => {
      if (done || p.life <= 0) return;
      const e = state.enemies[j]!;
      if (e.hp <= 0 || p.hits.includes(e.id)) return;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > (e.radius + p.radius) ** 2) return;

      p.hits.push(e.id);
      hitEnemy(state, e, p);

      // Reação em cadeia: o disparo salta para o inimigo mais próximo ainda não atingido.
      if (p.ricochetLeft > 0) {
        const next = nearestEnemy(state, p.x, p.y, combat.ricochetRangePx, p.hits);
        if (next) {
          const speed = Math.hypot(p.vx, p.vy);
          const d = Math.hypot(next.x - p.x, next.y - p.y) || 1;
          p.vx = ((next.x - p.x) / d) * speed;
          p.vy = ((next.y - p.y) / d) * speed;
          p.life = (combat.ricochetRangePx * 1.5) / speed;
          p.damage *= combat.ricochetDamageFactor;
          p.ricochetLeft--;
          done = true;
          return;
        }
      }
      if (p.pierceLeft > 0) p.pierceLeft--;
      else p.life = 0;
      done = p.life <= 0;
    });
  }
}

/** Golpe de um disparo: crítico, bônus contra inimigos fortes e empurrão. */
function hitEnemy(state: RunState, e: Enemy, p: Projectile): void {
  const { stats, rng, rules } = state;
  let amount = p.damage;
  if (e.elite) amount *= stats.eliteDamage;
  const crit = rng.next() < stats.critChance;
  if (crit) amount *= stats.critDamage;

  const speed = Math.hypot(p.vx, p.vy) || 1;
  const push = (rules.run.combat.knockbackPx * stats.knockback) / Math.max(1, e.radius / 8);
  e.x += (p.vx / speed) * push;
  e.y += (p.vy / speed) * push;

  damageEnemy(state, e, amount, crit);
}

function damageEnemy(state: RunState, e: Enemy, amount: number, crit = false): void {
  e.hp -= amount;
  e.hitFlash = 0.1;
  state.events.push({ type: 'damage', x: e.x, y: e.y, amount, crit });
  if (e.hp > 0) return;

  state.kills++;
  state.events.push({ type: 'kill', x: e.x, y: e.y, kind: e.kind });
  dropGem(state, e.x, e.y, e.xp);
  // Absorção: chance de recuperar 1 interação ao decompor.
  if (state.rng.next() < state.stats.lifesteal) heal(state, 1);
}

function heal(state: RunState, amount: number): void {
  state.agent.interactions = Math.min(
    state.stats.maxInteractions,
    state.agent.interactions + amount,
  );
}

function dropGem(state: RunState, x: number, y: number, value: number): void {
  if (state.gems.length >= state.rules.run.gems.maxOnField) {
    state.gems[0]!.value += value;
    return;
  }
  state.gems.push({ x, y, value, attracted: false });
}

function touchAgent(state: RunState, dt: number): void {
  const { agent, stats, rules } = state;
  // Homeostase: recupera interações aos poucos.
  if (stats.regenPerSecond > 0) heal(state, stats.regenPerSecond * dt);
  agent.invulnerableFor = Math.max(0, agent.invulnerableFor - dt);
  if (agent.invulnerableFor > 0) return;

  const agentRadius = rules.run.agent.radiusPx;
  let attacker: Enemy | undefined;
  grid.query(agent.x, agent.y, agentRadius + GRID_CELL, (j) => {
    const e = state.enemies[j]!;
    if (e.hp <= 0) return;
    if ((e.x - agent.x) ** 2 + (e.y - agent.y) ** 2 > (e.radius + agentRadius) ** 2) return;
    if (!attacker || e.contactDamage > attacker.contactDamage) attacker = e;
  });
  if (!attacker) return;

  agent.invulnerableFor = stats.invulnerabilitySeconds;
  if (state.rng.next() < stats.dodge) {
    state.events.push({ type: 'dodge' });
    return;
  }

  const hit = attacker.contactDamage;
  const amount = Math.max(rules.run.minDamageTaken, hit - stats.armor);
  agent.interactions = Math.max(0, agent.interactions - amount);
  state.events.push({ type: 'hurt', amount });
  // Reflexo: devolve parte do dano a quem encostou.
  if (stats.thorns > 0) damageEnemy(state, attacker, hit * stats.thorns);

  if (agent.interactions > 0) return;
  // Segunda dose: volta com metade das interações.
  if (state.used.revives < Math.floor(stats.revives)) {
    state.used.revives++;
    agent.interactions = stats.maxInteractions / 2;
    agent.invulnerableFor = rules.run.combat.reviveInvulnerabilitySeconds;
    state.events.push({ type: 'revive' });
    return;
  }
  state.over = true;
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
  }
}

function removeDead(state: RunState): void {
  state.enemies = state.enemies.filter((e) => e.hp > 0);
  state.projectiles = state.projectiles.filter((p) => p.life > 0);
}
