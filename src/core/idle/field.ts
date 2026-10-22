import { ENEMIES, IDLE, type EnemyKind, type IdleConfig, type MoleculeType } from '../../config';
import { Rng } from '../random';

/**
 * Campo longo (fase 4, decisão 0022): campo vertical em que as moléculas descem até a BASE e os
 * agentes do pool, embaixo, disparam nelas. Roda em passos fixos como a run (decisão 0012) e
 * não sabe de desenho: registra acontecimentos para a tela mostrar.
 */
export interface IdleEnemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  boss: boolean;
  /** Fração da velocidade perdida dentro da aura do Magnésio. */
  slow: number;
  hitFlash: number;
}

export interface IdleShot {
  x: number;
  y: number;
  targetId: number;
  damage: number;
  /** Explosão em área (Melatonina); 0 para disparo simples. */
  radius: number;
  agent: string;
}

/** Estado de cada espaço do pool durante a simulação. */
export interface IdleSlot {
  agent: string;
  /** Posição no pool (0 = espaço da esquerda). */
  pos: number;
  level: number;
  cooldown: number;
  burstLeft: number;
  burstTimer: number;
  /** Segundos desde que entrou na base (Vitamina D). */
  inBase: number;
}

export type IdleEvent =
  | { type: 'hit'; x: number; y: number; amount: number }
  | { type: 'kill'; x: number; y: number; atp: number }
  | { type: 'splash'; x: number; y: number; radius: number }
  | { type: 'aura'; radius: number }
  | { type: 'base'; amount: number }
  | { type: 'wave'; wave: number }
  | { type: 'fallback'; wave: number };

/** O que o organismo muda no campo (fase 5): dificuldade, doença e ATP. */
export interface IdleMods {
  /** Vida das moléculas (dificuldade do indivíduo). */
  hp: number;
  /** ATP por molécula (saúde, setor Social e pontos herdados). */
  atp: number;
  /** Peso de cada tipo de molécula; com ele, as famílias das doenças também descem. */
  typeWeights?: Partial<Record<MoleculeType, number>>;
}

export const NO_IDLE_MODS: IdleMods = { hp: 1, atp: 1 };

export interface IdleField {
  readonly config: IdleConfig;
  readonly mods: IdleMods;
  readonly rng: Rng;
  time: number;
  wave: number;
  bestWave: number;
  /** Moléculas da onda que ainda vão nascer, e o tempo até a próxima. */
  toSpawn: number;
  waveTotal: number;
  spawnTimer: number;
  /** Respiro entre ondas. */
  pause: number;
  baseHp: number;
  enemies: IdleEnemy[];
  shots: IdleShot[];
  slots: IdleSlot[];
  /** Espaços do pool desenhados embaixo da BASE (abertos ou não). */
  slotCount: number;
  /** Multiplicador de recarga dos agentes (Ritmo de disparo). */
  fireRate: number;
  /** ATP gerado desde a última coleta e moléculas decompostas. */
  atp: number;
  kills: number;
  nextId: number;
  events: IdleEvent[];
}

const SHOT_SPEED = 280;
const ENEMY_RADIUS = 10;
const BOSS_RADIUS = 18;

export function createField(
  seed: number,
  wave: number,
  slots: { agent: string; level: number; pos: number }[],
  fireRate: number,
  slotCount: number,
  config: IdleConfig = IDLE,
  mods: IdleMods = NO_IDLE_MODS,
): IdleField {
  const field: IdleField = {
    config,
    mods,
    rng: new Rng(seed),
    time: 0,
    wave: Math.max(1, wave),
    bestWave: Math.max(1, wave),
    toSpawn: 0,
    waveTotal: 0,
    spawnTimer: 0,
    pause: config.field.wavePauseSeconds,
    baseHp: config.field.baseInteractions,
    enemies: [],
    shots: [],
    slots: slots.map((s) => ({ ...s, cooldown: 0, burstLeft: 0, burstTimer: 0, inBase: 0 })),
    slotCount,
    fireRate,
    atp: 0,
    kills: 0,
    nextId: 1,
    events: [],
  };
  startWave(field);
  return field;
}

/** Quantas moléculas a onda tem. */
export function waveCount(wave: number, config: IdleConfig = IDLE): number {
  return config.waves.baseCount + config.waves.countPerWave * (wave - 1);
}

