import type { AgentId, EnemyKind, MoleculeType, WeaponId } from '../../config';
import { Rng } from '../random';
import { xpToNextLevel } from './progression';
import { DEFAULT_RULES, type RunRules } from './rules';
import { computeStats, type PassiveLevels, type RunStats } from './stats';
import type { UpgradeChoice } from './upgrades';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  type: MoleculeType;
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
  /** Inimigo forte ou chefe: recebe o bônus de Especificidade. */
  elite: boolean;
  boss: boolean;
  /** Fração da velocidade neste passo (poças deixam mais lento); volta a 1 a cada passo. */
  slow: number;
  /** Dano extra recebido neste passo (Catalisador, Emulsão); volta a 0 a cada passo. */
  vulnerability: number;
}

export interface Projectile {
  weapon: WeaponId;
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
  /** Saltos de Reação em cadeia que ainda restam. */
  ricochetLeft: number;
}

/** Uma arma que o agente carrega; a primeira é a ação própria do agente. */
export interface WeaponInstance {
  id: WeaponId;
  level: number;
  cooldown: number;
  /** Ângulo atual da órbita; lado do próximo golpe do cone. */
  angle: number;
  /** Último golpe em cada inimigo (órbita e aura), em segundos de run. */
  lastHit: Map<number, number>;
  /** Quanto a Enzima já cresceu. */
  growth: number;
}

/** Área no chão: poça de solvente ou emulsão da Lipase. */
export interface Zone {
  x: number;
  y: number;
  radius: number;
  life: number;
  /** Dano por golpe (poça) e intervalo entre golpes no mesmo inimigo. */
  damage: number;
  hitInterval: number;
  lastHit: Map<number, number>;
  slow: number;
  /** Emulsão: dano extra recebido pelos inimigos de `vulnerableType` dentro dela. */
  vulnerability: number;
  vulnerableType?: MoleculeType;
  kind: 'solvent' | 'emulsion';
  /** Arma que criou a poça, para o dano por arma. */
  source?: WeaponId;
}

/** Anel que sai do agente (Pulso dopaminérgico). */
export interface Pulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  damage: number;
  hits: number[];
  source: WeaponId;
}

export interface Gem {
  x: number;
  y: number;
  value: number;
  attracted: boolean;
}

/** Acontecimentos de um passo, para o desenho (números de dano, efeitos). */
export type RunEvent =
  | {
      type: 'damage';
      x: number;
      y: number;
      amount: number;
      crit: boolean;
      /** Multiplicador de afinidade do agente contra a molécula (1 = neutro). */
      affinity: number;
      /** Golpe contínuo (aura, poça), mostrado somado. */
      continuous: boolean;
    }
  | { type: 'heal'; amount: number }
  | { type: 'dodge' }
  | { type: 'revive' }
  | { type: 'kill'; x: number; y: number; kind: EnemyKind }
  | { type: 'hurt'; amount: number }
  | { type: 'shoot'; weapon: WeaponId }
  | { type: 'cone'; x: number; y: number; angle: number; range: number; spread: number }
  | { type: 'beam'; x: number; y: number; angle: number; length: number; width: number }
  | { type: 'strike'; x: number; y: number; radius: number }
  | { type: 'special'; kind: string }
  | { type: 'boss'; kind: EnemyKind }
  | { type: 'levelUp'; level: number };

export interface SpecialState {
  /** Segundos até poder usar de novo. */
  cooldown: number;
  /** Segundos de efeito restantes (Pico de recompensa). */
  active: number;
  /** Segundos de queda depois do Pico. */
  crash: number;
}

export interface RunState {
  readonly rules: RunRules;
  readonly rng: Rng;
  readonly agentId: AgentId;
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
  zones: Zone[];
  pulses: Pulse[];
  gems: Gem[];
  weapons: WeaponInstance[];
  special: SpecialState;
  passives: PassiveLevels;
  stats: RunStats;
  /** Level ups ganhos e ainda não escolhidos; a simulação para enquanto houver algum. */
  pendingLevelUps: number;
  /** Opções sorteadas para o level up atual. */
  offer: UpgradeChoice[] | null;
  /** Usos de Segunda dose, Rerrolar, Pular e Banir já gastos nesta run. */
  used: { revives: number; rerolls: number; skips: number; banishes: number };
  /** Opções banidas pelo resto da run (chaves de `choiceKey`). */
  banished: string[];
  /** Tipos de molécula vistos nesta run, para o Compêndio. */
  seen: EnemyKind[];
  /** Próximos minutos de chefe já agendados, por índice de `bosses`. */
  bossesSpawned: number[];
  over: boolean;
  nextEnemyId: number;
  /** Fração acumulada de inimigos a nascer. */
  spawnBudget: number;
  /** Números da run para a pausa e o fim de run. */
  tally: RunTally;
  events: RunEvent[];
}

export interface RunTally {
  damageByWeapon: Partial<Record<WeaponId, number>>;
  crits: number;
  interactionsLost: number;
}

export interface RunResult {
  timeSeconds: number;
  level: number;
  kills: number;
  seen: EnemyKind[];
}

export function newWeapon(id: WeaponId): WeaponInstance {
  return { id, level: 1, cooldown: 0, angle: 0, lastHit: new Map(), growth: 0 };
}

export function createRun(
  seed: number,
  rules: RunRules = DEFAULT_RULES,
  agentId: AgentId = 'dopamine',
): RunState {
  const stats = computeStats(rules, {});
  return {
    rules,
    rng: new Rng(seed),
    agentId,
    time: 0,
    agent: { x: 0, y: 0, interactions: stats.maxInteractions, invulnerableFor: 0, facingX: 1 },
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1, rules.economy.xp),
    kills: 0,
    enemies: [],
    projectiles: [],
    zones: [],
    pulses: [],
    gems: [],
    weapons: [newWeapon(rules.agents[agentId].action as WeaponId)],
    special: { cooldown: 0, active: 0, crash: 0 },
    passives: {},
    stats,
    pendingLevelUps: 0,
    offer: null,
    used: { revives: 0, rerolls: 0, skips: 0, banishes: 0 },
    banished: [],
    seen: [],
    bossesSpawned: rules.run.bosses.map(() => 0),
    over: false,
    nextEnemyId: 1,
    spawnBudget: 0,
    tally: { damageByWeapon: {}, crits: 0, interactionsLost: 0 },
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
  // Estresse (maldição) deixa os inimigos mais fortes e mais valiosos.
  const curse = state.stats.curse;
  const c = state.rules.run.curse;
  const hp = def.hp * difficulty * (1 + curse * c.hp);
  const enemy: Enemy = {
    id: state.nextEnemyId++,
    kind,
    type: def.type,
    x,
    y,
    hp,
    maxHp: hp,
    speed: def.speedPxPerSecond * (1 + curse * c.speed),
    radius: def.radiusPx,
    contactDamage: state.rules.run.contactDamage[def.contactDamage],
    xp: def.xp * (1 + curse * c.xp),
    elite: def.contactDamage !== 'common',
    boss: def.boss === true,
    hitFlash: 0,
    slow: 1,
    vulnerability: 0,
  };
  state.enemies.push(enemy);
  if (!state.seen.includes(kind)) state.seen.push(kind);
  return enemy;
}

export function runResult(state: RunState): RunResult {
  return {
    timeSeconds: state.time,
    level: state.level,
    kills: state.kills,
    seen: [...state.seen],
  };
}

/** Devolve e limpa os acontecimentos acumulados desde a última chamada. */
export function drainEvents(state: RunState): RunEvent[] {
  const events = state.events;
  state.events = [];
  return events;
}
