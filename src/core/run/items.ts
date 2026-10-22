import { ITEM_IDS, type ItemId, type PassiveId } from '../../config';
import { damageEnemy, hitEnemy } from './combat';
import type { SpatialGrid } from './spatialGrid';
import type { CapsuleItem, Pickup, RunState } from './state';
import {
  applyUpgrade,
  coinValue,
  passiveAmount,
  readyEvolutions,
  refreshStats,
  rollRarity,
  type UpgradeChoice,
} from './upgrades';
import { auraRadius, GRID_CELL, orbitPositions } from './weapons';
import { weaponMaxLevel } from './weaponParams';

/**
 * Itens no mapa (fase 5.5, docs/itens.md): vesículas que soltam itens, os efeitos com tempo e a
 * cápsula do chefe. Roda depois das armas, para os golpes do passo romperem as vesículas.
 */
export function updateItems(state: RunState, dt: number, grid: SpatialGrid, firstEvent = 0): void {
  const fx = state.effects;
  fx.freeze = Math.max(0, fx.freeze - dt);
  fx.flame = Math.max(0, fx.flame - dt);
  fx.fever = Math.max(0, fx.fever - dt);
  spawnVesicles(state, dt);
  breakVesicles(state, firstEvent);
  if (fx.flame > 0) burn(state, dt, grid);
  movePickups(state, dt);
}

/** Vesículas nascem num anel fora da tela; as que ficam longe demais somem. */
function spawnVesicles(state: RunState, dt: number): void {
  const v = state.rules.drops.vesicles;
  const { agent } = state;
  const distance = state.viewRadius + state.rules.run.spawn.marginOutsideViewPx;
  const far = distance * v.despawnViewMultiplier;
  state.vesicles = state.vesicles.filter(
    (s) => (s.x - agent.x) ** 2 + (s.y - agent.y) ** 2 < far * far,
  );
  state.vesicleTimer -= dt;
  if (state.vesicleTimer > 0) return;
  state.vesicleTimer = v.everySeconds;
  if (state.vesicles.length >= v.maxOnField) return;
  const angle = state.rng.range(0, Math.PI * 2);
  state.vesicles.push({
    x: agent.x + Math.cos(angle) * distance,
    y: agent.y + Math.sin(angle) * distance,
  });
}

/** Qualquer golpe deste passo rompe a vesícula: disparos, áreas, anéis, órbitas, cones, raios. */
function breakVesicles(state: RunState, firstEvent: number): void {
  if (state.vesicles.length === 0) return;
  const r = state.rules.drops.vesicles.radiusPx;
  const near = (x: number, y: number, vx: number, vy: number, reach: number) =>
    (x - vx) ** 2 + (y - vy) ** 2 <= (reach + r) ** 2;
  const { agent } = state;
  const auras: number[] = [];
  const orbs: { x: number; y: number; radius: number }[] = [];
  state.weapons.forEach((w, i) => {
    const kind = state.rules.weapons[w.id].kind;
    if (kind === 'aura') auras.push(auraRadius(state, i));
    if (kind === 'orbit') orbs.push(...orbitPositions(state, w, i));
  });

  state.vesicles = state.vesicles.filter((v) => {
    const hit =
      state.projectiles.some((p) => p.life > 0 && near(p.x, p.y, v.x, v.y, p.radius)) ||
      state.zones.some((z) => z.kind === 'solvent' && near(z.x, z.y, v.x, v.y, z.radius)) ||
      state.pulses.some((p) => near(p.x, p.y, v.x, v.y, p.radius)) ||
      auras.some((a) => near(agent.x, agent.y, v.x, v.y, a)) ||
      orbs.some((o) => near(o.x, o.y, v.x, v.y, o.radius)) ||
      state.events.slice(firstEvent).some((e) => {
        if (e.type === 'strike') return near(e.x, e.y, v.x, v.y, e.radius);
        if (e.type === 'cone') {
          const dx = v.x - e.x;
          const dy = v.y - e.y;
          return Math.hypot(dx, dy) <= e.range + r && angleOff(dx, dy, e.angle) <= e.spread / 2;
        }
        if (e.type === 'beam') {
          const dx = v.x - e.x;
          const dy = v.y - e.y;
          const along = dx * Math.cos(e.angle) + dy * Math.sin(e.angle);
          const across = Math.abs(dx * Math.sin(e.angle) - dy * Math.cos(e.angle));
          return along >= 0 && along <= e.length && across <= e.width / 2 + r;
        }
        return false;
      });
    if (!hit) return true;
    state.events.push({ type: 'vesicle', x: v.x, y: v.y });
    const item = rollItem(state);
    if (item) state.pickups.push({ x: v.x, y: v.y, kind: item, attracted: false });
    return false;
  });
}

