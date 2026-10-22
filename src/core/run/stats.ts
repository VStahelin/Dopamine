import { RUN_STAT_KEYS, type PassiveId, type RunStatKey, type Stat } from '../../config';
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
