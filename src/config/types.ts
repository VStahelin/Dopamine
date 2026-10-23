/**
 * Formato dos arquivos JSON de configuração (decisão 0004). O build falha se um JSON
 * não bater com estes tipos.
 *
 * Convenções dos JSON:
 * - Percentuais são frações: 1 = 100%, 0,25 = +25%.
 * - A unidade vai no nome da chave quando não é óbvia (`Px`, `Seconds`, `Hours`, `PerSecond`).
 * - `null` quer dizer "sem teto".
 */

/** Um atributo do agente, como nas tabelas da aba Parâmetros. */
export interface Stat {
  /** Nome mostrado no jogo. */
  name: string;
  /** O que o atributo faz, numa frase, para o Laboratório e as descrições. */
  description: string;
  /** Valor com que todo agente começa, antes de upgrades. */
  base: number;
  /** Valor máximo que dá para chegar dentro da run (`null` = sem teto). */
  runCap: number | null;
  /** Bônus permanente máximo do menu, somado à base, na mesma unidade do atributo. */
  metaCap: number;
}

export type StatGroup = Record<string, Stat>;

export interface StatsConfig {
  offense: StatGroup;
  defense: StatGroup;
  mobility: StatGroup;
  levelUp: StatGroup;
  risk: StatGroup;
  special: StatGroup;
}

export type ContactDamageKind = 'common' | 'strong' | 'boss';

/** Agregados, os mini chefes (fase 5.10, decisão 0028): a molécula forte da onda, maior e mais forte. */
export interface AggregateConfig {
  /**
   * Intervalo sorteado entre um agregado e o próximo (o primeiro também conta do começo da run).
   * O máximo de 60 s garante pelo menos um por minuto.
   */
  minGapSeconds: number;
  maxGapSeconds: number;
  hpMultiplier: number;
  sizeMultiplier: number;
  speedMultiplier: number;
  /** XP da molécula base multiplicado: sempre uma gema vermelha. */
  xpMultiplier: number;
  /** Chance de soltar ampola, com raridade mínima `minRarity`: com um por minuto, sempre seria demais. */
  ampouleChance: number;
  minRarity: SupplementRarity;
}

/**
 * Como a formação nasce e anda (fase 5.6, decisão 0030): enxame que atravessa em linha reta,
 * fileira que varre, três diagonais, anel que fecha em volta e grupo acelerado que persegue.
 */
export type FormationShape = 'swarm' | 'row' | 'diagonal' | 'ring' | 'surge';

export interface FormationDef {
  name: string;
  /** O que a formação faz, numa frase, para o Compêndio. */
  description: string;
  /** Família da molécula: o peso da formação é o da família no organismo (a doença escolhe). */
  family: MoleculeType;
  shape: FormationShape;
  /** Moléculas da formação, repetidas na ordem; vazio = as comuns mais puxadas pela doença. */
  kinds: string[];
  count: number;
  speedMultiplier: number;
}

export interface FormationsConfig {
  firstAtSeconds: number;
  everySeconds: number;
  /** Aviso na tela antes de a formação nascer. */
  warningSeconds: number;
  /** Chance de gema das moléculas de formação, multiplicada: sem isso, o XP de graça facilitava a run. */
  gemChanceFactor: number;
  list: Record<string, FormationDef>;
  /** Nome da crise (o pico do dente de serra) pela família mais puxada pela doença. */
  crisisNames: Record<MoleculeType, string>;
}

