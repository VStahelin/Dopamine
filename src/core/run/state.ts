import type {
  AgentId,
  EnemyKind,
  ItemId,
  MoleculeType,
  PassiveId,
  RunStatKey,
  StructureKind,
  SupplementRarity,
  WeaponId,
  MapEnvironment,
} from '../../config';
import { mapName, mapParams } from '../map/chunk';
import { createRunMap, type RunMap } from '../map/world';
import { Rng } from '../random';
import { xpToNextLevel } from './progression';
import { DEFAULT_RULES, type RunRules } from './rules';
import { agentBonus, computeStats, type PassiveLevels, type RunStats } from './stats';
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
  /** Segundos congelada só ela (Nitrogênio líquido). */
  frozen: number;
  /** Nasceu da cascata de outra: solta gema com menos chance. */
  fragment: boolean;
  /** Agregado (mini chefe, fase 5.10): maior, mais forte, sempre solta ampola. */
  aggregate: boolean;
  /** Veio numa formação (fase 5.6). */
  formation: boolean;
  /** Ampolas garantidas ao decompor (agregado do Coágulo, fase 5.11). */
  extraAmpoules: number;
  /** Anda em linha reta na direção (dirX, dirY) em vez de perseguir; some quando fica longe. */
  straight: boolean;
  dirX: number;
  dirY: number;
  /** Comportamentos (fase 5.14): segundos de vida, desvio do rumo, relógio do próximo ato. */
  age: number;
  heading: number;
  turnTimer: number;
  actTimer: number;
  /** Quem a gerou (Citocina, chefes); 0 se nasceu sozinha. */
  parent: number;
  /** Distância que mantém do agente (Cortisol); 0 se encosta. */
  keepAway: number;
}

