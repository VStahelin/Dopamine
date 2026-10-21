import type { EnemyKind } from '../../config';
import { Rng } from '../random';
import { xpToNextLevel } from './progression';
import { DEFAULT_RULES, type RunRules } from './rules';
import { computeStats, type PassiveLevels, type RunStats } from './stats';
import type { UpgradeChoice } from './upgrades';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xp: number;
  /** Segundos de "piscada" depois de levar dano, para o desenho. */
  hitFlash: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Segundos até sumir. */
  life: number;
  damage: number;
  pierceLeft: number;
  radius: number;
  /** Inimigos já atingidos, para um disparo que atravessa não acertar o mesmo duas vezes. */
  hits: number[];
}

export interface Gem {
  x: number;
  y: number;
  value: number;
  attracted: boolean;
}

/** Acontecimentos de um passo, para o desenho (números de dano, efeitos). */
export type RunEvent =
  | { type: 'damage'; x: number; y: number; amount: number }
  | { type: 'kill'; x: number; y: number; kind: EnemyKind }
  | { type: 'hurt'; amount: number }
  | { type: 'shoot' }
  | { type: 'levelUp'; level: number };

export interface RunState {
  readonly rules: RunRules;
  readonly rng: Rng;
  time: number;
  agent: {
    x: number;
    y: number;
    interactions: number;
    invulnerableFor: number;
    facingX: number;
  };
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  gems: Gem[];
  weaponLevel: number;
  weaponCooldown: number;
  passives: PassiveLevels;
  stats: RunStats;
  /** Level ups ganhos e ainda não escolhidos; a simulação para enquanto houver algum. */
  pendingLevelUps: number;
  /** Opções sorteadas para o level up atual. */
  offer: UpgradeChoice[] | null;
  over: boolean;
  nextEnemyId: number;
  /** Fração acumulada de inimigos a nascer. */
  spawnBudget: number;
  events: RunEvent[];
}

export interface RunResult {
  timeSeconds: number;
  level: number;
  kills: number;
}

export function createRun(seed: number, rules: RunRules = DEFAULT_RULES): RunState {
  const stats = computeStats(rules, {});
  return {
    rules,
    rng: new Rng(seed),
    time: 0,
    agent: { x: 0, y: 0, interactions: stats.maxInteractions, invulnerableFor: 0, facingX: 1 },
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1, rules.economy.xp),
    kills: 0,
    enemies: [],
    projectiles: [],
    gems: [],
    weaponLevel: 1,
    weaponCooldown: 0,
    passives: {},
    stats,
    pendingLevelUps: 0,
    offer: null,
    over: false,
    nextEnemyId: 1,
    spawnBudget: 0,
    events: [],
  };
}

/** Cria um inimigo; `difficulty` multiplica a vida. */
export function addEnemy(
  state: RunState,
  kind: EnemyKind,
  x: number,
  y: number,
  difficulty = 1,
): Enemy {
  const def = state.rules.enemies[kind];
  const hp = def.hp * difficulty;
  const enemy: Enemy = {
    id: state.nextEnemyId++,
    kind,
    x,
    y,
    hp,
    maxHp: hp,
    speed: def.speedPxPerSecond,
    radius: def.radiusPx,
    contactDamage: state.rules.run.contactDamage[def.contactDamage],
    xp: def.xp,
    hitFlash: 0,
  };
  state.enemies.push(enemy);
  return enemy;
}

export function runResult(state: RunState): RunResult {
  return { timeSeconds: state.time, level: state.level, kills: state.kills };
}

/** Devolve e limpa os acontecimentos acumulados desde a última chamada. */
export function drainEvents(state: RunState): RunEvent[] {
  const events = state.events;
  state.events = [];
  return events;
}
