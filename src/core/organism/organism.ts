import {
  ECONOMY,
  ORGANISM,
  SECTORS,
  type AgentDef,
  type EconomyConfig,
  type IdleAgentDef,
  type MoleculeType,
  type OrganismConfig,
  type Sector,
  type SectorEffect,
} from '../../config';
import { withStatBonuses, type RunRules } from '../run/rules';

/**
 * Organismo (fase 5, decisão 0023): os quatro setores de saúde do indivíduo, de 0 a 100. Os
 * setores mudam o jogo (vida, especial, level up, idle), decidem quais moléculas aparecem mais e,
 * todos saudáveis, abrem a ALTA para o próximo indivíduo, mais doente. Funções puras.
 */
export interface OrganismState {
  /** Indivíduo atual (1, 2, 3...). */
  individual: number;
  sectors: Record<Sector, number>;
  /** ATP ganho neste indivíduo (run, estrelas e idle), base dos pontos herdados. */
  atpEarned: number;
  /** Pontos herdados de todos os indivíduos anteriores. */
  inherited: number;
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/** Setores com que o indivíduo `k` começa: a doença dele, mais forte a cada indivíduo. */
export function startingSectors(k: number, org: OrganismConfig = ORGANISM): Record<Sector, number> {
  const illness = org.illnesses[(k - 1) % org.illnesses.length]!;
  const drop = org.sectorDropPerIndividual * (k - 1);
  return Object.fromEntries(
    SECTORS.map((s) => [s, Math.max(org.minStartSector, illness.sectors[s] - drop)]),
  ) as Record<Sector, number>;
}

export function illnessName(k: number, org: OrganismConfig = ORGANISM): string {
  return org.illnesses[(k - 1) % org.illnesses.length]!.name;
}

export function defaultOrganism(org: OrganismConfig = ORGANISM): OrganismState {
  return { individual: 1, sectors: startingSectors(1, org), atpEarned: 0, inherited: 0 };
}

// --- Efeitos dos setores ---

/** Valor de um efeito com o setor em `s`: zero em 50, `at100` em 100 e `at0` em 0. */
export function effectValue(effect: SectorEffect, s: number): number {
  return s >= 50 ? (effect.at100 * (s - 50)) / 50 : (effect.at0 * (50 - s)) / 50;
}

/** Soma dos efeitos de todos os setores, por atributo. */
export function sectorEffects(
  o: OrganismState,
  org: OrganismConfig = ORGANISM,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const sector of SECTORS) {
    for (const e of org.sectors[sector].effects) {
      out[e.stat] = (out[e.stat] ?? 0) + effectValue(e, o.sectors[sector]);
    }
  }
  return out;
}

/** Peso de cada tipo de molécula: setor baixo puxa a família dele, setor alto afasta. */
export function familyWeights(
  o: OrganismState,
  org: OrganismConfig = ORGANISM,
): Partial<Record<MoleculeType, number>> {
  const out: Partial<Record<MoleculeType, number>> = {};
  for (const sector of SECTORS) {
    const t = o.sectors[sector] / 100;
    const w = org.familyWeight.at0 + (org.familyWeight.at100 - org.familyWeight.at0) * t;
    for (const f of org.sectors[sector].families) out[f] = w;
  }
  return out;
}

export function averageHealth(o: OrganismState): number {
  return SECTORS.reduce((sum, s) => sum + o.sectors[s], 0) / SECTORS.length;
}

/** Multiplicador de saúde da aba Economia: 1 + (média − 50) / 100. */
export function healthMultiplier(o: OrganismState, economy: EconomyConfig = ECONOMY): number {
  const h = economy.health;
  return 1 + (averageHealth(o) - h.multiplierCenter) / h.multiplierDivisor;
}

/** Dificuldade do indivíduo k: 1,25^(k − 1) (aba Economia). */
export function individualDifficulty(o: OrganismState, economy: EconomyConfig = ECONOMY): number {
  return economy.reset.individualDifficultyFactor ** (o.individual - 1);
}

/** Bônus de ATP dos pontos herdados. */
export function atpMultiplier(o: OrganismState, org: OrganismConfig = ORGANISM): number {
  return 1 + o.inherited * org.inheritedAtpBonusPerPoint;
}