/** Poça tóxica no chão (fase 5.14): tira interações e deixa o agente lento. */
export interface Hazard {
  x: number;
  y: number;
  radius: number;
  /** Segundos que ainda faltam. */
  life: number;
  maxLife: number;
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
  /** Multiplicador de raridade de cada nível ganho (índice 0 = nível 2), decisão 0027. */
  boosts: number[];
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

/** ATP no chão, coletado como as gemas. */
export interface Coin {
  x: number;
  y: number;
  value: number;
  attracted: boolean;
}

/** Vesícula sináptica parada no chão: qualquer golpe rompe e solta um item (fase 5.5). */
export interface Vesicle {
  x: number;
  y: number;
}

/** Item no chão: o que a vesícula soltou, ou a cápsula do chefe (precisa ser tocada). */
export interface Pickup {
  x: number;
  y: number;
  kind: ItemId | 'capsule' | 'ampoule';
  attracted: boolean;
  /** Cápsula de prata (chefe depois dos 10 min): pode evoluir uma arma. */
  silver?: boolean;
  /** Ampola: raridade mínima do suplemento. */
  minRarity?: SupplementRarity;
}

/** Estrutura no mapa (fase 5.11): círculo em que se fica (sinapse) ou se entra (as outras). */
export interface Structure {
  id: number;
  kind: StructureKind;
  x: number;
  y: number;
  /** Sinapse: quanto já encheu, de 0 a 1. */
  progress: number;
  /** O agente estava dentro no passo anterior (a Glândula conta cada entrada). */
  inside: boolean;
  /** Glândula: toques que ainda restam. */
  uses: number;
}

/** Segundos que faltam de cada efeito de item com tempo. */
export interface ItemEffects {
  /** Gelo seco: moléculas paradas e sem encostar. */
  freeze: number;
  /** Bico de Bunsen: lança-chamas na direção do movimento. */
  flame: number;
  /** Febre de ATP (Glucagon): toda molécula decomposta solta ATP. */
  fever: number;
}

/** O que uma cápsula aberta deu, para a tela da cápsula. */
export type CapsuleItem =
  | { kind: 'weapon'; id: WeaponId; level: number; rarity?: number }
  | { kind: 'evolve'; id: WeaponId; into: WeaponId }
  | { kind: 'passive'; id: PassiveId; level: number; rarity: number; amount: number }
  | { kind: 'phosphocreatine'; atp: number };

export interface CapsuleResult {
  silver: boolean;
  items: CapsuleItem[];
  /** ATP da cápsula, já com Rendimento. */
  atp: number;
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
  | { type: 'shielded' }
  | { type: 'revive' }
  | { type: 'kill'; x: number; y: number; kind: EnemyKind }
  /** `blocked`: o que a Membrana segurou do golpe. */
  | { type: 'hurt'; amount: number; blocked: number }
  | { type: 'shoot'; weapon: WeaponId }
  | { type: 'cone'; x: number; y: number; angle: number; range: number; spread: number }
  | {
      type: 'beam';
      x: number;
      y: number;
      angle: number;
      length: number;
      width: number;
      weapon: WeaponId;
    }
  | { type: 'strike'; x: number; y: number; radius: number; weapon?: WeaponId }
  | { type: 'special'; kind: string }
  /** O especial ganhou a primeira carga: o botão ficou pronto. */
  | { type: 'specialReady' }
  | { type: 'boss'; kind: EnemyKind }
  /** Uma molécula geradora (Citocina, chefes) soltou outra. */
  | { type: 'spawned'; x: number; y: number }
  | { type: 'aggregate'; kind: EnemyKind }
  /** Uma formação (ou a crise) vai nascer do lado de `angle`, visto do agente. */
  | { type: 'formationWarning'; name: string; angle: number; crisis: boolean }
  | { type: 'levelUp'; level: number }
  | { type: 'overdose' }
  | { type: 'structure'; kind: StructureKind; x: number; y: number }
  | { type: 'destructible'; x: number; y: number }
  | { type: 'challenge'; won: boolean }
  | { type: 'vesicle'; x: number; y: number }
  | { type: 'item'; kind: ItemId | 'capsule' | 'ampoule'; x: number; y: number }
  | { type: 'spark'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'lysosome' };

export interface SpecialState {
  /** Segundos até ganhar mais uma carga (0 = cargas cheias). */
  cooldown: number;
  /** Usos guardados do especial (atributo Cargas). */
  charges: number;
  /** Segundos de efeito restantes (Pico de recompensa). */
  active: number;
  /** Segundos de queda depois do Pico. */
  crash: number;
  /** Golpes que o Escudo antioxidante ainda bloqueia. */
  blocks: number;
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
    /** Última direção de movimento, para o Bico de Bunsen. */
    dirX: number;
    dirY: number;
  };
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  zones: Zone[];
  /** Poças tóxicas das moléculas (fase 5.14). */
  hazards: Hazard[];
  /** Efeitos de inimigo no agente: segundos de Lentidão e de Adrenalina, e o relógio da poça. */
  agentFx: { slow: number; rush: number; poolTick: number };
  pulses: Pulse[];
  gems: Gem[];
  coins: Coin[];
  vesicles: Vesicle[];
  /** Segundos até a próxima vesícula. */
  vesicleTimer: number;
  pickups: Pickup[];
  effects: ItemEffects;
  /** Atributos somados na run fora dos receptores: suplementos, Mutação. */
  bonus: Partial<RunStats>;
  /** O mesmo `bonus`, separado por origem, para o "de onde vem" da pausa (fase 5.13). */
  bonusBy: Partial<Record<BonusSource, Partial<RunStats>>>;
  /** Atributos do especial somados pelos suplementos (Ginseng). */
  specialBonus: Partial<Record<'cooldown' | 'power' | 'duration' | 'charges', number>>;
  /** Cópias de cada suplemento (fase 5.9). */
  supplements: Record<string, number>;
  seenSupplements: string[];
  /** Ampola aberta esperando o jogador ver; a simulação para enquanto houver uma. */
  ampoule: { id: string } | null;
  /** Momento da última ampola de molécula comum (garantia e intervalo mínimo). */
  lastAmpouleAt: number;
  cryoCooldown: number;
  gemPulseTimer: number;
  /** A run já entrou na Superdosagem (tudo no máximo). */
  overdose: boolean;
  /** Golpe de faísca ou explosão em andamento: não dispara outra. */
  chaining: boolean;
  /** Cápsula aberta esperando o jogador ver; a simulação para enquanto houver uma. */
  capsule: CapsuleResult | null;
  capsulesOpened: number;
  /** Itens coletados nesta run, para o Compêndio. */
  seenItems: ItemId[];
  /** Distância do agente até a borda mais longe da tela no último passo. */
  viewRadius: number;
  /** ATP coletado nesta run. */
  atp: number;
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
  /** Formações e crises (fase 5.6). */
  formations: {
    /** Momento da próxima formação; -1 antes de agendar a primeira. */
    next: number;
    pending: { id: string; at: number; angle: number; crisis: boolean }[];
    /** Picos do dente de serra que já tiveram crise. */
    crises: number;
    crisis: { family: MoleculeType; until: number } | null;
    seen: string[];
  };
  /** Mapa gerado da run: blocos, destrutíveis quebrados e os sólidos perto (fase 5.7). */
  map: RunMap;
  /** Estruturas no mapa e o momento da próxima; -1 antes da sinapse do começo (fase 5.11). */
  structures: Structure[];
  nextStructureAt: number;
  nextStructureId: number;
  /** Cartões da sinapse cheia esperando o jogador escolher; a simulação para enquanto houver. */
  synapseOffer: UpgradeChoice[] | null;
  /** Desafio do Foco inflamatório: decompor as moléculas de ids [from, to) até `until`. */
  challenge: { from: number; to: number; until: number } | null;
  /** Momento sorteado do próximo agregado, em segundos de run. */
  nextAggregateAt: number;
  /** Moléculas que já vieram como agregado nesta run, para o Compêndio. */
  seenAggregates: EnemyKind[];
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

/** De onde vem um bônus de atributo da run, fora dos receptores. */
export type BonusSource = 'supplement' | 'card' | 'mutation' | 'structure';

/** Soma um bônus de atributo da run, guardando a origem. */
export function addBonus(
  state: RunState,
  source: BonusSource,
  stat: RunStatKey,
  amount: number,
): void {
  state.bonus[stat] = (state.bonus[stat] ?? 0) + amount;
  const by = (state.bonusBy[source] ??= {});
  by[stat] = (by[stat] ?? 0) + amount;
}

export interface RunTally {
  damageByWeapon: Partial<Record<WeaponId, number>>;
  crits: number;
  interactionsLost: number;
  /** Decompostas de cada molécula, para as estatísticas do save (fase 5.13). */
  killsByKind: Partial<Record<EnemyKind, number>>;
  bosses: number;
  aggregates: number;
  ampoules: number;
  synapses: number;
}

/** O que a run soma às estatísticas acumuladas do save (base das conquistas). */
export type RunStatsTally = Pick<
  RunTally,
  'killsByKind' | 'bosses' | 'aggregates' | 'ampoules' | 'synapses'
>;

export interface RunResult {
  timeSeconds: number;
  level: number;
  kills: number;
  /** ATP coletado na run, que vai para o save. */
  atp: number;
  seen: EnemyKind[];
  seenItems: ItemId[];
  seenSupplements: string[];
  seenAggregates: EnemyKind[];
  seenFormations: string[];
  capsulesOpened: number;
  agentId: AgentId;
  tally: RunStatsTally;
  /** Nome do mapa: ambiente, densidade e semente (CORRENTE SANGUÍNEA · DENSO · #A3F9). */
  mapName: string;
  /** Local do corpo da run (o ambiente do mapa). */
  env: MapEnvironment;
}

export function newWeapon(id: WeaponId): WeaponInstance {
  return { id, level: 1, cooldown: 0, angle: 0, lastHit: new Map(), growth: 0, boosts: [] };
}

export function createRun(
  seed: number,
  rules: RunRules = DEFAULT_RULES,
  agentId: AgentId = 'dopamine',
): RunState {
  // O perfil do agente e o receptor nativo inicial (sinergia com o local) já valem no começo.
  const startNative = Math.min(rules.run.nativeReceptor.maxLevel, rules.nativeReceptorStart ?? 0);
  const stats = computeStats(rules, {}, agentBonus(rules, agentId, startNative));
  return {
    rules,
    rng: new Rng(seed),
    agentId,
    time: 0,
    agent: {
      x: 0,
      y: 0,
      interactions: stats.maxInteractions,
      invulnerableFor: 0,
      facingX: 1,
      dirX: 1,
      dirY: 0,
    },
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1, rules.economy.xp),
    kills: 0,
    enemies: [],
    projectiles: [],
    zones: [],
    hazards: [],
    agentFx: { slow: 0, rush: 0, poolTick: 0 },
    pulses: [],
    gems: [],
    coins: [],
    vesicles: [],
    vesicleTimer: rules.drops.vesicles.everySeconds,
    pickups: [],
    effects: { freeze: 0, flame: 0, fever: 0 },
    bonus: {},
    bonusBy: {},
    specialBonus: {},
    supplements: {},
    seenSupplements: [],
    ampoule: null,
    lastAmpouleAt: 0,
    cryoCooldown: 0,
    gemPulseTimer: 0,
    chaining: false,
    overdose: false,
    capsule: null,
    capsulesOpened: 0,
    seenItems: [],
    viewRadius: 300,
    atp: 0,
    weapons: [newWeapon(rules.agents[agentId].action as WeaponId)],
    special: {
      cooldown: 0,
      active: 0,
      crash: 0,
      blocks: 0,
      charges: Math.max(1, Math.floor(rules.stats.special.charges?.base ?? 1)),
    },
    passives: {},
    stats,
    pendingLevelUps: 0,
    offer: null,
    used: { revives: 0, rerolls: 0, skips: 0, banishes: 0 },
    banished: [],
    seen: [],
    bossesSpawned: rules.run.bosses.map(() => 0),
    nextAggregateAt: -1,
    map: createRunMap(mapParams(rules.map, seed, rules.mapEnv)),
    structures: [],
    nextStructureAt: -1,
    nextStructureId: 1,
    synapseOffer: null,
    challenge: null,
    formations: { next: -1, pending: [], crises: 0, crisis: null, seen: [] },
    seenAggregates: [],
    over: false,
    nextEnemyId: 1,
    spawnBudget: 0,
    tally: {
      damageByWeapon: {},
      crits: 0,
      interactionsLost: 0,
      killsByKind: {},
      bosses: 0,
      aggregates: 0,
      ampoules: 0,
      synapses: 0,
    },
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
    frozen: 0,
    fragment: false,
    aggregate: false,
    formation: false,
    extraAmpoules: 0,
    straight: false,
    dirX: 0,
    dirY: 0,
    age: 0,
    heading: 0,
    turnTimer: 0,
    actTimer: 0,
    parent: 0,
    keepAway: def.behaviors?.find((b) => b.kind === 'keepAway')?.distancePx ?? 0,
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
    atp: Math.floor(state.atp),
    seen: [...state.seen],
    seenItems: [...state.seenItems],
    seenSupplements: [...state.seenSupplements],
    seenAggregates: [...state.seenAggregates],
    seenFormations: [...state.formations.seen],
    mapName: mapName(state.rules.map, state.map.params),
    env: state.map.params.env,
    capsulesOpened: state.capsulesOpened,
    agentId: state.agentId,
    tally: {
      killsByKind: { ...state.tally.killsByKind },
      bosses: state.tally.bosses,
      aggregates: state.tally.aggregates,
      ampoules: state.tally.ampoules,
      synapses: state.tally.synapses,
    },
  };
}

/** Devolve e limpa os acontecimentos acumulados desde a última chamada. */
export function drainEvents(state: RunState): RunEvent[] {
  const events = state.events;
  state.events = [];
  return events;
}