export interface RunConfig {
  /** Passos de simulação por segundo (passo fixo, decisão 0012). */
  ticksPerSecond: number;
  agent: {
    /** Raio de colisão do agente. */
    radiusPx: number;
    /** Velocidade com Mobilidade 100%. */
    moveSpeedPxPerSecond: number;
    /** Raio de onde as gemas começam a ser puxadas, com Raio de coleta 100%. */
    pickupRadiusPx: number;
  };
  /** Interações que cada tipo de inimigo tira ao encostar. */
  contactDamage: Record<ContactDamageKind, number>;
  /** Multiplicador de dano por afinidade entre agente e tipo de molécula. */
  affinity: { strong: number; neutral: number; weak: number };
  /** Dano recebido nunca fica abaixo disto, mesmo com Membrana. */
  minDamageTaken: number;
  spawn: {
    /** Inimigos por segundo com dificuldade 1×; multiplicado por D(t) e pelos picos. */
    baseEnemiesPerSecond: number;
    maxEnemies: number;
    /** Os inimigos nascem fora da tela, a esta distância além da borda visível. */
    marginOutsideViewPx: number;
    /** Espalhamento dos inimigos que nascem em grupo. */
    groupSpreadPx: number;
  };
  /** Empurrão entre inimigos encostados, para não virarem uma pilha só. */
  separation: { strength: number };
  combat: {
    /** Empurrão de um golpe com Repulsão 100%, dividido pelo tamanho do inimigo. */
    knockbackPx: number;
    /** Distância máxima do salto da Reação em cadeia. */
    ricochetRangePx: number;
    /** Cada salto causa esta fração do dano anterior. */
    ricochetDamageFactor: number;
    /** Invulnerabilidade depois de voltar com a Segunda dose. */
    reviveInvulnerabilitySeconds: number;
  };
  /** Chefes: nascem no começo de cada pico do dente de serra que caia no intervalo. */
  bosses: { kind: string; everyMinutes: number }[];
  aggregates: AggregateConfig;
  /** O receptor nativo sobe 1 nível a cada `everyLevels` níveis de run, até `maxLevel`. */
  nativeReceptor: { everyLevels: number; maxLevel: number };
  formations: FormationsConfig;
  /** Quanto cada 100% de Estresse aumenta nos inimigos e na recompensa. */
  curse: { hp: number; speed: number; quantity: number; xp: number };
  gems: {
    /** Acima disto, o XP de gemas novas soma na gema mais antiga. */
    maxOnField: number;
    attractSpeedPxPerSecond: number;
    /** Distância do agente em que a gema é coletada. */
    collectRadiusPx: number;
  };
}

export type MoleculeType = 'lipid' | 'sugar' | 'radical' | 'stress' | 'toxin' | 'inflammation';

export interface EnemyDef {
  name: string;
  type: MoleculeType;
  /** Vida com dificuldade 1×; multiplicada por D(t) no nascimento. */
  hp: number;
  speedPxPerSecond: number;
  contactDamage: ContactDamageKind;
  xp: number;
  radiusPx: number;
  /** Minuto da run a partir do qual o inimigo pode nascer. */
  unlockMinute: number;
  spawnWeight: number;
  /** Quantos nascem juntos. */
  groupSize: number;
  /** Em que se quebra ao ser decomposto (cascata da química real, aba Personagens). */
  fragments?: { kind: string; count: number }[];
  /** Chefe: nasce pelo calendário de `bosses` em run.json, não pelo sorteio. */
  boss?: boolean;
}

/**
 * Tipos de ataque (arquétipos da aba Armas): disparo com mira, cone, órbita, aura, poça no chão,
 * feixe que atravessa, pulso em anel e golpe no inimigo mais próximo.
 */
export type WeaponKind =
  'projectile' | 'cone' | 'orbit' | 'aura' | 'zone' | 'beam' | 'pulse' | 'strike';

/** Valores de uma arma; cada nível a partir do 2 soma uma parte deles. */
export interface WeaponParams {
  damage: number;
  cooldownSeconds: number;
  /** Projéteis, elétrons, poças, feixes ou alvos por ativação. */
  count: number;
  /** Raio da área: projétil, aura, poça, anel, respingo do golpe ou largura do feixe. */
  areaPx: number;
  /** Distância de mira; na órbita, o raio da órbita; no cone, o comprimento. */
  rangePx: number;
  /** Velocidade do projétil, do elétron na órbita ou do anel do pulso. */
  speedPxPerSecond: number;
  pierce: number;
  ricochet: number;
  /** Quanto dura a poça. */
  durationSeconds: number;
}

export type WeaponSource = 'pool' | 'agent' | 'evolution';

