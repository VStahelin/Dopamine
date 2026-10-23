import type { WeaponDef, WeaponParams } from '../../config';
import { aimPoint, hitEnemy, nearestEnemy } from './combat';
import type { SpatialGrid } from './spatialGrid';
import { actionMods } from './specials';
import type { Enemy, RunState, WeaponInstance } from './state';
import { NO_MODS, weaponParams } from './weaponParams';

/** Tamanho da célula da grade espacial, para consultas com folga. */
export const GRID_CELL = 32;

/**
 * Antes de mover os inimigos: zera os efeitos do passo anterior e aplica os de agora (lentidão
 * das poças, vulnerabilidade e puxão das auras, emulsão).
 */
export function applyFields(state: RunState, dt: number, grid: SpatialGrid): void {
  for (const e of state.enemies) {
    e.slow = 1;
    e.vulnerability = 0;
  }
  const { agent } = state;
  state.weapons.forEach((w, i) => {
    const def = state.rules.weapons[w.id];
    if (def.kind !== 'aura') return;
    const p = paramsOf(state, w, i);
    const radius = p.areaPx + w.growth;
    eachInRadius(state, grid, agent.x, agent.y, radius, (e) => {
      if (def.vulnerability) e.vulnerability = Math.max(e.vulnerability, def.vulnerability);
      if (def.pullType === e.type && def.pullPxPerSecond)
        pullTowards(e, agent.x, agent.y, def.pullPxPerSecond * dt);
    });
  });
  for (const z of state.zones) {
    eachInRadius(state, grid, z.x, z.y, z.radius, (e) => {
      if (z.slow > 0) e.slow = Math.min(e.slow, 1 - z.slow);
      if (z.vulnerability > 0 && (!z.vulnerableType || z.vulnerableType === e.type)) {
        e.vulnerability = Math.max(e.vulnerability, z.vulnerability);
      }
    });
  }
}

/** Dispara e atualiza cada arma do agente, conforme o tipo de ataque. */
export function updateWeapons(state: RunState, dt: number, grid: SpatialGrid): void {
  state.weapons.forEach((w, i) => {
    const def = state.rules.weapons[w.id];
    const p = paramsOf(state, w, i);
    w.cooldown = Math.max(0, w.cooldown - dt);
    switch (def.kind) {
      case 'projectile':
        return fireProjectiles(state, w, def, p);
      case 'cone':
        return fireCone(state, w, def, p, grid);
      case 'orbit':
        return spinOrbit(state, w, def, p, dt, grid);
      case 'aura':
        return tickAura(state, w, def, p, grid);
      case 'zone':
        return throwZones(state, w, def, p);
      case 'beam':
        return fireBeams(state, w, def, p);
      case 'pulse':
        return emitPulse(state, w, p);
      case 'strike':
        return strike(state, w, p, grid);
    }
  });
}

/** Valores atuais de uma arma do agente, com atributos e o especial. */
export function paramsOf(state: RunState, w: WeaponInstance, index: number): WeaponParams {
  const mods = index === 0 ? actionMods(state) : NO_MODS;
  return weaponParams(state.rules.weapons[w.id], w.level, state.stats, mods, w.boosts);
}

function eachInRadius(
  state: RunState,
  grid: SpatialGrid,
  x: number,
  y: number,
  radius: number,
  visit: (e: Enemy) => void,
): void {
  grid.query(x, y, radius + GRID_CELL, (j) => {
    const e = state.enemies[j];
    if (!e || e.hp <= 0) return;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 <= (radius + e.radius) ** 2) visit(e);
  });
}

function pullTowards(e: Enemy, x: number, y: number, step: number): void {
  const dx = x - e.x;
  const dy = y - e.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const s = Math.min(step, d);
  e.x += (dx / d) * s;
  e.y += (dy / d) * s;
}

/** Golpe com intervalo mínimo no mesmo inimigo (órbita, aura, poça). */
function readyToHit(lastHit: Map<number, number>, id: number, now: number, interval: number) {
  const last = lastHit.get(id);
  if (last !== undefined && now - last < interval) return false;
  lastHit.set(id, now);
  return true;
}

function fireProjectiles(
  state: RunState,
  w: WeaponInstance,
  def: WeaponDef,
  p: WeaponParams,
): void {
  if (w.cooldown > 0) return;
  const { agent } = state;
  const target = aimPoint(state, agent.x, agent.y, p.rangePx);
  if (!target) return;
  const base = Math.atan2(target.y - agent.y, target.x - agent.x);
  const spread = ((def.spreadDegrees ?? 0) * Math.PI) / 180;
  for (let i = 0; i < p.count; i++) {
    const angle = base + (i - (p.count - 1) / 2) * spread;
    state.projectiles.push({
      weapon: w.id,
      x: agent.x,
      y: agent.y,
      vx: Math.cos(angle) * p.speedPxPerSecond,
      vy: Math.sin(angle) * p.speedPxPerSecond,
      life: (p.rangePx * 1.3) / p.speedPxPerSecond,
      damage: p.damage,
      pierceLeft: p.pierce,
      radius: p.areaPx,
      hits: [],
      ricochetLeft: p.ricochet,
    });
  }
  w.cooldown = p.cooldownSeconds;
  state.events.push({ type: 'shoot', weapon: w.id });
}

