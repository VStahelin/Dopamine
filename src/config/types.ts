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
}

export interface WeaponLevel {
  damage?: number;
  cooldownSeconds?: number;
  projectiles?: number;
  pierce?: number;
}

export interface WeaponDef {
  name: string;
  damage: number;
  cooldownSeconds: number;
  projectileSpeedPxPerSecond: number;
  rangePx: number;
  projectiles: number;
  pierce: number;
  projectileRadiusPx: number;
  /** Ângulo entre projéteis do mesmo disparo. */
  spreadDegrees: number;
  /** O que cada nível a partir do 2 soma aos valores base. */
  levels: WeaponLevel[];
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
  meta: {
    /** Teto da soma de bônus permanentes de dano e vida. */
    permanentPowerCap: number;
    /** Metas de tempo (minutos) das 3 estrelas de cada caso no hub. */
    caseStarMinutes: number[];
  };
}

export interface IdleConfig {
  fireRate: Omit<Stat, 'name' | 'metaCap'>;
  baseSlots: Omit<Stat, 'name' | 'metaCap'>;
  offlineCapHours: Omit<Stat, 'name' | 'metaCap'>;
}

export interface DisplayConfig {
  /** Tamanho do ladrilho do chão, em unidades do mundo (decisão 0009). */
  tileSizePx: number;
  /** Área visível que a escala do mundo tenta mostrar no lado menor da tela, em unidades do mundo. */
  minVisibleShortSidePx: number;
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
}