export interface WeaponDef {
  name: string;
  kind: WeaponKind;
  /** pool = aparece no level up; agent = ação própria de um agente; evolution = só por evolução. */
  source: WeaponSource;
  description: string;
  base: WeaponParams;
  levels: Partial<WeaponParams>[];
  /** Disparo: ângulo entre projéteis do mesmo disparo. */
  spreadDegrees?: number;
  /** Cone: abertura total. */
  coneDegrees?: number;
  /** Aura, poça e órbita: intervalo entre golpes no mesmo inimigo. */
  hitIntervalSeconds?: number;
  /** Poça: fração da velocidade que o inimigo perde dentro dela. */
  slow?: number;
  /** Aura: dano extra que os inimigos dentro dela recebem de todas as fontes. */
  vulnerability?: number;
  /** Aura: puxa inimigos deste tipo para o agente. */
  pullType?: MoleculeType;
  pullPxPerSecond?: number;
  /** Aura que cresce a cada decomposição (Enzima). */
  growPerKillPx?: number;
  growMaxPx?: number;
  /** Arma no nível máximo + este reagente = vira `into`. */
  evolution?: { reagent: string; into: string };
}

export type AffinityLevel = 'strong' | 'neutral' | 'weak';

export type SpecialKind = 'frenzy' | 'emulsion' | 'uptake';

/** Especial do agente, disparado pelo jogador. */
export interface SpecialDef {
  name: string;
  /** Nome curto, embaixo do botão do especial na HUD. */
  shortName: string;
  kind: SpecialKind;
  description: string;
  cooldownSeconds: number;
  durationSeconds: number;
  /** Pico de recompensa: multiplica a recarga e a área da ação durante o efeito. */
  cooldownMultiplier?: number;
  areaMultiplier?: number;
  /** Pico de recompensa: depois do efeito, a ação fica mais lenta por este tempo. */
  crashSeconds?: number;
  crashCooldownMultiplier?: number;
  /** Emulsão e Captação: raio, tipo afetado, dano extra recebido, dano e puxão. */
  radiusPx?: number;
  type?: MoleculeType;
  vulnerability?: number;
  damage?: number;
  pullPx?: number;
}

export interface AgentDef {
  name: string;
  /** Molécula que o agente é (para a ficha). */
  description: string;
  /** Arma da ação própria (source "agent" em weapons.json). */
  action: string;
  special: SpecialDef;
  /** Pontos de saúde por setor a cada `minutesForFullEffect` de run (organism.json). */
  health?: Partial<Record<Sector, number>>;
  /** Efeito colateral: pontos que tira de outros setores, como um remédio de verdade. */
  collateral?: Partial<Record<Sector, number>>;
  /** Efetividade por tipo de molécula; o que faltar é neutro. */
  affinity: Partial<Record<MoleculeType, AffinityLevel>>;
  /**
   * Receptor nativo (fase 5.6, decisão 0030): o perfil do agente, que sobe sozinho com o nível da
   * run. Soma `perLevel` a um atributo (`stat`) ou ao dano contra um tipo de molécula (`type`).
   */
  nativeReceptor: {
    name: string;
    /** Ícone do grupo `passives` de icons.json. */
    icon: string;
    stat?: RunStatKey;
    type?: MoleculeType;
    perLevel: number;
  };
}

/**
 * Atributos do agente na run: as chaves dos grupos offense, defense, mobility, levelUp e risk
 * de stats.json. Os do especial entram com o especial (fase 2).
 */
export const RUN_STAT_KEYS = [
  'damage',
  'projectiles',
  'cooldown',
  'area',
  'duration',
  'projectileSpeed',
  'range',
  'pierce',
  'ricochet',
  'critChance',
  'critDamage',
  'knockback',
  'eliteDamage',
  'effectChance',
  'maxInteractions',
  'armor',
  'dodge',
  'regenPerSecond',
  'lifesteal',
  'invulnerabilitySeconds',
  'revives',
  'thorns',
  'moveSpeed',
  'magnet',
  'xpGain',
  'currencyGain',
  'luck',
  'choices',
  'rerolls',
  'skips',
  'banishes',
  'weaponSlots',
  'modifierSlots',
  'curse',
] as const;

export type RunStatKey = (typeof RUN_STAT_KEYS)[number];

/** Modificador passivo oferecido no level up. */
/**
 * Papel de um passivo: receptor (sai no level up, ocupa espaço), reagente (carta do level up que
 * libera a evolução, sem espaço) ou fora do level up (só Laboratório, por enquanto; decisão 0027).
 */
export type PassiveKind = 'receptor' | 'reagent' | 'off';

