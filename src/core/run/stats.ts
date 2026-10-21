import type { PassiveId, PassiveStat, Stat, WeaponLevel } from '../../config';
import type { RunRules } from './rules';

/** Atributos do agente durante a run, já com os modificadores passivos aplicados. */
export interface RunStats {
  damage: number;
  cooldown: number;
  moveSpeed: number;
  magnet: number;
  maxInteractions: number;
  xpGain: number;
  projectiles: number;
  pierce: number;
  armor: number;
  invulnerabilitySeconds: number;
}

export type PassiveLevels = Partial<Record<PassiveId, number>>;

function statDef(rules: RunRules, stat: PassiveStat): Stat {
  const s = rules.stats;
  switch (stat) {
    case 'damage':
      return s.offense.damage!;
    case 'cooldown':
      return s.offense.cooldown!;
    case 'moveSpeed':
      return s.mobility.moveSpeed!;
    case 'magnet':
      return s.mobility.magnet!;
    case 'maxInteractions':
      return s.defense.maxInteractions!;
    case 'xpGain':
      return s.mobility.xpGain!;
  }
}

/** Aplica o teto da run; atributos que caem (como a recarga) têm o teto como mínimo. */
function capped(value: number, def: Stat): number {
  if (def.runCap === null) return value;
  return def.runCap < def.base ? Math.max(value, def.runCap) : Math.min(value, def.runCap);
}

export function computeStats(rules: RunRules, passives: PassiveLevels): RunStats {
  const { offense, defense } = rules.stats;
  const stats: RunStats = {
    damage: statDef(rules, 'damage').base,
    cooldown: statDef(rules, 'cooldown').base,
    moveSpeed: statDef(rules, 'moveSpeed').base,
    magnet: statDef(rules, 'magnet').base,
    maxInteractions: statDef(rules, 'maxInteractions').base,
    xpGain: statDef(rules, 'xpGain').base,
    projectiles: offense.projectiles!.base,
    pierce: offense.pierce!.base,
    armor: defense.armor!.base,
    invulnerabilitySeconds: defense.invulnerabilitySeconds!.base,
  };

  for (const [id, level] of Object.entries(passives) as [PassiveId, number][]) {
    const def = rules.passives[id];
    stats[def.stat] += def.perLevel * level;
  }
  for (const stat of Object.keys(rules.passives).map(
    (id) => rules.passives[id as PassiveId].stat,
  )) {
    stats[stat] = capped(stats[stat], statDef(rules, stat));
  }
  return stats;
}

/** Valores da arma num nível, somando os níveis da config e os atributos do agente. */
export interface WeaponStats {
  damage: number;
  cooldownSeconds: number;
  projectiles: number;
  pierce: number;
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
    projectiles: w.projectiles + sum.projectiles + stats.projectiles,
    pierce: w.pierce + sum.pierce + stats.pierce,
    speed: w.projectileSpeedPxPerSecond,
    range: w.rangePx,
    radius: w.projectileRadiusPx,
    spreadRadians: (w.spreadDegrees * Math.PI) / 180,
  };
}

export function weaponMaxLevel(rules: RunRules): number {
  return rules.weapon.levels.length + 1;
}
