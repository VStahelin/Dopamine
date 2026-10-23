import { describe, expect, it } from 'vitest';
import { damageEnemy } from './combat';
import { DEFAULT_RULES, type RunRules } from './rules';
import { createRun, type RunState } from './state';
import { stepRun } from './step';
import { DT, STILL } from './testRules';

/** Regras sem moléculas comuns: só chefes e agregados nascem. */
function rules(ampouleChance?: number): RunRules {
  const ag = DEFAULT_RULES.run.aggregates;
  return {
    ...DEFAULT_RULES,
    run: {
      ...DEFAULT_RULES.run,
      spawn: { ...DEFAULT_RULES.run.spawn, baseEnemiesPerSecond: 0 },
      aggregates: { ...ag, ampouleChance: ampouleChance ?? ag.ampouleChance },
    },
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
  it('nascem em momentos sorteados, pelo menos um por minuto', () => {
    for (const seed of [1, 2, 3]) {
      const r = createRun(seed, rules());
      const times: number[] = [];
      let count = 0;
      while (r.time < 10 * 60) {
        advance(r, r.time + 0.5);
        const now = r.enemies.filter((e) => e.aggregate).length;
        if (now > count) times.push(r.time);
        count = now;
      }
      const gaps = times.map((t, i) => t - (times[i - 1] ?? 0));
      expect(Math.max(...gaps)).toBeLessThanOrEqual(r.rules.run.aggregates.maxGapSeconds + 1);
      expect(Math.min(...gaps)).toBeGreaterThanOrEqual(r.rules.run.aggregates.minGapSeconds - 1);
      expect(times.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('são a molécula forte, maior, mais lenta e muito mais forte', () => {
    const r = createRun(1, rules());
    advance(r, 61);
    const e = r.enemies.find((x) => x.aggregate)!;
    const def = r.rules.enemies[e.kind];
    expect(def.contactDamage).toBe('strong');
    const ag = r.rules.run.aggregates;
    expect(e.radius).toBeCloseTo(def.radiusPx * ag.sizeMultiplier);
    expect(e.speed).toBeLessThan(def.speedPxPerSecond);
    expect(e.maxHp).toBeGreaterThan(def.hp * ag.hpMultiplier);
    expect(r.seenAggregates).toContain(e.kind);
  });

  it('soltam ampola de raridade mínima Rara (com chance) e uma gema vermelha', () => {
    const r = createRun(1, rules(1));
    advance(r, 61);
    const e = r.enemies.find((x) => x.aggregate)!;
    damageEnemy(r, e, e.hp + 1);
    const amp = r.pickups.find((p) => p.kind === 'ampoule');
    expect(amp?.minRarity).toBe(r.rules.run.aggregates.minRarity);
    expect(r.gems.some((g) => g.value > r.rules.drops.gems.mediumMaxXp)).toBe(true);
  });
});
