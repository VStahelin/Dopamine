import { describe, expect, it } from 'vitest';
import { damageEnemy } from './combat';
import { DEFAULT_RULES, type RunRules } from './rules';
import { createRun, type RunState } from './state';
import { stepRun } from './step';
import { DT, STILL } from './testRules';

/** Regras sem moléculas comuns: só chefes e agregados nascem. */
function rules(): RunRules {
  return {
    ...DEFAULT_RULES,
    run: { ...DEFAULT_RULES.run, spawn: { ...DEFAULT_RULES.run.spawn, baseEnemiesPerSecond: 0 } },
  };
}

/** Avança a run até `seconds` sem deixar o agente atacar nem morrer. */
function advance(r: RunState, seconds: number) {
  while (r.time < seconds) {
    r.pendingLevelUps = 0;
    r.agent.interactions = r.stats.maxInteractions;
    r.weapons = [];
    stepRun(r, STILL, DT);
  }
}

describe('agregados (fase 5.10)', () => {
  it('nascem a cada 2 minutos, menos nos minutos de chefe', () => {
    const r = createRun(1, rules());
    advance(r, 10.5 * 60);
    const aggregates = r.enemies.filter((e) => e.aggregate);
    // Minutos 2, 4, 6 e 8 (o 10 é de chefe).
    expect(aggregates).toHaveLength(4);
    expect(r.enemies.filter((e) => e.boss)).toHaveLength(2);
  });

  it('são a molécula forte, maior, mais lenta e muito mais forte', () => {
    const r = createRun(1, rules());
    advance(r, 2 * 60 + 1);
    const e = r.enemies.find((x) => x.aggregate)!;
    const def = r.rules.enemies[e.kind];
    expect(def.contactDamage).toBe('strong');
    const ag = r.rules.run.aggregates;
    expect(e.radius).toBeCloseTo(def.radiusPx * ag.sizeMultiplier);
    expect(e.speed).toBeLessThan(def.speedPxPerSecond);
    expect(e.maxHp).toBeGreaterThan(def.hp * ag.hpMultiplier);
    expect(r.seenAggregates).toContain(e.kind);
  });

  it('sempre soltam uma ampola de raridade mínima Rara e uma gema vermelha', () => {
    const r = createRun(1, rules());
    advance(r, 2 * 60 + 1);
    const e = r.enemies.find((x) => x.aggregate)!;
    damageEnemy(r, e, e.hp + 1);
    const amp = r.pickups.find((p) => p.kind === 'ampoule');
    expect(amp?.minRarity).toBe(r.rules.run.aggregates.minRarity);
    expect(r.gems.some((g) => g.value > r.rules.drops.gems.mediumMaxXp)).toBe(true);
  });
});
