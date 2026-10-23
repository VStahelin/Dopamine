import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, withStatBonuses } from './rules';
import { addBonus, createRun } from './state';
import { refreshStats, statSources } from './upgrades';

describe('de onde vem cada atributo', () => {
  it('separa Laboratório, organismo, receptor, suplemento e cartão', () => {
    const rules = withStatBonuses(
      withStatBonuses(DEFAULT_RULES, { damage: 0.1 }, 'lab'),
      { damage: 0.05, moveSpeed: 0.2 },
      'organism',
    );
    const run = createRun(1, rules);
    run.passives.reactivity = { level: 2, bonus: 0.2 };
    addBonus(run, 'supplement', 'damage', 0.03);
    addBonus(run, 'card', 'damage', 0.04);
    refreshStats(run);
    expect(statSources(run, 'damage')).toEqual([
      { source: 'lab', amount: 0.1 },
      { source: 'organism', amount: 0.05 },
      { source: 'receptor', amount: 0.2 },
      { source: 'supplement', amount: 0.03 },
      { source: 'card', amount: 0.04 },
    ]);
    expect(run.bonus.damage).toBeCloseTo(0.07);
    expect(statSources(run, 'luck')).toEqual([]);
  });

  it('mostra o receptor nativo quando ele já subiu', () => {
    const run = createRun(1, DEFAULT_RULES, 'insulin');
    run.level = 20;
    expect(statSources(run, 'magnet')).toEqual([{ source: 'native', amount: 0.5 }]);
  });
});
