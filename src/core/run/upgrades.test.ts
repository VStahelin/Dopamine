import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from './rules';
import { createRun, newWeapon } from './state';
import { rulesWithoutSpawn } from './testRules';
import {
  applyChoice,
  applyUpgrade,
  banishChoice,
  choiceKey,
  levelUpOffer,
  passiveAmount,
  remaining,
  rerollOffer,
  rollRarity,
  skipLevelUp,
  statsAfter,
} from './upgrades';

function runWithLevelUps(n: number, seed = 1) {
  const run = createRun(seed, rulesWithoutSpawn());
  run.pendingLevelUps = n;
  return run;
}

describe('passiveAmount', () => {
  it('multiplica pela raridade', () => {
    expect(passiveAmount(DEFAULT_RULES.passives.reactivity, 2)).toBeCloseTo(0.2);
    expect(passiveAmount(DEFAULT_RULES.passives.metabolism, 2)).toBeCloseTo(-0.16);
  });

  it('arredonda atributos inteiros sem ficar abaixo do comum', () => {
    expect(passiveAmount(DEFAULT_RULES.passives.dose, 1)).toBe(1);
    expect(passiveAmount(DEFAULT_RULES.passives.dose, 1.5)).toBe(2);
    expect(passiveAmount(DEFAULT_RULES.passives.dose, 4)).toBe(4);
  });
});

describe('rollRarity', () => {
  const average = (luck: number) => {
    const run = createRun(3, rulesWithoutSpawn());
    run.stats.luck = luck;
    let sum = 0;
    for (let i = 0; i < 4000; i++) sum += rollRarity(run);
    return sum / 4000;
  };

  it('mais sorte dá raridades mais altas', () => {
    expect(average(3)).toBeGreaterThan(average(1) + 0.3);
  });

  it('com sorte base, comum é a mais frequente', () => {
    const run = createRun(5, rulesWithoutSpawn());
    const counts = new Array(DEFAULT_RULES.rarities.tiers.length).fill(0);
    for (let i = 0; i < 4000; i++) counts[rollRarity(run)]++;
    expect(counts[0]).toBe(Math.max(...counts));
  });
});

describe('levelUpOffer', () => {
  it('mostra tantas opções quanto o atributo Opções', () => {
    const run = runWithLevelUps(2);
    expect(levelUpOffer(run)).toHaveLength(3);
    run.stats.choices = 5;
    run.offer = null;
    expect(levelUpOffer(run)).toHaveLength(5);
  });

  it('com os espaços de modificador cheios, só melhora o que já tem', () => {
    const run = runWithLevelUps(1);
    for (const id of ['reactivity', 'mobility', 'magnet', 'learning'] as const) {
      run.passives[id] = { level: 1, bonus: 0 };
    }
    for (let i = 0; i < 30; i++) {
      run.offer = null;
      for (const c of levelUpOffer(run)) {
        if (c.kind !== 'passive') continue;
        const held = ['reactivity', 'mobility', 'magnet', 'learning'].includes(c.id);
        expect(held || DEFAULT_RULES.passives[c.id].freeSlot).toBeTruthy();
      }
    }
  });

  it('aplica o valor da raridade ao escolher', () => {
    const run = runWithLevelUps(1);
    applyChoice(run, { kind: 'passive', id: 'reactivity', level: 1, rarity: 4, amount: 0.3 });
    expect(run.stats.damage).toBeCloseTo(1.3);
    expect(run.passives.reactivity).toEqual({ level: 1, bonus: 0.3 });
  });
});

describe('Rerrolar, Pular e Banir', () => {
  it('não fazem nada sem usos', () => {
    const run = runWithLevelUps(1);
    expect(rerollOffer(run)).toBe(false);
    expect(skipLevelUp(run)).toBe(false);
  });

  it('rerrolar gasta um uso e sorteia de novo', () => {
    const run = runWithLevelUps(1);
    run.stats.rerolls = 1;
    levelUpOffer(run);
    expect(rerollOffer(run)).toBe(true);
    expect(run.offer).toBeNull();
    expect(remaining(run, 'rerolls')).toBe(0);
  });

  it('pular consome o level up', () => {
    const run = runWithLevelUps(1);
    run.stats.skips = 1;
    expect(skipLevelUp(run)).toBe(true);
    expect(run.pendingLevelUps).toBe(0);
  });

  it('opção banida não volta mais', () => {
    const run = runWithLevelUps(1);
    run.stats.banishes = 1;
    const target = levelUpOffer(run)[0]!;
    expect(banishChoice(run, target)).toBe(true);
    for (let i = 0; i < 30; i++) {
      run.offer = null;
      expect(levelUpOffer(run).map(choiceKey)).not.toContain(choiceKey(target));
    }
  });
});

describe('statsAfter', () => {
  it('mostra o atributo depois do receptor, sem mexer na run', () => {
    const run = runWithLevelUps(1);
    const before = run.stats.damage;
    const after = statsAfter(run, {
      kind: 'passive',
      id: 'reactivity',
      level: 1,
      rarity: 0,
      amount: 0.2,
    });
    expect(after?.damage).toBeCloseTo(before + 0.2);
    expect(run.stats.damage).toBe(before);
    expect(run.passives.reactivity).toBeUndefined();
  });

  it('não prevê arma nem cura', () => {
    const run = runWithLevelUps(1);
    expect(statsAfter(run, { kind: 'heal', amount: 30 })).toBeNull();
  });
});

describe('playtest rodada 2', () => {
  it('BUG-2: carta velha do mesmo nível não rebaixa a arma', () => {
    const run = createRun(1, rulesWithoutSpawn());
    run.weapons = [newWeapon('dopaminePulse'), newWeapon('radical')];
    const w = run.weapons[1]!;
    const legendary = run.rules.rarities.tiers.length - 2;
    applyUpgrade(run, { kind: 'weapon', id: 'radical', level: 2, rarity: legendary });
    const boosted = w.boosts[0];
    // A mesma carta (nível 2, comum) sorteada antes: vira o nível 3, sem mexer no ganho do 2.
    applyUpgrade(run, { kind: 'weapon', id: 'radical', level: 2, rarity: 0 });
    expect(w.level).toBe(3);
    expect(w.boosts[0]).toBe(boosted);
  });

  it('MEC-1: a Dose só aparece com arma que dispara vários objetos', () => {
    const run = runWithLevelUps(200);
    run.weapons = [newWeapon('dopaminePulse')];
    for (let i = 0; i < 200; i++) {
      run.offer = null;
      expect(levelUpOffer(run).some((c) => c.kind === 'passive' && c.id === 'dose')).toBe(false);
    }
    run.weapons.push(newWeapon('radical'));
    let seen = false;
    for (let i = 0; i < 200 && !seen; i++) {
      run.offer = null;
      seen = levelUpOffer(run).some((c) => c.kind === 'passive' && c.id === 'dose');
    }
    expect(seen).toBe(true);
  });
});
