import { describe, expect, it } from 'vitest';
import { createRun } from './state';
import { rulesWithoutSpawn } from './testRules';
import { applyUpgrade, levelUpOffer } from './upgrades';
import { levelParams, levelStep } from './weaponParams';

function run(seed = 1, unlockedReceptors?: string[]) {
  const r = createRun(seed, {
    ...rulesWithoutSpawn(),
    unlockedReceptors: unlockedReceptors as never,
  });
  r.pendingLevelUps = 1;
  return r;
}

describe('level up com receptores (decisão 0027)', () => {
  it('só oferece armas, receptores e reagentes', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = run(seed);
      for (const c of levelUpOffer(r)) {
        if (c.kind !== 'passive') continue;
        expect(r.rules.passives[c.id].kind).not.toBe('off');
      }
    }
  });

  it('receptor bloqueado não aparece', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = run(seed, ['reactivity']);
      for (const c of levelUpOffer(r)) {
        if (c.kind !== 'passive' || r.rules.passives[c.id].kind !== 'receptor') continue;
        expect(c.id).toBe('reactivity');
      }
    }
  });

  it('o nível de arma sorteia raridade, e a arma nova não', () => {
    let leveled = 0;
    for (let seed = 1; seed <= 200; seed++) {
      for (const c of levelUpOffer(run(seed))) {
        if (c.kind !== 'weapon') continue;
        if (c.level === 1) expect(c.rarity).toBeUndefined();
        else {
          expect(c.rarity).toBeTypeOf('number');
          leveled++;
        }
      }
    }
    expect(leveled).toBeGreaterThan(0);
  });

  it('a raridade multiplica o ganho do nível, com inteiros arredondados', () => {
    const r = run();
    const def = r.rules.weapons.radical;
    const common = levelParams(def, 2);
    applyUpgrade(r, { kind: 'weapon', id: 'radical', level: 2, rarity: 2 });
    const mult = r.rules.rarities.tiers[2]!.multiplier;
    expect(r.weapons[0]!.boosts[0]).toBe(mult);
    const rare = levelParams(def, 2, r.weapons[0]!.boosts);
    const step = def.levels[0]!;
    if (step.damage) {
      expect(rare.damage - def.base.damage).toBeCloseTo((common.damage - def.base.damage) * mult);
    }
    // Inteiros: +1 projétil com ×1,5 vira +2, e nunca fica abaixo de +1.
    const withCount = { ...def, levels: [{ count: 1 }] };
    expect(levelStep(withCount, 0, 1.5).count).toBe(2);
    expect(levelStep(withCount, 0, 1.2).count).toBe(1);
  });

  it('Cinética soma velocidade do projétil e alcance', () => {
    const r = run();
    const before = { ...r.stats };
    applyUpgrade(r, { kind: 'passive', id: 'kinetics', level: 1, rarity: 0, amount: 0.15 });
    expect(r.stats.projectileSpeed).toBeCloseTo(before.projectileSpeed + 0.15);
    expect(r.stats.range).toBeCloseTo(before.range + 0.15);
  });

  it('Mutação soma um atributo sorteado a cada nível', () => {
    const r = run();
    applyUpgrade(r, { kind: 'passive', id: 'mutation', level: 1, rarity: 0, amount: 0 });
    expect(r.passives.mutation?.level).toBe(1);
    expect(Object.keys(r.bonus).length).toBeGreaterThan(0);
  });
});
