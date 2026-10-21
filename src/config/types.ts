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

export interface RunConfig {
  arena: { widthPx: number; heightPx: number };
  agent: {
    /** Velocidade com Mobilidade 100%. */
    moveSpeedPxPerSecond: number;
    /** Raio de coleta com Ímã 100%. */
    pickupRadiusPx: number;
  };
  /** Interações que cada tipo de inimigo tira ao encostar. */
  contactDamage: { common: number; strong: number; boss: number };
  /** Multiplicador de dano por afinidade entre agente e tipo de molécula. */
  affinity: { strong: number; neutral: number; weak: number };
  /** Dano recebido nunca fica abaixo disto, mesmo com Membrana. */
  minDamageTaken: number;
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
    peakEveryMinutes: number;
    peakMultiplier: number;
    respiteSeconds: number;
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
  };
}

export interface IdleConfig {
  fireRate: Omit<Stat, 'name' | 'metaCap'>;
  baseSlots: Omit<Stat, 'name' | 'metaCap'>;
  offlineCapHours: Omit<Stat, 'name' | 'metaCap'>;
}

export interface DisplayConfig {
  /** Grade base dos sprites, em pixels lógicos (decisão 0009). */
  tileSizePx: number;
  /** O zoom inteiro é o maior que ainda mostra pelo menos isto de pixels lógicos no lado menor da tela. */
  minVisibleShortSidePx: number;
  showFps: boolean;
}
