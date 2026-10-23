import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from './rules';
import { computeStats } from './stats';
import { NO_MODS, weaponParams } from './weaponParams';

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

describe('weaponParams', () => {
  it('soma os níveis da arma e aplica os atributos do agente', () => {
    const stats = computeStats(DEFAULT_RULES, {
      reactivity: { level: 1, bonus: 0.1 },
      diffusion: { level: 1, bonus: 0.5 },
    });
    const radical = DEFAULT_RULES.weapons.radical;
    const lv1 = weaponParams(radical, 1, stats);
    const lv3 = weaponParams(radical, 3, stats);
    expect(lv1.damage).toBeCloseTo(radical.base.damage * 1.1);
    expect(lv1.areaPx).toBeCloseTo(radical.base.areaPx * 1.5);
    expect(lv3.count).toBe(lv1.count + 1);
  });

  it('o especial ajusta a recarga e a área da ação', () => {
    const stats = computeStats(DEFAULT_RULES, {});
    const pulse = DEFAULT_RULES.weapons.dopaminePulse;
    const p = weaponParams(pulse, 1, stats, { ...NO_MODS, cooldown: 0.5, area: 2 });
    expect(p.cooldownSeconds).toBeCloseTo(pulse.base.cooldownSeconds * 0.5);
    expect(p.areaPx).toBeCloseTo(pulse.base.areaPx * 2);
  });
});
