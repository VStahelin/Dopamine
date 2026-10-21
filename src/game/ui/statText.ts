import type { RunStatKey } from '../../config';

type Unit = 'pct' | 'int' | 'num' | 'sec' | 'perSec';

/** Como cada atributo aparece na pausa (aba Atributos e efeito somado dos reagentes). */
const UNIT: Record<RunStatKey, Unit> = {
  damage: 'pct',
  projectiles: 'int',
  cooldown: 'pct',
  area: 'pct',
  duration: 'pct',
  projectileSpeed: 'pct',
  range: 'pct',
  pierce: 'int',
  ricochet: 'int',
  critChance: 'pct',
  critDamage: 'pct',
  knockback: 'pct',
  eliteDamage: 'pct',
  effectChance: 'pct',
  maxInteractions: 'num',
  armor: 'num',
  dodge: 'pct',
  regenPerSecond: 'perSec',
  lifesteal: 'pct',
  invulnerabilitySeconds: 'sec',
  revives: 'int',
  thorns: 'pct',
  moveSpeed: 'pct',
  magnet: 'pct',
  xpGain: 'pct',
  currencyGain: 'pct',
  luck: 'pct',
  choices: 'int',
  rerolls: 'int',
  skips: 'int',
  banishes: 'int',
  weaponSlots: 'int',
  modifierSlots: 'int',
  curse: 'pct',
};

/** Atributos em que menos é melhor. */
const LOWER_IS_BETTER: ReadonlySet<RunStatKey> = new Set(['cooldown', 'curse']);

const decimal = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Valor de um atributo: `150%`, `3`, `0,5 s`, `1/s`. */
export function statValue(key: RunStatKey, v: number): string {
  switch (UNIT[key]) {
    case 'pct':
      return `${Math.round(v * 100)}%`;
    case 'int':
      return String(Math.floor(v));
    case 'num':
      return decimal(v);
    case 'sec':
      return `${decimal(v)} s`;
    case 'perSec':
      return `${decimal(v)}/s`;
  }
}

/** Quanto um modificador soma ao atributo, curto: `+50%`, `−24%`, `+1`. */
export function statDelta(key: RunStatKey, v: number): string {
  const sign = v < 0 ? '−' : '+';
  const abs = Math.abs(v);
  return sign + (UNIT[key] === 'int' ? String(Math.round(abs)) : statValue(key, abs));
}

/** Se o valor atual está melhor, pior ou igual à base. */
export function statTrend(
  key: RunStatKey,
  value: number,
  base: number,
): 'better' | 'worse' | 'same' {
  if (Math.abs(value - base) < 1e-9) return 'same';
  const up = value > base;
  return up !== LOWER_IS_BETTER.has(key) ? 'better' : 'worse';
}