/** Fração da onda já resolvida (decompostas ou que chegaram na base), para a barra. */
export function waveProgress(field: IdleField): number {
  if (field.waveTotal === 0) return 0;
  const done = field.waveTotal - field.toSpawn - field.enemies.length;
  return Math.max(0, Math.min(1, done / field.waveTotal));
}

/** Posição de um espaço do pool: no meio da sua coluna, logo abaixo da BASE. */
export function slotX(index: number, total: number, config: IdleConfig = IDLE): number {
  return ((index + 0.5) * config.field.width) / total;
}

function startWave(field: IdleField): void {
  field.waveTotal = waveCount(field.wave, field.config);
  field.toSpawn = field.waveTotal;
  field.spawnTimer = 0;
}

/** Famílias que só entram pela doença do indivíduo (fora das listas de `waves.pool`). */
const DISEASE_TYPES: readonly MoleculeType[] = ['stress', 'radical', 'toxin'];

function pickKind(field: IdleField): EnemyKind {
  const pools = field.config.waves.pool.filter((p) => p.fromWave <= field.wave);
  const kinds = (pools[pools.length - 1] ?? field.config.waves.pool[0]!).kinds as EnemyKind[];
  const weights = field.mods.typeWeights;
  if (!weights) return kinds[field.rng.int(kinds.length)]!;
  // Doença: as famílias dos setores baixos descem junto, com o peso do organismo.
  const extra = (Object.keys(ENEMIES) as EnemyKind[]).filter((k) => {
    const def = ENEMIES[k];
    return DISEASE_TYPES.includes(def.type) && !def.boss && def.unlockMinute * 3 < field.wave;
  });
  const all = [...kinds, ...extra];
  return (
    field.rng.weighted(all, (k) => ENEMIES[k].spawnWeight * (weights[ENEMIES[k].type] ?? 1)) ??
    kinds[0]!
  );
}

function spawn(field: IdleField): void {
  const { waves, field: f } = field.config;
  const isBoss = field.toSpawn === 1 && field.wave % waves.bossEvery === 0;
  const kind = isBoss ? (waves.boss as EnemyKind) : pickKind(field);
  const grow = waves.hpGrowth ** (field.wave - 1);
  const hp = ENEMIES[kind].hp * grow * (isBoss ? waves.bossHpMultiplier : 1) * field.mods.hp;
  const radius = isBoss ? BOSS_RADIUS : ENEMY_RADIUS;
  field.enemies.push({
    id: field.nextId++,
    kind,
    x: field.rng.range(radius + 6, f.width - radius - 6),
    y: -radius,
    hp,
    maxHp: hp,
    radius,
    boss: isBoss,
    slow: 0,
    hitFlash: 0,
  });
  field.toSpawn--;
}

function damage(field: IdleField, e: IdleEnemy, amount: number): void {
  if (e.hp <= 0) return;
  e.hp -= amount;
  e.hitFlash = 0.1;
  field.events.push({ type: 'hit', x: e.x, y: e.y, amount });
  if (e.hp > 0) return;
  const { waves } = field.config;
  const atp =
    waves.atpPerKill *
    waves.atpGrowthPerWave ** (field.wave - 1) *
    ENEMIES[e.kind].xp *
    field.mods.atp;
  field.atp += atp;
  field.kills++;
  field.events.push({ type: 'kill', x: e.x, y: e.y, atp });
}

/** Alvo: a molécula viva mais perto da base. */
function target(field: IdleField): IdleEnemy | undefined {
  let best: IdleEnemy | undefined;
  for (const e of field.enemies)
    if (e.hp > 0 && e.y > -e.radius && (!best || e.y > best.y)) best = e;
  return best;
}

function agentDamage(field: IdleField, slot: IdleSlot): number {
  const def = field.config.agents[slot.agent]!;
  let dmg = def.damage * (1 + field.config.levels.damagePerLevel * (slot.level - 1));
  if (def.growthPerMinute) {
    dmg *= 1 + Math.min(def.growthMax ?? 0, (def.growthPerMinute * slot.inBase) / 60);
  }
  return dmg;
}

function fire(field: IdleField, slot: IdleSlot): boolean {
  const t = target(field);
  if (!t) return false;
  const def = field.config.agents[slot.agent]!;
  field.shots.push({
    x: slotX(slot.pos, field.slotCount, field.config),
    y: field.config.field.height + 16,
    targetId: t.id,
    damage: agentDamage(field, slot),
    radius: def.kind === 'splash' ? (def.radius ?? 30) : 0,
    agent: slot.agent,
  });
  return true;
}