/** Move os disparos e resolve os golpes, com perfuração e Reação em cadeia. */
export function moveProjectiles(state: RunState, dt: number, grid: SpatialGrid): void {
  const { combat } = state.rules.run;
  for (const p of state.projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) continue;

    let done = false;
    grid.query(p.x, p.y, p.radius + GRID_CELL, (j) => {
      if (done || p.life <= 0) return;
      const e = state.enemies[j];
      if (!e || e.hp <= 0 || p.hits.includes(e.id)) return;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > (e.radius + p.radius) ** 2) return;

      p.hits.push(e.id);
      hitEnemy(state, e, p.damage, { dirX: p.vx, dirY: p.vy, source: p.weapon });

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

function fireCone(
  state: RunState,
  w: WeaponInstance,
  def: WeaponDef,
  p: WeaponParams,
  grid: SpatialGrid,
): void {
  if (w.cooldown > 0) return;
  const { agent } = state;
  const target = aimPoint(state, agent.x, agent.y, p.rangePx);
  if (!target) return;
  const angle = Math.atan2(target.y - agent.y, target.x - agent.x);
  const half = (((def.coneDegrees ?? 60) * Math.PI) / 180 / 2) * state.stats.area;
  eachInRadius(state, grid, agent.x, agent.y, p.rangePx, (e) => {
    const a = Math.atan2(e.y - agent.y, e.x - agent.x);
    const diff = Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)));
    if (diff <= half) {
      hitEnemy(state, e, p.damage, { dirX: e.x - agent.x, dirY: e.y - agent.y, source: w.id });
    }
  });
  w.cooldown = p.cooldownSeconds;
  state.events.push({
    type: 'cone',
    x: agent.x,
    y: agent.y,
    angle,
    range: p.rangePx,
    spread: half * 2,
  });
}

/** Raio atual de uma aura do agente (com atributos, especial e o crescimento da Enzima). */
export function auraRadius(state: RunState, index: number): number {
  const w = state.weapons[index]!;
  return paramsOf(state, w, index).areaPx + w.growth;
}

/** Posições dos elétrons da órbita, para o desenho e para os golpes. */
export function orbitPositions(state: RunState, w: WeaponInstance, index: number) {
  const p = paramsOf(state, w, index);
  return Array.from({ length: p.count }, (_, k) => {
    const a = w.angle + (k / p.count) * Math.PI * 2;
    return {
      x: state.agent.x + Math.cos(a) * p.rangePx,
      y: state.agent.y + Math.sin(a) * p.rangePx,
      radius: p.areaPx,
    };
  });
}

function spinOrbit(
  state: RunState,
  w: WeaponInstance,
  def: WeaponDef,
  p: WeaponParams,
  dt: number,
  grid: SpatialGrid,
): void {
  w.angle += (p.speedPxPerSecond / Math.max(1, p.rangePx)) * dt;
  const interval = def.hitIntervalSeconds ?? 0.5;
  for (let k = 0; k < p.count; k++) {
    const a = w.angle + (k / p.count) * Math.PI * 2;
    const x = state.agent.x + Math.cos(a) * p.rangePx;
    const y = state.agent.y + Math.sin(a) * p.rangePx;
    eachInRadius(state, grid, x, y, p.areaPx, (e) => {
      if (readyToHit(w.lastHit, e.id, state.time, interval)) {
        hitEnemy(state, e, p.damage, {
          dirX: e.x - state.agent.x,
          dirY: e.y - state.agent.y,
          source: w.id,
        });
      }
    });
  }
}

function tickAura(
  state: RunState,
  w: WeaponInstance,
  def: WeaponDef,
  p: WeaponParams,
  grid: SpatialGrid,
): void {
  const interval = def.hitIntervalSeconds ?? 0.5;
  eachInRadius(state, grid, state.agent.x, state.agent.y, p.areaPx + w.growth, (e) => {
    if (readyToHit(w.lastHit, e.id, state.time, interval)) {
      hitEnemy(state, e, p.damage, { continuous: true, source: w.id });
    }
  });
}

function throwZones(state: RunState, w: WeaponInstance, def: WeaponDef, p: WeaponParams): void {
  if (w.cooldown > 0) return;
  const { agent } = state;
  const near = state.enemies.filter(
    (e) => e.hp > 0 && (e.x - agent.x) ** 2 + (e.y - agent.y) ** 2 <= p.rangePx ** 2,
  );
  // Sem molécula perto, a poça cai no que quebra (destrutível ou vesícula).
  const object = near.length === 0 ? aimPoint(state, agent.x, agent.y, p.rangePx) : undefined;
  if (near.length === 0 && !object) return;
  for (let i = 0; i < p.count; i++) {
    const target = object ?? near[state.rng.int(near.length)]!;
    state.zones.push({
      kind: 'solvent',
      x: target.x,
      y: target.y,
      radius: p.areaPx,
      life: p.durationSeconds,
      damage: p.damage,
      hitInterval: def.hitIntervalSeconds ?? 0.5,
      lastHit: new Map(),
      slow: def.slow ?? 0,
      vulnerability: 0,
      source: w.id,
    });
  }
  w.cooldown = p.cooldownSeconds;
}

