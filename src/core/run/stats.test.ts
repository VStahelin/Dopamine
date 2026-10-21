import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from './rules';
import { computeStats, weaponStats } from './stats';

describe('computeStats', () => {
  it('começa nos valores base', () => {
    const s = computeStats(DEFAULT_RULES, {});
    expect(s.damage).toBe(1);
    expect(s.maxInteractions).toBe(100);
  });

  it('soma os modificadores passivos', () => {
    const s = computeStats(DEFAULT_RULES, { reactivity: 2, interactions: 1 });
    expect(s.damage).toBeCloseTo(1.2);
    expect(s.maxInteractions).toBe(120);
  });

  it('respeita o teto da run, inclusive para atributos que caem', () => {
    const rules = {
      ...DEFAULT_RULES,
      passives: {
        ...DEFAULT_RULES.passives,
        metabolism: { ...DEFAULT_RULES.passives.metabolism, perLevel: -0.5 },
      },
    };
    const s = computeStats(rules, { metabolism: 5 });
    expect(s.cooldown).toBe(DEFAULT_RULES.stats.offense.cooldown!.runCap);
  });
});

describe('weaponStats', () => {
  it('soma os níveis da arma e aplica os atributos do agente', () => {
    const stats = computeStats(DEFAULT_RULES, { reactivity: 1 });
    const lv1 = weaponStats(DEFAULT_RULES, 1, stats);
    const lv3 = weaponStats(DEFAULT_RULES, 3, stats);
    expect(lv1.damage).toBeCloseTo(DEFAULT_RULES.weapon.damage * 1.1);
    expect(lv3.projectiles).toBe(lv1.projectiles + 1);
  });
});