/** Sorteia o item da vesícula pelo peso; a Sorte pesa nos que não são ATP nem Glicose. */
export function rollItem(state: RunState): ItemId | undefined {
  const items = state.rules.drops.items;
  const allowed = ITEM_IDS.filter((id) => items[id].minLevel <= state.level);
  return state.rng.weighted(
    allowed,
    (id) => items[id].weight * (items[id].luck ? Math.max(0.01, state.stats.luck) : 1),
  );
}

/** Bico de Bunsen: dano contínuo num cone à frente do movimento. */
function burn(state: RunState, dt: number, grid: SpatialGrid): void {
  const f = state.rules.drops.flame;
  const { agent, stats } = state;
  const range = f.rangePx * stats.area;
  const half = (f.spreadRadians / 2) * stats.area;
  const angle = Math.atan2(agent.dirY, agent.dirX);
  grid.query(agent.x, agent.y, range + GRID_CELL, (j) => {
    const e = state.enemies[j];
    if (!e || e.hp <= 0) return;
    const dx = e.x - agent.x;
    const dy = e.y - agent.y;
    if (Math.hypot(dx, dy) > range + e.radius) return;
    if (angleOff(dx, dy, angle) > half) return;
    hitEnemy(state, e, f.damagePerSecond * stats.damage * dt, { continuous: true });
  });
}

/** Quanto a direção (dx, dy) se afasta de `angle`, de 0 a π. */
function angleOff(dx: number, dy: number, angle: number): number {
  const a = Math.atan2(dy, dx) - angle;
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
}

/** Itens são puxados pelo raio de coleta; a cápsula precisa ser tocada. */
function movePickups(state: RunState, dt: number): void {
  const { agent, rules, stats } = state;
  const pull = rules.run.agent.pickupRadiusPx * stats.magnet;
  const speed = rules.run.gems.attractSpeedPxPerSecond;
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const p = state.pickups[i]!;
    const dx = agent.x - p.x;
    const dy = agent.y - p.y;
    const dist = Math.hypot(dx, dy);
    const reach =
      p.kind === 'capsule' ? rules.drops.capsule.touchRadiusPx : rules.run.gems.collectRadiusPx;
    if (dist <= reach) {
      state.pickups[i] = state.pickups[state.pickups.length - 1]!;
      state.pickups.pop();
      collect(state, p);
      // A cápsula para a run para mostrar o que deu.
      if (state.capsule) return;
      continue;
    }
    if (p.kind === 'capsule') continue;
    if (dist < pull) p.attracted = true;
    if (p.attracted) {
      const step = Math.min(speed * dt, dist);
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }
}

function collect(state: RunState, p: Pickup): void {
  state.events.push({ type: 'item', kind: p.kind, x: p.x, y: p.y });
  if (p.kind === 'capsule') {
    openCapsule(state, p.silver === true);
    return;
  }
  if (!state.seenItems.includes(p.kind)) state.seenItems.push(p.kind);
  const def = state.rules.drops.items[p.kind];
  const fx = state.effects;
  if (def.coins) state.atp += def.coins * coinValue(state) * state.stats.currencyGain;
  switch (p.kind) {
    case 'serum':
      state.agent.interactions = Math.min(
        state.stats.maxInteractions,
        state.agent.interactions + (def.heal ?? 0),
      );
      state.events.push({ type: 'heal', amount: def.heal ?? 0 });
      break;
    case 'dryIce':
      fx.freeze = def.seconds ?? 0;
      break;
    case 'osmosis':
      for (const g of state.gems) g.attracted = true;
      break;
    case 'lysosome':
      lysosome(state);
      break;
    case 'bunsen':
      fx.flame = def.seconds ?? 0;
      break;
    case 'vitamin':
      state.bonus.luck = (state.bonus.luck ?? 0) + (def.luckBonus ?? 0);
      refreshStats(state);
      break;
    case 'glucagon':
      for (const c of state.coins) c.attracted = true;
      fx.fever = def.seconds ?? 0;
      break;
  }
}

