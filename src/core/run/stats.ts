import {
  RUN_STAT_KEYS,
  type AgentId,
  type PassiveId,
  type RunStatKey,
  type Stat,
} from '../../config';
import type { RunRules } from './rules';

/** Atributos do agente durante a run (aba Parâmetros), já com os modificadores aplicados. */
export type RunStats = Record<RunStatKey, number>;

/** Quantas vezes um modificador foi escolhido e quanto ele já soma ao atributo. */
export interface PassiveState {
  level: number;
  bonus: number;
}

export type PassiveLevels = Partial<Record<PassiveId, PassiveState>>;

const GROUPS = ['offense', 'defense', 'mobility', 'levelUp', 'risk'] as const;

/** Definição de um atributo em stats.json, procurando nos grupos da run. */
export function statDef(rules: RunRules, key: RunStatKey): Stat {
  for (const group of GROUPS) {
    const def = rules.stats[group][key];
    if (def) return def;
  }
  throw new Error(`stats.json não tem o atributo "${key}"`);
}

/** Aplica o teto da run; atributos que caem (como a recarga) têm o teto como mínimo. */
function capped(value: number, def: Stat): number {
  if (def.runCap === null) return value;
  return def.runCap < def.base ? Math.max(value, def.runCap) : Math.min(value, def.runCap);
}

/**
 * O que o agente soma aos atributos por ser quem é: o perfil próprio (a Cafeína anda mais rápido)
 * e o receptor nativo no nível `nativeLevel`. Aparece como PERFIL na pausa.
 */
export function agentBonus(
  rules: RunRules,
  agentId: AgentId,
  nativeLevel: number,
): Partial<Record<RunStatKey, number>> {
  const agent = rules.agents[agentId];
  const out: Partial<Record<RunStatKey, number>> = { ...agent.profile };
  const native = agent.nativeReceptor;
  if (native.stat) out[native.stat] = (out[native.stat] ?? 0) + native.perLevel * nativeLevel;
  return out;
}

/** Atributos com os receptores e, em `bonus`, o que a run somou fora deles (Vitamina, Mutação). */
export function computeStats(
  rules: RunRules,
  passives: PassiveLevels,
  bonus: Partial<RunStats> = {},
): RunStats {
  const stats = {} as RunStats;
  for (const key of RUN_STAT_KEYS) stats[key] = statDef(rules, key).base + (bonus[key] ?? 0);
  for (const [id, p] of Object.entries(passives) as [PassiveId, PassiveState][]) {
    const def = rules.passives[id];
    if (def.mutation) continue;
    stats[def.stat] += p.bonus;
    if (def.alsoStat) stats[def.alsoStat] += p.bonus;
  }
  for (const key of RUN_STAT_KEYS) stats[key] = capped(stats[key], statDef(rules, key));
  return stats;
}
