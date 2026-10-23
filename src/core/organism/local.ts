import {
  MAP,
  MAP_ENVIRONMENTS,
  ORGANISM,
  SECTORS,
  type AgentDef,
  type MapConfig,
  type MapEnvironment,
  type OrganismConfig,
  type Sector,
} from '../../config';
import { hash } from '../map/noise';
import { Rng } from '../random';
import { withStatBonuses, type RunRules } from '../run/rules';
import type { OrganismState } from './organism';

/**
 * Locais do corpo (fase 5.12, decisão 0032): o jogador escolhe onde a run acontece. Cada local
 * dobra uma família de molécula e multiplica o ganho do agente num setor; o par agente × local
 * pode ter sinergia. Funções puras; números em map.json (`locals`), agents.json e organism.json.
 */

/** O que o jogador escolheu: um local ou "Qualquer lugar" (sorteado pela semente). */
export type LocalChoice = MapEnvironment | 'random';

/** O local da run e se veio do sorteio. */
export interface RunLocal {
  env: MapEnvironment;
  random: boolean;
}

/** O agente entra no local? Só o Cérebro tem barreira. */
export function canEnter(agent: AgentDef, env: MapEnvironment): boolean {
  return env !== 'brain' || agent.crossesBloodBrainBarrier !== false;
}

/** Setor que o par agente × local melhora, ou null sem sinergia. */
export function synergyOf(agent: AgentDef, env: MapEnvironment): Sector | null {
  return agent.synergy?.env === env ? agent.synergy.sector : null;
}

/** Os locais abrem na primeira estrela do primeiro caso e ficam abertos depois da ALTA. */
export function localsUnlocked(
  stars: number,
  organism: OrganismState,
  cfg: MapConfig = MAP,
): boolean {
  return organism.individual > 1 || stars >= cfg.locals.unlockStar;
}

/** Local INDICADO: o do setor mais baixo do caso (o primeiro na ordem, se empatar). */
export function indicatedLocal(
  organism: OrganismState,
  cfg: MapConfig = MAP,
): MapEnvironment | null {
  let best: MapEnvironment | null = null;
  for (const env of MAP_ENVIRONMENTS) {
    const sector = cfg.environments[env].sector;
    if (!sector) continue;
    if (!best || organism.sectors[sector] < organism.sectors[cfg.environments[best].sector!]) {
      best = env;
    }
  }
  return best;
}

/**
 * Local da run: o escolhido, ou um sorteado pela semente entre os que o agente entra. Locais
 * fechados e o Cérebro barrado viram a Corrente sanguínea.
 */
export function resolveLocal(
  choice: LocalChoice,
  agent: AgentDef,
  seed: number,
  unlocked: boolean,
): RunLocal {
  if (!unlocked) return { env: 'blood', random: false };
  if (choice === 'random') {
    const envs = MAP_ENVIRONMENTS.filter((e) => canEnter(agent, e));
    const rng = new Rng(hash(seed, 98));
    return { env: envs[rng.int(envs.length)] ?? 'blood', random: true };
  }
  return { env: canEnter(agent, choice) ? choice : 'blood', random: false };
}

/**
 * Regras da run no local: a família do local com peso dobrado, o ATP do sorteio e o receptor
 * nativo do par com sinergia. Vem depois do organismo, por cima dos pesos da doença.
 */
export function rulesWithLocal(
  rules: RunRules,
  local: RunLocal,
  agent: AgentDef,
  cfg: MapConfig = MAP,
  org: OrganismConfig = ORGANISM,
): RunRules {
  const def = cfg.environments[local.env];
  const w = cfg.locals.familyWeight;
  const familyWeights = { ...rules.familyWeights };
  for (const f of def.families) familyWeights[f] = (familyWeights[f] ?? 1) * w;
  const enemies = Object.fromEntries(
    Object.entries(rules.enemies).map(([id, e]) => [
      id,
      def.families.includes(e.type) ? { ...e, spawnWeight: e.spawnWeight * w } : e,
    ]),
  ) as RunRules['enemies'];
  const withAtp = local.random
    ? withStatBonuses(rules, { currencyGain: cfg.locals.randomAtpBonus }, 'local')
    : rules;
  const synergy = synergyOf(agent, local.env);
  return {
    ...withAtp,
    enemies,
    familyWeights,
    mapEnv: local.env,
    local: { ...local, synergy },
    nativeReceptorStart: synergy ? org.synergy.nativeReceptorLevel : 0,
  };
}

/** Saúde do fim da run separada: o que veio do agente, do setor do local e da sinergia. */
export interface LocalHealth {
  agent: Partial<Record<Sector, number>>;
  local: Partial<Record<Sector, number>>;
  synergy: Partial<Record<Sector, number>>;
  total: Partial<Record<Sector, number>>;
}

/**
 * Saúde que o agente dá no fim da run no local: o efeito dele pelos minutos, ×1,5 no setor do
 * local (só se ele já sobe esse setor) e, com sinergia, +4 no setor do par e colateral pela metade.
 */
export function localHealth(
  agent: AgentDef,
  minutes: number,
  env: MapEnvironment,
  cfg: MapConfig = MAP,
  org: OrganismConfig = ORGANISM,
): LocalHealth {
  const scale = Math.min(org.run.maxEffectScale, minutes / org.run.minutesForFullEffect);
  const synergy = synergyOf(agent, env);
  const sector = cfg.environments[env].sector;
  const out: LocalHealth = { agent: {}, local: {}, synergy: {}, total: {} };
  const add = (part: Partial<Record<Sector, number>>, s: Sector, v: number) => {
    if (v === 0) return;
    part[s] = (part[s] ?? 0) + v;
    out.total[s] = (out.total[s] ?? 0) + v;
  };
  for (const s of SECTORS) {
    const gain = (agent.health?.[s] ?? 0) * scale;
    const collateral = (agent.collateral?.[s] ?? 0) * scale;
    add(out.agent, s, gain + collateral);
    if (s === sector && gain > 0) add(out.local, s, gain * (cfg.locals.sectorMultiplier - 1));
    if (synergy && collateral !== 0) {
      add(out.synergy, s, collateral * (org.synergy.collateralMultiplier - 1));
    }
  }
  if (synergy) add(out.synergy, synergy, org.synergy.health * scale);
  return out;
}