/** Multiplicador do ATP do idle: saúde geral, setor Social e pontos herdados. */
export function idleMultiplier(o: OrganismState, org: OrganismConfig = ORGANISM): number {
  const social = sectorEffects(o, org).idleProduction ?? 0;
  return Math.max(0.1, healthMultiplier(o) * (1 + social) * atpMultiplier(o, org));
}

// --- Mudanças na saúde ---

/** Aplica pontos com retorno decrescente: perto de 100 quase não sobe, perto de 0 cai menos. */
export function applyHealth(
  o: OrganismState,
  deltas: Partial<Record<Sector, number>>,
): OrganismState {
  const sectors = { ...o.sectors };
  for (const s of SECTORS) {
    const d = deltas[s] ?? 0;
    if (d === 0) continue;
    const v = sectors[s];
    sectors[s] = clamp(v + (d > 0 ? d * (1 - v / 100) : d * (0.5 + v / 200)));
  }
  return { ...o, sectors };
}

/** Saúde que um agente da run dá no fim, proporcional aos minutos que durou, com colateral. */
export function runHealth(
  agent: AgentDef,
  minutes: number,
  org: OrganismConfig = ORGANISM,
): Partial<Record<Sector, number>> {
  const scale = Math.min(org.run.maxEffectScale, minutes / org.run.minutesForFullEffect);
  const out: Partial<Record<Sector, number>> = {};
  for (const s of SECTORS) {
    const v = ((agent.health?.[s] ?? 0) + (agent.collateral?.[s] ?? 0)) * scale;
    if (v !== 0) out[s] = v;
  }
  return out;
}

/** Saúde que os agentes do idle na base dão em `hours` horas. */
export function idleHealth(agents: IdleAgentDef[], hours: number): Partial<Record<Sector, number>> {
  const out: Partial<Record<Sector, number>> = {};
  for (const a of agents) {
    for (const s of SECTORS) {
      const v = (a.healthPerHour?.[s] ?? 0) * hours;
      if (v !== 0) out[s] = (out[s] ?? 0) + v;
    }
  }
  return out;
}

export function earn(o: OrganismState, atp: number): OrganismState {
  return atp > 0 ? { ...o, atpEarned: o.atpEarned + atp } : o;
}

// --- Alta ---

export function canDischarge(o: OrganismState, org: OrganismConfig = ORGANISM): boolean {
  return SECTORS.every((s) => o.sectors[s] >= org.healthyThreshold);
}

/** Pontos herdados do ATP ganho: (ATP / divisor)^expoente (aba Economia). */
export function inheritedPoints(atpEarned: number, economy: EconomyConfig = ECONOMY): number {
  const r = economy.reset;
  return Math.floor((atpEarned / r.inheritedPointsDivisor) ** r.inheritedPointsExponent);
}

/** Próximo indivíduo: mais doente, com os pontos deste somados aos herdados. */
export function discharge(o: OrganismState, org: OrganismConfig = ORGANISM): OrganismState {
  const k = o.individual + 1;
  return {
    individual: k,
    sectors: startingSectors(k, org),
    atpEarned: 0,
    inherited: o.inherited + inheritedPoints(o.atpEarned),
  };
}

// --- Regras da run com o organismo ---

/**
 * Regras da run para o indivíduo: efeitos dos setores nos atributos, pontos herdados no ATP,
 * vida das moléculas pela dificuldade do indivíduo e o sorteio puxado pela doença.
 */
export function rulesWithOrganism(
  rules: RunRules,
  o: OrganismState,
  org: OrganismConfig = ORGANISM,
): RunRules {
  const effects = sectorEffects(o, org);
  delete effects.idleProduction;
  effects.currencyGain = (effects.currencyGain ?? 0) + o.inherited * org.inheritedAtpBonusPerPoint;
  const withStats = withStatBonuses(rules, effects);
  const difficulty = individualDifficulty(o);
  const weights = familyWeights(o, org);
  const enemies = Object.fromEntries(
    Object.entries(rules.enemies).map(([id, def]) => [
      id,
      { ...def, hp: def.hp * difficulty, spawnWeight: def.spawnWeight * (weights[def.type] ?? 1) },
    ]),
  ) as RunRules['enemies'];
  return { ...withStats, enemies, familyWeights: weights };
}
