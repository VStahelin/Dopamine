import type { WeaponDef, WeaponParams } from '../../config';
import type { RunStats } from './stats';

/** Ajustes temporários na ação do agente (Pico de recompensa e a queda depois dele). */
export interface WeaponMods {
  cooldown: number;
  area: number;
}

export const NO_MODS: WeaponMods = { cooldown: 1, area: 1 };

export function weaponMaxLevel(def: WeaponDef): number {
  return def.levels.length + 1;
}

/** Valores da arma no nível, somando os níveis da config. */
export function levelParams(def: WeaponDef, level: number): WeaponParams {
  const p = { ...def.base };
  for (const step of def.levels.slice(0, level - 1)) {
    for (const key of Object.keys(step) as (keyof WeaponParams)[]) p[key] += step[key] ?? 0;
  }
  return p;
}

/**
 * Valores finais de uma arma: nível + atributos do agente (aba Parâmetros) + ajustes do especial.
 * Dose soma projéteis só nos tipos que disparam vários objetos (disparo, órbita, poça).
 */
export function weaponParams(
  def: WeaponDef,
  level: number,
  stats: RunStats,
  mods: WeaponMods = NO_MODS,
): WeaponParams {
  const p = levelParams(def, level);
  const extraCount = ['projectile', 'orbit', 'zone'].includes(def.kind)
    ? Math.floor(stats.projectiles)
    : 0;
  return {
    damage: p.damage * stats.damage,
    cooldownSeconds: p.cooldownSeconds * stats.cooldown * mods.cooldown,
    count: Math.floor(p.count + extraCount),
    areaPx: p.areaPx * stats.area * mods.area,
    rangePx: p.rangePx * stats.range,
    speedPxPerSecond: p.speedPxPerSecond * stats.projectileSpeed,
    pierce: Math.floor(p.pierce + stats.pierce),
    ricochet: Math.floor(p.ricochet + stats.ricochet),
    durationSeconds: p.durationSeconds * stats.duration,
  };
}