/** Lisossomo: decompõe todas as moléculas na tela, menos o chefe, com cascata e gemas. */
function lysosome(state: RunState): void {
  const { agent } = state;
  const r2 = state.viewRadius ** 2;
  const targets = state.enemies.filter(
    (e) => !e.boss && e.hp > 0 && (e.x - agent.x) ** 2 + (e.y - agent.y) ** 2 <= r2,
  );
  for (const e of targets) damageEnemy(state, e, e.hp);
  state.events.push({ type: 'lysosome' });
}

/** Febre de ATP: cada ATP coletado soma tempo. Chamado na coleta das moedas. */
export function extendFever(state: RunState): void {
  if (state.effects.fever > 0) state.effects.fever += state.rules.drops.fever.secondsPerCoin;
}

/** Quantos itens a cápsula sobe: a sequência de principiante, depois 5, 3 ou 1 com a Sorte. */
function capsuleCount(state: RunState): number {
  const c = state.rules.drops.capsule;
  const opened = (state.rules.capsulesOpened ?? 0) + state.capsulesOpened;
  const fixed = c.beginner[opened];
  if (fixed !== undefined) return fixed;
  const luck = Math.max(0.01, state.stats.luck);
  const roll = state.rng.next();
  if (roll < c.fiveChance * luck) return 5;
  if (roll < (c.fiveChance + c.threeChance) * luck) return 3;
  return 1;
}

/** Armas e modificadores que o agente já tem e ainda podem subir. */
function capsuleCandidates(state: RunState): UpgradeChoice[] {
  const out: UpgradeChoice[] = [];
  for (const w of state.weapons) {
    if (w.level < weaponMaxLevel(state.rules.weapons[w.id])) {
      out.push({ kind: 'weapon', id: w.id, level: w.level + 1, rarity: rollRarity(state) });
    }
  }
  for (const [id, p] of Object.entries(state.passives) as [PassiveId, { level: number }][]) {
    const def = state.rules.passives[id];
    if (def.kind === 'off') continue;
    if (p.level > 0 && p.level < def.maxLevel) {
      const rarity = rollRarity(state);
      out.push({
        kind: 'passive',
        id,
        level: p.level + 1,
        rarity,
        amount: passiveAmount(
          state.rules.passives[id],
          state.rules.rarities.tiers[rarity]!.multiplier,
        ),
      });
    }
  }
  return out;
}

/**
 * Abre a cápsula: a de prata evolui primeiro uma arma pronta; o resto sobe um nível de armas e
 * modificadores que o agente tem, com raridade pela Sorte. Sem nada para subir, Fosfocreatina.
 */
export function openCapsule(state: RunState, silver: boolean): void {
  const c = state.rules.drops.capsule;
  const count = capsuleCount(state);
  const items: CapsuleItem[] = [];
  let atp = 0;
  const gain = coinValue(state) * state.stats.currencyGain;
  for (let n = 0; n < count; n++) {
    const evolution = silver ? readyEvolutions(state)[0] : undefined;
    if (evolution && evolution.kind === 'evolve') {
      applyUpgrade(state, evolution);
      items.push(evolution);
      continue;
    }
    const options = capsuleCandidates(state);
    const pick = options[state.rng.int(options.length)];
    if (!pick || (pick.kind !== 'weapon' && pick.kind !== 'passive')) {
      const coins = state.rules.drops.phosphocreatine.coins;
      atp += coins * gain;
      state.atp += coins * gain;
      items.push({ kind: 'phosphocreatine', atp: coins * gain });
      continue;
    }
    applyUpgrade(state, pick);
    items.push(pick);
  }
  const [min = 0, max = 0] = c.coins[String(count) as '1' | '3' | '5'] ?? [];
  const coins = state.rng.range(min, max) * gain;
  atp += coins;
  state.atp += coins;
  state.capsulesOpened++;
  state.capsule = { silver, items, atp };
}

/** O jogador viu a cápsula: a run continua. */
export function closeCapsule(state: RunState): void {
  state.capsule = null;
}
