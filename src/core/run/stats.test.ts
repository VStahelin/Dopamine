import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from './rules';
import { computeStats, weaponStats } from './stats';

describe('computeStats', () => {
  it('começa nos valores base da aba Parâmetros', () => {
    const s = computeStats(DEFAULT_RULES, {});
    expect(s.damage).toBe(1);
    expect(s.maxInteractions).toBe(100);
    expect(s.critChance).toBe(0.05);
    expect(s.choices).toBe(3);
    expect(s.modifierSlots).toBe(4);
  });

  it('soma o bônus acumulado de cada modificador', () => {
    const s = computeStats(DEFAULT_RULES, {
      reactivity: { level: 2, bonus: 0.3 },
      interactions: { level: 1, bonus: 20 },
    });
    expect(s.damage).toBeCloseTo(1.3);
    expect(s.maxInteractions).toBe(120);
  });

  it('respeita o teto da run, inclusive para atributos que caem', () => {
    const s = computeStats(DEFAULT_RULES, {
      metabolism: { level: 5, bonus: -2 },
      evasion: { level: 5, bonus: 5 },
    });
    expect(s.cooldown).toBe(DEFAULT_RULES.stats.offense.cooldown!.runCap);
    expect(s.dodge).toBe(DEFAULT_RULES.stats.defense.dodge!.runCap);
  });
});

describe('weaponStats', () => {
  it('soma os níveis da arma e aplica os atributos do agente', () => {
    const stats = computeStats(DEFAULT_RULES, {
      reactivity: { level: 1, bonus: 0.1 },
      diffusion: { level: 1, bonus: 0.5 },
    });
    const lv1 = weaponStats(DEFAULT_RULES, 1, stats);
    const lv3 = weaponStats(DEFAULT_RULES, 3, stats);
    expect(lv1.damage).toBeCloseTo(DEFAULT_RULES.weapon.damage * 1.1);
    expect(lv1.radius).toBeCloseTo(DEFAULT_RULES.weapon.projectileRadiusPx * 1.5);
    expect(lv3.projectiles).toBe(lv1.projectiles + 1);
  });
});
