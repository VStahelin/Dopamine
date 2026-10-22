import { describe, expect, it } from 'vitest';
import { AGENTS, ECONOMY, ORGANISM } from '../../config';
import { DEFAULT_RULES } from '../run/rules';
import { createRun } from '../run/state';
import { defaultSave } from '../save/saveData';
import { dischargeSave } from './discharge';
import {
  applyHealth,
  canDischarge,
  defaultOrganism,
  discharge,
  effectValue,
  familyWeights,
  healthMultiplier,
  inheritedPoints,
  rulesWithOrganism,
  runHealth,
  type OrganismState,
} from './organism';

const healthy = (v: number): OrganismState => ({
  ...defaultOrganism(),
  sectors: { physical: v, mental: v, executive: v, social: v },
});

describe('setores', () => {
  it('efeito zero em 50, cheio nos extremos', () => {
    const e = { stat: 'x', at100: 30, at0: -40 };
    expect(effectValue(e, 50)).toBe(0);
    expect(effectValue(e, 100)).toBe(30);
    expect(effectValue(e, 0)).toBe(-40);
    expect(effectValue(e, 75)).toBe(15);
  });

  it('a Física baixa do primeiro indivíduo tira interações; saudável dá mais', () => {
    const sick = createRun(1, rulesWithOrganism(DEFAULT_RULES, defaultOrganism()));
    const well = createRun(1, rulesWithOrganism(DEFAULT_RULES, healthy(100)));
    const base = createRun(1, DEFAULT_RULES);
    expect(sick.stats.maxInteractions).toBeLessThan(base.stats.maxInteractions);
    expect(well.stats.maxInteractions).toBeGreaterThan(base.stats.maxInteractions);
  });

  it('setor baixo puxa a família dele', () => {
    const w = familyWeights(defaultOrganism());
    expect(w.sugar!).toBeGreaterThan(w.stress!);
  });

  it('multiplicador de saúde segue a aba Economia', () => {
    expect(healthMultiplier(healthy(50))).toBe(1);
    expect(healthMultiplier(healthy(90))).toBeCloseTo(1.4);
  });
});

describe('saúde', () => {
  it('retorno decrescente: perto de 100 quase não sobe', () => {
    const low = applyHealth(healthy(10), { physical: 10 }).sectors.physical - 10;
    const high = applyHealth(healthy(90), { physical: 10 }).sectors.physical - 90;
    expect(low).toBeGreaterThan(high * 5);
  });

  it('a run aplica o efeito do agente pelos minutos, com colateral', () => {
    const d = runHealth(AGENTS.dopamine, ORGANISM.run.minutesForFullEffect);
    expect(d.mental).toBe(AGENTS.dopamine.health!.mental);
    expect(d.physical).toBeLessThan(0);
    const long = runHealth(AGENTS.dopamine, 1000);
    expect(long.mental).toBe(AGENTS.dopamine.health!.mental! * ORGANISM.run.maxEffectScale);
  });
});

describe('alta', () => {
  it('só abre com todos os setores saudáveis', () => {
    expect(canDischarge(defaultOrganism())).toBe(false);
    expect(canDischarge(healthy(ORGANISM.healthyThreshold))).toBe(true);
  });

  it('o próximo indivíduo é mais difícil e herda pontos', () => {
    const next = discharge({ ...healthy(80), atpEarned: 9000 });
    expect(next.individual).toBe(2);
    expect(next.inherited).toBe(inheritedPoints(9000));
    const rules = rulesWithOrganism(DEFAULT_RULES, next);
    expect(rules.enemies.glucose.hp).toBeCloseTo(
      DEFAULT_RULES.enemies.glucose.hp * ECONOMY.reset.individualDifficultyFactor,
    );
  });

  it('zera Laboratório, idle e ATP, e mantém os desbloqueios', () => {
    const base = defaultSave({ showFps: false, showDamageNumbers: true });
    const save = {
      ...base,
      atp: 500,
      organism: { ...healthy(80), atpEarned: 4000 },
      meta: { ...base.meta, lab: { interactions: 3 }, weapons: [...base.meta.weapons, 'uvRay'] },
      idle: {
        ...base.idle,
        wave: 20,
        agents: ['omega3', 'melatonin'],
        levels: { omega3: 9, melatonin: 4 },
      },
    };
    const next = dischargeSave(save, 1)!;
    expect(next.atp).toBe(0);
    expect(next.meta.lab).toEqual({});
    expect(next.meta.weapons).toContain('uvRay');
    expect(next.idle.wave).toBe(1);
    expect(next.idle.agents).toEqual(['omega3', 'melatonin']);
    expect(next.idle.levels).toEqual({ omega3: 1, melatonin: 1 });
    expect(dischargeSave(base, 1)).toBeNull();
  });
});
