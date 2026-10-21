import {
  RUN_STAT_KEYS,
  type PassiveId,
  type RunStatKey,
  type Stat,
  type WeaponLevel,
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

export function computeStats(rules: RunRules, passives: PassiveLevels): RunStats {
  const stats = {} as RunStats;
  for (const key of RUN_STAT_KEYS) stats[key] = statDef(rules, key).base;
  for (const [id, p] of Object.entries(passives) as [PassiveId, PassiveState][]) {
    stats[rules.passives[id].stat] += p.bonus;
  }
  for (const key of RUN_STAT_KEYS) stats[key] = capped(stats[key], statDef(rules, key));
  return stats;
}

/** Valores da arma num nível, somando os níveis da config e os atributos do agente. */
export interface WeaponStats {
  damage: number;
  cooldownSeconds: number;
  projectiles: number;
  pierce: number;
  ricochet: number;
  speed: number;
  range: number;
  radius: number;
  spreadRadians: number;
}

export function weaponStats(rules: RunRules, level: number, stats: RunStats): WeaponStats {
  const w = rules.weapon;
  const sum: Required<WeaponLevel> = { damage: 0, cooldownSeconds: 0, projectiles: 0, pierce: 0 };
  for (const step of w.levels.slice(0, level - 1)) {
    sum.damage += step.damage ?? 0;
    sum.cooldownSeconds += step.cooldownSeconds ?? 0;
    sum.projectiles += step.projectiles ?? 0;
    sum.pierce += step.pierce ?? 0;
  }
  return {
    damage: (w.damage + sum.damage) * stats.damage,
    cooldownSeconds: (w.cooldownSeconds + sum.cooldownSeconds) * stats.cooldown,
    projectiles: Math.floor(w.projectiles + sum.projectiles + stats.projectiles),
    pierce: Math.floor(w.pierce + sum.pierce + stats.pierce),
    ricochet: Math.floor(stats.ricochet),
    speed: w.projectileSpeedPxPerSecond * stats.projectileSpeed,
    range: w.rangePx * stats.range,
    radius: w.projectileRadiusPx * stats.area,
    spreadRadians: (w.spreadDegrees * Math.PI) / 180,
  };
}

export function weaponMaxLevel(rules: RunRules): number {
  return rules.weapon.levels.length + 1;
}