export interface PassiveDef {
  name: string;
  kind: PassiveKind;
  stat: RunStatKey;
  /** Segundo atributo que recebe o mesmo bônus (Cinética: velocidade do projétil e alcance). */
  alsoStat?: RunStatKey;
  /** Mutação: cada nível soma um atributo sorteado, em vez de `stat`. */
  mutation?: boolean;
  /** Quanto cada escolha comum soma ao atributo, na unidade do atributo em stats.json. */
  perLevel: number;
  /** Quantas vezes pode ser escolhido na run. */
  maxLevel: number;
  /** Atributo inteiro (projéteis, perfuração...): o valor com raridade é arredondado. */
  integer?: boolean;
  /** Não ocupa espaço de receptor (os reagentes e o próprio "Espaços de receptor"). */
  freeSlot?: boolean;
}

export interface RarityTier {
  id: string;
  name: string;
  /** Cor da raridade (moldura e rótulo do cartão). */
  color: string;
  /** Peso no sorteio com Sorte 100%. */
  weight: number;
  /** Multiplica o valor do modificador. */
  multiplier: number;
}

export interface RarityConfig {
  /**
   * Com Sorte `s`, o peso da raridade de índice `i` (0 = comum) vira peso × s^(i × expoente):
   * mais sorte deixa as raridades altas mais prováveis.
   */
  luckExponentPerTier: number;
  /** Da mais comum para a mais rara. */
  tiers: RarityTier[];
}

export interface EconomyConfig {
  xp: {
    /** XP(n) = base + increment × (n − 1); o incremento sobe `incrementStep` a cada `incrementStepEveryLevels`. */
    base: number;
    increment: number;
    incrementStepEveryLevels: number;
    incrementStep: number;
  };
  difficulty: {
    /** D(t) = 1 + linear × t + quadratic × t², t em minutos. */
    linear: number;
    quadratic: number;
    /**
     * A vida das moléculas cresce mais que a quantidade: vida × D(t) × (1 + hpLinear × t +
     * hpQuadratic × t²), t em minutos.
     */
    hpLinear: number;
    hpQuadratic: number;
    /** Limiar programável t*: a partir dele soma cubic × (t − t*)³. */
    thresholdMinute: number;
    cubic: number;
    /** A cada `peakEveryMinutes` vem um pico de `peakDurationSeconds` e depois um respiro. */
    peakEveryMinutes: number;
    peakMultiplier: number;
    peakDurationSeconds: number;
    respiteSeconds: number;
    respiteMultiplier: number;
  };
  upgrades: {
    /** custo(n) = base × rate^n. */
    runCostRate: number;
    idleCostRate: number;
    runMaxLevelsPerUpgrade: number;
  };
  health: {
    sectorMin: number;
    sectorMax: number;
    /** Multiplicador = 1 + (média dos setores − center) / divisor. */
    multiplierCenter: number;
    multiplierDivisor: number;
    /** Colateral = factor × dose² (chute). */
    collateralFactor: number;
  };
  reset: {
    /** Pontos herdados = (ATP ganho / divisor) ^ exponent. */
    inheritedPointsDivisor: number;
    inheritedPointsExponent: number;
    /** Dificuldade do indivíduo k = factor^k. */
    individualDifficultyFactor: number;
  };
  /** ATP na run (aba Economia): moedas que as moléculas decompostas soltam no chão. */
  runCurrency: {
    /** Chance de uma molécula comum soltar ATP; elites usam `eliteDropChance`. */
    dropChance: number;
    eliteDropChance: number;
    /** Valor do ATP do chefe, em múltiplos do valor normal. */
    bossValueMultiplier: number;
    /** Valor = baseValue × (1 + valuePerMinute × minutos de run), com Rendimento. */
    baseValue: number;
    valuePerMinute: number;
  };
  meta: {
    /** Teto da soma de bônus permanentes de dano e vida. */
    permanentPowerCap: number;
    /** Metas de tempo (minutos) das 3 estrelas de cada caso no hub. */
    caseStarMinutes: number[];
  };
}

export type IdleAgentKind = 'shot' | 'splash' | 'aura' | 'burst';

