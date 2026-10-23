import type { WeaponDef, WeaponParams } from '../../config';
import type { RunStats } from './stats';

/**
 * Ajustes temporários na ação do agente: Pico de recompensa e a queda depois dele, o pró-fármaco
 * do Venvanse (dano) e o Vínculo da Ocitocina (projéteis).
 */
export interface WeaponMods {
  cooldown: number;
  area: number;
  damage: number;
  count: number;
}

export const NO_MODS: WeaponMods = { cooldown: 1, area: 1, damage: 1, count: 1 };

export function weaponMaxLevel(def: WeaponDef): number {
  return def.levels.length + 1;
}

/** Atributos de arma que só valem inteiros: com raridade, arredondam sem ficar abaixo do comum. */
const INTEGER_PARAMS: readonly (keyof WeaponParams)[] = ['count', 'pierce', 'ricochet'];

/** Ganho de um nível da arma (`index` 0 = nível 2) com o multiplicador da raridade. */
export function levelStep(def: WeaponDef, index: number, multiplier = 1): Partial<WeaponParams> {
  const step = def.levels[index] ?? {};
  const out: Partial<WeaponParams> = {};
  for (const key of Object.keys(step) as (keyof WeaponParams)[]) {
    const base = step[key] ?? 0;
    let value = base * multiplier;
    if (INTEGER_PARAMS.includes(key)) {
      const rounded = Math.round(value);
      value = Math.abs(rounded) < Math.abs(base) ? base : rounded;
    }
    out[key] = value;
  }
  return out;
}

/** Valores da arma no nível, somando os níveis da config com a raridade de cada um. */
export function levelParams(
  def: WeaponDef,
  level: number,
  boosts: readonly number[] = [],
): WeaponParams {
  const p = { ...def.base };
  for (let i = 0; i < Math.min(level - 1, def.levels.length); i++) {
    const step = levelStep(def, i, boosts[i] ?? 1);
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
  boosts: readonly number[] = [],
): WeaponParams {
  const p = levelParams(def, level, boosts);
  const extraCount = ['projectile', 'orbit', 'zone'].includes(def.kind)
    ? Math.floor(stats.projectiles)
    : 0;
  return {
    damage: p.damage * stats.damage * mods.damage,
    cooldownSeconds: p.cooldownSeconds * stats.cooldown * mods.cooldown,
    count: Math.floor((p.count + extraCount) * mods.count),
    areaPx: p.areaPx * stats.area * mods.area,
    rangePx: p.rangePx * stats.range,
    speedPxPerSecond: p.speedPxPerSecond * stats.projectileSpeed,
    pierce: Math.floor(p.pierce + stats.pierce),
    ricochet: Math.floor(p.ricochet + stats.ricochet),
    durationSeconds: p.durationSeconds * stats.duration,
  };
}
