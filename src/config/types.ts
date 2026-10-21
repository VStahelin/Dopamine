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
  /** Efetividade por tipo de molécula; o que faltar é neutro. */
  affinity: Partial<Record<MoleculeType, AffinityLevel>>;
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
export interface PassiveDef {
  name: string;
  stat: RunStatKey;
  /** Quanto cada escolha comum soma ao atributo, na unidade do atributo em stats.json. */
  perLevel: number;
  /** Quantas vezes pode ser escolhido na run. */
  maxLevel: number;
  /** Atributo inteiro (projéteis, perfuração...): o valor com raridade é arredondado. */
  integer?: boolean;
  /** Não ocupa espaço de modificador (o próprio "Espaços de modificador"). */
  freeSlot?: boolean;
  /** Reagente: além do atributo, é o que uma arma no máximo pede para evoluir. */
  reagent?: boolean;
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
  start: { agents: string[]; weapons: string[] };
  /** ATP para desbloquear cada agente e arma que não começa liberado. */
  unlockCost: { agents: Record<string, number>; weapons: Record<string, number> };
  /** ATP do baú por estrela do caso, na ordem das metas de `caseStarMinutes`. */
  starRewards: number[];
  lab: { columns: string[]; nodes: Record<string, LabNode> };
}