/** Agente do campo longo (personagens.md, Agentes do idle), fixo num espaço da base. */
export interface IdleAgentDef {
  name: string;
  description: string;
  kind: IdleAgentKind;
  /** Dano por disparo; na aura, por segundo. */
  damage: number;
  cooldownSeconds: number;
  /** Raio da explosão (splash) ou da aura, contado da base. */
  radius?: number;
  /** Aura: quanto desacelera as moléculas dentro dela. */
  slow?: number;
  /** Rajada: quantos disparos e o intervalo entre eles. */
  burst?: number;
  burstIntervalSeconds?: number;
  /** Vitamina D: dano extra por minuto na base, até growthMax. */
  growthPerMinute?: number;
  growthMax?: number;
  /** Melatonina: produção offline extra enquanto está na base. */
  offlineBonus?: number;
  /** Pontos de saúde por hora na base, por setor (também offline). */
  healthPerHour?: Partial<Record<Sector, number>>;
}

export interface IdleUpgradeDef {
  name: string;
  perLevel: number;
  maxLevel: number;
  baseCost: number;
}

/** Campo longo (fase 4, decisão 0022): campo, ondas, agentes, níveis, melhorias e offline. */
export interface IdleConfig {
  field: {
    /** Tamanho lógico do campo, igual em qualquer tela (conceito.md). */
    width: number;
    height: number;
    baseInteractions: number;
    /** Ondas que o campo volta quando a BASE zera. */
    fallbackWaves: number;
    wavePauseSeconds: number;
  };
  waves: {
    /** Moléculas da onda n: baseCount + countPerWave × (n − 1). */
    baseCount: number;
    countPerWave: number;
    spawnIntervalSeconds: number;
    /** Vida da molécula × hpGrowth^(n − 1). */
    hpGrowth: number;
    speed: number;
    speedPerWave: number;
    /** A cada bossEvery ondas, a última molécula é o chefe (com a vida reduzida). */
    bossEvery: number;
    boss: string;
    bossHpMultiplier: number;
    /** Moléculas sorteadas a partir de cada onda. */
    pool: { fromWave: number; kinds: string[] }[];
    /** Interações que a BASE perde por molécula que chega, pelo tipo de dano. */
    baseDamage: Record<ContactDamageKind, number>;
    /** ATP por molécula decomposta: atpPerKill × atpGrowthPerWave^(n − 1), com o hp da molécula. */
    atpPerKill: number;
    atpGrowthPerWave: number;
  };
  agents: Record<string, IdleAgentDef>;
  start: string[];
  unlockCost: Record<string, number>;
  levels: { damagePerLevel: number; baseCost: number; costRate: number; maxLevel: number };
  upgrades: Record<'fireRate' | 'baseSlots' | 'offlineCapHours', IdleUpgradeDef>;
  fireRate: Omit<Stat, 'name' | 'metaCap'>;
  baseSlots: Omit<Stat, 'name' | 'metaCap'>;
  offlineCapHours: Omit<Stat, 'name' | 'metaCap'>;
  offline: { estimateSeconds: number; minSeconds: number };
  /** Velocidade do botão x2. */
  speedUp: number;
}

export interface DisplayConfig {
  /** Tamanho do ladrilho do chão, em unidades do mundo (decisão 0009). */
  tileSizePx: number;
  /** Área visível que a escala do mundo tenta mostrar no lado menor da tela, em unidades do mundo. */
  minVisibleShortSidePx: number;
  /**
   * Telas grandes (lado menor em pixels CSS a partir deste valor, como o PC) mostram
   * `minVisibleShortSidePxLarge` unidades: no monitor, 360 unidades deixavam tudo ampliado demais.
   */
  largeScreenShortSideCss: number;
  minVisibleShortSidePxLarge: number;
  /** O mesmo para as telas de interface: no PC, 320 unidades davam zoom 4× e os menus não cabiam. */
  uiMinShortSidePxLarge: number;
  /**
   * Pixels de arte por unidade do mundo com que os sprites podem ser desenhados. A escala do
   * mundo escolhe um deles conforme a tela, para cada pixel de arte ser um número inteiro de
   * pixels da tela.
   */
  spriteDetails: number[];
  /** Menor lado da tela de interface (menu, HUD), em unidades; o zoom inteiro sai daqui. */
  uiMinShortSidePx: number;
  /** Valor inicial da opção "mostrar FPS", antes de o jogador mudar nas Opções. */
  showFps: boolean;
  /**
   * Tamanhos em que os ícones de 16×16 são gerados como PNG (pastas de public/sprites/icons).
   * O jogo carrega o tamanho que bate com o zoom da tela (decisão 0020).
   */
  iconSizesPx: number[];
  /** Escalas das molduras dos espaços de ícone geradas como PNG. */
  frameScales: number[];
}