/** Poças: duração e dano por intervalo. A lentidão e a emulsão entram em `applyFields`. */
export function updateZones(state: RunState, dt: number, grid: SpatialGrid): void {
  for (const z of state.zones) {
    z.life -= dt;
    if (z.damage <= 0 || z.life <= 0) continue;
    eachInRadius(state, grid, z.x, z.y, z.radius, (e) => {
      if (readyToHit(z.lastHit, e.id, state.time, z.hitInterval)) {
        hitEnemy(state, e, z.damage, { continuous: true, source: z.source });
      }
    });
  }
  state.zones = state.zones.filter((z) => z.life > 0);
}

function fireBeams(state: RunState, w: WeaponInstance, def: WeaponDef, p: WeaponParams): void {
  if (w.cooldown > 0) return;
  const { agent } = state;
  const target = aimPoint(state, agent.x, agent.y, p.rangePx);
  if (!target) return;
  const base = Math.atan2(target.y - agent.y, target.x - agent.x);
  const spread = ((def.spreadDegrees ?? 20) * Math.PI) / 180;
  for (let i = 0; i < p.count; i++) {
    const angle = base + (i - (p.count - 1) / 2) * spread;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    for (const e of state.enemies) {
      if (e.hp <= 0) continue;
      const rx = e.x - agent.x;
      const ry = e.y - agent.y;
      const along = rx * ux + ry * uy;
      if (along < 0 || along > p.rangePx) continue;
      const across = Math.abs(rx * uy - ry * ux);
      if (across <= p.areaPx / 2 + e.radius) {
        hitEnemy(state, e, p.damage, { dirX: ux, dirY: uy, source: w.id });
      }
    }
    state.events.push({
      type: 'beam',
      x: agent.x,
      y: agent.y,
      angle,
      length: p.rangePx,
      width: p.areaPx,
    });
  }
  w.cooldown = p.cooldownSeconds;
}

function emitPulse(state: RunState, w: WeaponInstance, p: WeaponParams): void {
  if (w.cooldown > 0) return;
  // O pulso sai mesmo sem alvo: é o ritmo da Dopamina.
  state.pulses.push({
    x: state.agent.x,
    y: state.agent.y,
    radius: 0,
    maxRadius: p.areaPx,
    speed: p.speedPxPerSecond,
    damage: p.damage,
    hits: [],
    source: w.id,
  });
  w.cooldown = p.cooldownSeconds;
}

/** Anéis crescem a partir do agente e acertam cada inimigo uma vez. */
export function updatePulses(state: RunState, dt: number, grid: SpatialGrid): void {
  for (const pulse of state.pulses) {
    pulse.x = state.agent.x;
    pulse.y = state.agent.y;
    pulse.radius = Math.min(pulse.maxRadius, pulse.radius + pulse.speed * dt);
    eachInRadius(state, grid, pulse.x, pulse.y, pulse.radius, (e) => {
      if (pulse.hits.includes(e.id)) return;
      pulse.hits.push(e.id);
      hitEnemy(state, e, pulse.damage, {
        dirX: e.x - pulse.x,
        dirY: e.y - pulse.y,
        source: pulse.source,
      });
    });
  }
  state.pulses = state.pulses.filter((p) => p.radius < p.maxRadius);
}

function strike(state: RunState, w: WeaponInstance, p: WeaponParams, grid: SpatialGrid): void {
  if (w.cooldown > 0) return;
  const { agent } = state;
  const targets: Enemy[] = [];
  for (let i = 0; i < p.count; i++) {
    const t = nearestEnemy(
      state,
      agent.x,
      agent.y,
      p.rangePx,
      targets.map((e) => e.id),
    );
    if (t) targets.push(t);
  }
  if (targets.length === 0) {
    // Sem molécula: o golpe cai no que quebra mais perto, se houver.
    const object = aimPoint(state, agent.x, agent.y, p.rangePx);
    if (!object) return;
    state.events.push({ type: 'strike', x: object.x, y: object.y, radius: p.areaPx });
    w.cooldown = p.cooldownSeconds;
    return;
  }
  for (const t of targets) {
    const tx = t.x;
    const ty = t.y;
    hitEnemy(state, t, p.damage, { dirX: tx - agent.x, dirY: ty - agent.y, source: w.id });
    // Respingo: metade do dano em quem está em volta do alvo.
    eachInRadius(state, grid, tx, ty, p.areaPx, (e) => {
      if (e !== t) {
        hitEnemy(state, e, p.damage * 0.5, { dirX: e.x - tx, dirY: e.y - ty, source: w.id });
      }
    });
    state.events.push({ type: 'strike', x: tx, y: ty, radius: p.areaPx });
  }
  w.cooldown = p.cooldownSeconds;
}