function updateAgents(field: IdleField, dt: number): void {
  const { height } = field.config.field;
  field.slots.forEach((slot) => {
    const def = field.config.agents[slot.agent]!;
    slot.inBase += dt;
    slot.cooldown = Math.max(0, slot.cooldown - dt);
    if (def.kind === 'aura') {
      const radius = def.radius ?? 120;
      for (const e of field.enemies)
        e.slow = Math.max(e.slow, e.y > height - radius ? (def.slow ?? 0) : 0);
      if (slot.cooldown > 0) return;
      field.events.push({ type: 'aura', radius });
      for (const e of field.enemies) {
        if (e.y > height - radius) damage(field, e, agentDamage(field, slot) * def.cooldownSeconds);
      }
      slot.cooldown = def.cooldownSeconds / field.fireRate;
      return;
    }
    if (slot.burstLeft > 0) {
      slot.burstTimer -= dt;
      if (slot.burstTimer <= 0) {
        fire(field, slot);
        slot.burstLeft--;
        slot.burstTimer = def.burstIntervalSeconds ?? 0.1;
      }
      return;
    }
    if (slot.cooldown > 0) return;
    if (!fire(field, slot)) return;
    if (def.kind === 'burst') {
      slot.burstLeft = (def.burst ?? 1) - 1;
      slot.burstTimer = def.burstIntervalSeconds ?? 0.1;
    }
    slot.cooldown = def.cooldownSeconds / field.fireRate;
  });
}

function updateShots(field: IdleField, dt: number): void {
  const alive = new Map(field.enemies.filter((e) => e.hp > 0).map((e) => [e.id, e]));
  field.shots = field.shots.filter((s) => {
    const t = alive.get(s.targetId) ?? target(field);
    if (!t) return false;
    s.targetId = t.id;
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const d = Math.hypot(dx, dy);
    const step = SHOT_SPEED * dt;
    if (d > t.radius + step) {
      s.x += (dx / d) * step;
      s.y += (dy / d) * step;
      return true;
    }
    if (s.radius > 0) {
      field.events.push({ type: 'splash', x: t.x, y: t.y, radius: s.radius });
      for (const e of field.enemies) {
        if (Math.hypot(e.x - t.x, e.y - t.y) <= s.radius + e.radius) damage(field, e, s.damage);
      }
    } else {
      damage(field, t, s.damage);
    }
    return false;
  });
}

function updateEnemies(field: IdleField, dt: number): void {
  const { waves, field: f } = field.config;
  const speed = waves.speed + waves.speedPerWave * (field.wave - 1);
  for (const e of field.enemies) {
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.y += speed * (1 - e.slow) * dt * (e.boss ? 0.6 : 1);
    e.slow = 0;
    if (e.hp > 0 && e.y >= f.height) {
      const hit = waves.baseDamage[ENEMIES[e.kind].contactDamage];
      field.baseHp = Math.max(0, field.baseHp - hit);
      field.events.push({ type: 'base', amount: hit });
      e.hp = 0;
    }
  }
  field.enemies = field.enemies.filter((e) => e.hp > 0);
}

/** Avança o campo em `dt` segundos. */
export function stepField(field: IdleField, dt: number): void {
  field.time += dt;
  if (field.pause > 0) {
    field.pause = Math.max(0, field.pause - dt);
  } else if (field.toSpawn > 0) {
    field.spawnTimer -= dt;
    if (field.spawnTimer <= 0) {
      spawn(field);
      field.spawnTimer = field.config.waves.spawnIntervalSeconds;
    }
  }
  updateEnemies(field, dt);
  updateAgents(field, dt);
  updateShots(field, dt);

  if (field.baseHp <= 0) {
    // BASE caiu: volta algumas ondas, com a BASE cheia. O campo nunca para de produzir.
    field.wave = Math.max(1, field.wave - field.config.field.fallbackWaves);
    field.baseHp = field.config.field.baseInteractions;
    field.enemies = [];
    field.shots = [];
    field.pause = field.config.field.wavePauseSeconds;
    field.events.push({ type: 'fallback', wave: field.wave });
    startWave(field);
    return;
  }
  if (field.toSpawn === 0 && field.enemies.length === 0) {
    field.wave++;
    field.bestWave = Math.max(field.bestWave, field.wave);
    field.pause = field.config.field.wavePauseSeconds;
    field.events.push({ type: 'wave', wave: field.wave });
    startWave(field);
  }
}

export function drainIdleEvents(field: IdleField): IdleEvent[] {
  const events = field.events;
  field.events = [];
  return events;
}