/** Nó da árvore do Laboratório: um atributo que sobe por nível, comprado com ATP (meta.json). */
export interface LabNode {
  /** Atributo de stats.json; os do especial vêm como `special.<chave>`. */
  stat: string;
  /** Quanto cada nível soma ao valor base do atributo. */
  perLevel: number;
  maxLevel: number;
  /** Custo do primeiro nível; os seguintes custam baseCost × runCostRate^nível (economy.json). */
  baseCost: number;
  /** Posição na árvore: coluna (fracionária no nó raiz) e linha. */
  col: number;
  row: number;
  /** Nós que precisam ter pelo menos um nível antes deste. */
  requires: string[];
}

/** Meta-progressão (aba Economia, docs/menu.md): o que começa liberado, desbloqueios, estrelas. */
export interface MetaConfig {
  /** Agentes e armas do pool liberados num save novo. */
  start: { agents: string[]; weapons: string[]; receptors: string[] };
  /** ATP para desbloquear cada agente e arma que não começa liberado. */
  unlockCost: {
    agents: Record<string, number>;
    weapons: Record<string, number>;
    receptors: Record<string, number>;
  };
  /** ATP do baú por estrela do caso, na ordem das metas de `caseStarMinutes`. */
  starRewards: number[];
  lab: { columns: string[]; nodes: Record<string, LabNode> };
}

/** Os quatro setores de saúde do organismo (mecanicas.md). */
export type Sector = 'physical' | 'mental' | 'executive' | 'social';
export const SECTORS: readonly Sector[] = ['physical', 'mental', 'executive', 'social'];

/**
 * Efeito de um setor num atributo: cresce até `at100` com o setor em 100 e até `at0` com o setor
 * em 0, passando por zero em 50. `special.<chave>` mexe no especial; `idleProduction` no idle.
 */
export interface SectorEffect {
  stat: string;
  at100: number;
  at0: number;
}

/** Organismo (fase 5, decisão 0023): setores, doenças dos indivíduos, alta e herança. */
export interface OrganismConfig {
  sectors: Record<Sector, { name: string; families: MoleculeType[]; effects: SectorEffect[] }>;
  /** Peso das moléculas de cada família no sorteio: at0 com o setor em 0, at100 em 100. */
  familyWeight: { at0: number; at100: number };
  /** Todos os setores a partir deste valor abrem a ALTA. */
  healthyThreshold: number;
  /** A saúde da run escala com os minutos: efeito cheio em minutesForFullEffect, até maxEffectScale. */
  run: { minutesForFullEffect: number; maxEffectScale: number };
  /** Doença de cada indivíduo, em ordem: os setores com que ele começa. */
  illnesses: { name: string; sectors: Record<Sector, number> }[];
  /** Cada indivíduo novo começa com os setores mais baixos nesta quantidade. */
  sectorDropPerIndividual: number;
  minStartSector: number;
  /** Bônus de ATP (run e idle) por ponto herdado. */
  inheritedAtpBonusPerPoint: number;
}

