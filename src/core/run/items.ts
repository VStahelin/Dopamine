import { ITEM_IDS, type ItemId, type PassiveId } from '../../config';
import { damageEnemy, hitEnemy } from './combat';
import type { SpatialGrid } from './spatialGrid';
import { openAmpoule, updateSupplements } from './supplements';
import type { CapsuleItem, Pickup, RunState } from './state';
import {
  applyUpgrade,
  coinValue,
  passiveAmount,
  readyEvolutions,
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
  updateSupplements(state, dt);
  spawnVesicles(state, dt);
  spawnAgentCapsule(state);
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

/**
 * Cápsula de agente (fase 5.16): uma vez por run, depois do minuto da config, pode nascer longe do
 * agente com um agente ainda preso. Tocar nela liberta o agente, que entra no save no fim da run.
 */
function spawnAgentCapsule(state: RunState): void {
  const c = state.rules.drops.agentCapsule;
  if (state.agentCapsuleRolled || state.time < c.fromMinute * 60) return;
  state.agentCapsuleRolled = true;
  const locked = state.rules.lockedAgents ?? [];
  if (locked.length === 0 || state.rng.next() >= c.chance) return;
  const agent = locked[Math.floor(state.rng.next() * locked.length)]!;
  const angle = state.rng.range(0, Math.PI * 2);
  state.pickups.push({
    x: state.agent.x + Math.cos(angle) * c.distancePx,
    y: state.agent.y + Math.sin(angle) * c.distancePx,
    kind: 'agentCapsule',
    attracted: false,
    agent,
  });
}

/**
 * Teste "algum golpe deste passo acertou o círculo (x, y, r)?": disparos, poças, anéis, auras,
 * órbitas, cones, raios e golpes de área. Rompe vesículas e quebra destrutíveis do mapa.
 */
export function weaponHitTest(
  state: RunState,
  firstEvent: number,
): (x: number, y: number, r: number) => boolean {
  const { agent } = state;
  const auras: number[] = [];
  const orbs: { x: number; y: number; radius: number }[] = [];
  state.weapons.forEach((w, i) => {
    const kind = state.rules.weapons[w.id].kind;
    if (kind === 'aura') auras.push(auraRadius(state, i));
    if (kind === 'orbit') orbs.push(...orbitPositions(state, w, i));
  });
  const events = state.events.slice(firstEvent);
  return (vx, vy, r) => {
    const near = (x: number, y: number, reach: number) =>
      (x - vx) ** 2 + (y - vy) ** 2 <= (reach + r) ** 2;
    return (
      state.projectiles.some((p) => p.life > 0 && near(p.x, p.y, p.radius)) ||
      state.zones.some((z) => z.kind === 'solvent' && near(z.x, z.y, z.radius)) ||
      state.pulses.some((p) => near(p.x, p.y, p.radius)) ||
      auras.some((a) => near(agent.x, agent.y, a)) ||
      orbs.some((o) => near(o.x, o.y, o.radius)) ||
      events.some((e) => {
        if (e.type === 'strike') return near(e.x, e.y, e.radius);
        if (e.type === 'cone') {
          const dx = vx - e.x;
          const dy = vy - e.y;
          return Math.hypot(dx, dy) <= e.range + r && angleOff(dx, dy, e.angle) <= e.spread / 2;
        }
        if (e.type === 'beam') {
          const dx = vx - e.x;
          const dy = vy - e.y;
          const along = dx * Math.cos(e.angle) + dy * Math.sin(e.angle);
          const across = Math.abs(dx * Math.sin(e.angle) - dy * Math.cos(e.angle));
          return along >= 0 && along <= e.length && across <= e.width / 2 + r;
        }
        return false;
      })
    );
  };
}

/** Qualquer golpe deste passo rompe a vesícula: disparos, áreas, anéis, órbitas, cones, raios. */
function breakVesicles(state: RunState, firstEvent: number): void {
  if (state.vesicles.length === 0) return;
  const r = state.rules.drops.vesicles.radiusPx;
  const hit = weaponHitTest(state, firstEvent);
  state.vesicles = state.vesicles.filter((v) => {
    if (!hit(v.x, v.y, r)) return true;
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

/** Bico de Bunsen: cone grande à frente do movimento que derrete as moléculas comuns. */
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
    const melt = e.boss || e.aggregate ? 0 : e.maxHp * f.maxHpPerSecond;
    hitEnemy(state, e, (f.damagePerSecond * stats.damage + melt) * dt, { continuous: true });
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
    const touch = p.kind === 'capsule' || p.kind === 'ampoule' || p.kind === 'agentCapsule';
    const reach = touch ? rules.drops.capsule.touchRadiusPx : rules.run.gems.collectRadiusPx;
    if (dist <= reach) {
      state.pickups[i] = state.pickups[state.pickups.length - 1]!;
      state.pickups.pop();
      collect(state, p);
      // A cápsula e a ampola param a run para mostrar o que deram.
      if (state.capsule || state.ampoule) return;
      continue;
    }
    if (touch) continue;
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
  if (p.kind === 'ampoule') {
    openAmpoule(state, p.minRarity ?? 'common');
    return;
  }
  if (p.kind === 'agentCapsule') {
    state.freedAgent = p.agent ?? null;
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
  const f = state.rules.drops.fever;
  if (state.effects.fever <= 0) return;
  // Teto: com muitas moléculas na tela, a febre se renovava sem fim.
  state.effects.fever = Math.min(f.maxSeconds, state.effects.fever + f.secondsPerCoin);
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
    // Reagente não sobe de nível: é uma cópia só, vinda da ampola.
    if (def.kind !== 'receptor') continue;
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