/** Itens que as vesículas soltam (docs/itens.md, decisão 0024). */
export const ITEM_IDS = [
  'atp',
  'serum',
  'glucose',
  'dryIce',
  'osmosis',
  'glycogen',
  'lysosome',
  'bunsen',
  'glucagon',
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export interface ItemDef {
  /** Nome mostrado no jogo e no Compêndio. */
  name: string;
  /** O que o item faz, numa frase, para o Compêndio. */
  description: string;
  /** Peso no sorteio da vesícula. */
  weight: number;
  /** Nível da run a partir do qual o item pode sair. */
  minLevel: number;
  /** A Sorte multiplica o peso (todos menos ATP e Glicose, como no Vampire Survivors). */
  luck: boolean;
  /** ATP em moedas do valor atual, × Rendimento (ATP, Glicose, Glicogênio). */
  coins?: number;
  /** Interações recuperadas (Soro). */
  heal?: number;
  /** Duração do efeito (Gelo seco, Bico de Bunsen, Febre de ATP). */
  seconds?: number;
}

/** Itens no mapa da fase 5.5 (drops.json). */
export interface DropsConfig {
  vesicles: {
    everySeconds: number;
    maxOnField: number;
    radiusPx: number;
    /** A vesícula a mais que este tanto de telas de distância some. */
    despawnViewMultiplier: number;
  };
  items: Record<ItemId, ItemDef>;
  /** Bico de Bunsen: dano por segundo (× Reatividade), alcance e abertura (× Difusão). */
  flame: { damagePerSecond: number; rangePx: number; spreadRadians: number };
  /** Febre de ATP: segundos somados a cada ATP coletado. */
  /** Febre de ATP: chance de ATP por molécula, segundos por ATP coletado e teto. */
  fever: { dropChance: number; secondsPerCoin: number; maxSeconds: number };
  /**
   * Cor da gema pelo XP: ciano até `smallMaxXp`, verde até `mediumMaxXp`, vermelha acima.
   * `chance`: chance de soltar gema por tipo de molécula; a gema vale o XP dividido pela chance.
   */
  gems: {
    smallMaxXp: number;
    mediumMaxXp: number;
    chance: { common: number; fragment: number; strong: number };
  };
  /** Ampola (o baú do Megabonk, decisão 0028): chance por molécula, garantia e intervalo. */
  ampoule: {
    chance: { common: number; strong: number };
    /** Sem ampola de molécula comum por este tempo, a chance dobra até sair uma. */
    guaranteeSeconds: number;
    /** No máximo uma ampola de molécula comum a cada este tempo. */
    minIntervalSeconds: number;
    /** Raridade mínima da ampola do chefe. */
    bossMinRarity: SupplementRarity;
    touchRadiusPx: number;
  };
  capsule: {
    /** Chefe a partir deste minuto solta a cápsula de prata, que pode evoluir arma. */
    silverAfterMinutes: number;
    fiveChance: number;
    threeChance: number;
    /** Faixa de ATP, em moedas, por quantidade de itens. */
    coins: Record<'1' | '3' | '5', number[]>;
    /** Sorte de principiante: quantidade fixa das primeiras cápsulas do save. */
    beginner: number[];
    touchRadiusPx: number;
  };
  /** ATP, em moedas, quando a cápsula ou o level up não têm mais o que subir. */
  phosphocreatine: { coins: number };
}

/** Raridades dos suplementos (decisão 0028); `tier` é o id em rarities.json, para a cor. */
export const SUPPLEMENT_RARITIES = ['common', 'rare', 'ultraRare', 'legendary'] as const;
export type SupplementRarity = (typeof SUPPLEMENT_RARITIES)[number];

/** O que um suplemento faz; cada cópia soma de novo. */
export type SupplementEffect =
  /** Soma ao atributo da run, até o teto (stats.json). */
  | { kind: 'stat'; stat: RunStatKey; value: number }
  /** Soma a um atributo do especial (grupo special de stats.json). */
  | { kind: 'special'; stat: 'cooldown' | 'power' | 'duration' | 'charges'; value: number }
  /** Nitrogênio líquido: chance de congelar a molécula atingida. */
  | { kind: 'freezeOnHit'; chance: number; seconds: number }
  /** Aquaporina: de tempos em tempos todas as gemas correm até o agente. */
  | { kind: 'gemPulse'; seconds: number }
  /** Eletrodo: chance de faísca ao decompor, que atinge as moléculas mais perto. */
  | { kind: 'spark'; chance: number; targets: number; damage: number; rangePx: number }
  /** Termita: a molécula decomposta explode e queima as vizinhas. */
  | { kind: 'thermite'; damage: number; radiusPx: number }
  /** Criopreservação: perder interações congela tudo, com recarga. */
  | { kind: 'cryo'; seconds: number; cooldownSeconds: number }
  /** Reagente da evolução: liga o passivo de mesmo nome (uma cópia só). */
  | { kind: 'reagent'; passive: string };

export interface SupplementDef {
  name: string;
  rarity: SupplementRarity;
  description: string;
  effect: SupplementEffect;
}

export interface SupplementsConfig {
  rarities: Record<SupplementRarity, { tier: string; weight: number }>;
  /** Peso do reagente quando a arma dele está no máximo sem ele. */
  reagentBoost: number;
  items: Record<string, SupplementDef>;
}
