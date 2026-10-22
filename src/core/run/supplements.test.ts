import { describe, expect, it } from 'vitest';
import { SUPPLEMENT_RARITIES } from '../../config';
import { addEnemy, createRun, type RunState } from './state';
import { stepRun } from './step';
import { applySupplement, closeAmpoule, copies, openAmpoule, rollSupplement } from './supplements';
import { DT, rulesWithoutSpawn, STILL } from './testRules';
import { readyEvolutions } from './upgrades';
import { weaponMaxLevel } from './weaponParams';

function run(seed = 1): RunState {
  return createRun(seed, rulesWithoutSpawn());
}

describe('suplementos (decisão 0028)', () => {
  it('acumulam: cada cópia soma de novo', () => {
    const r = run();
    const before = r.stats.damage;
    applySupplement(r, 'creatine');
    applySupplement(r, 'creatine');
    expect(copies(r, 'creatine')).toBe(2);
    expect(r.stats.damage).toBeCloseTo(before + 0.16);
    expect(r.seenSupplements).toContain('creatine');
  });

  it('a raridade mínima vale no sorteio', () => {
    const r = run();
    const min = SUPPLEMENT_RARITIES.indexOf('ultraRare');
    for (let i = 0; i < 200; i++) {
      const id = rollSupplement(r, 'ultraRare')!;
      const rarity = r.rules.supplements.items[id]!.rarity;
      expect(SUPPLEMENT_RARITIES.indexOf(rarity)).toBeGreaterThanOrEqual(min);
    }
  });

  it('o reagente liga a evolução e sai do sorteio depois', () => {
    const r = run();
    const w = r.weapons[0]!;
    w.level = weaponMaxLevel(r.rules.weapons[w.id]);
    applySupplement(r, 'peroxide');
    expect(readyEvolutions(r).some((c) => c.kind === 'evolve' && c.into === 'fenton')).toBe(true);
    for (let i = 0; i < 300; i++) expect(rollSupplement(r)).not.toBe('peroxide');
  });

  it('o reagente da arma no máximo sai mais vezes', () => {
    const count = (max: boolean) => {
      const r = run();
      if (max) r.weapons[0]!.level = weaponMaxLevel(r.rules.weapons[r.weapons[0]!.id]);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (rollSupplement(r, 'rare') === 'peroxide') n++;
      return n;
    };
    expect(count(true)).toBeGreaterThan(count(false) * 3);
  });

  it('Ginseng diminui a recarga do especial', () => {
    const r = run();
    applySupplement(r, 'ginseng');
    expect(r.specialBonus.cooldown).toBeCloseTo(-0.08);
  });

  it('Nitrogênio líquido congela a molécula atingida', () => {
    const r = run();
    r.supplements.liquidNitrogen = 20;
    const e = addEnemy(r, 'triglyceride', 40, 0);
    e.speed = 0;
    for (let i = 0; i < 60; i++) stepRun(r, STILL, DT);
    expect(e.frozen).toBeGreaterThan(0);
  });

  it('Termita: a molécula decomposta queima as vizinhas', () => {
    const r = run();
    r.supplements.thermite = 1;
    const a = addEnemy(r, 'glucose', 40, 0);
    const b = addEnemy(r, 'triglyceride', 50, 0);
    a.speed = 0;
    b.speed = 0;
    a.hp = 0.01;
    const hp = b.hp;
    for (let i = 0; i < 30 && a.hp > 0; i++) stepRun(r, STILL, DT);
    expect(b.hp).toBeLessThan(hp);
  });
});

describe('XP com chance e ampolas', () => {
  it('a gema que cai vale o XP dividido pela chance', () => {
    const r = run();
    const e = addEnemy(r, 'glucose', 40, 0);
    e.speed = 0;
    const xp = e.xp;
    for (let i = 0; i < 200 && r.gems.length === 0; i++) {
      const o = addEnemy(r, 'glucose', 40, 0);
      o.speed = 0;
      o.hp = 0.01;
      stepRun(r, STILL, DT);
      r.pendingLevelUps = 0;
    }
    const chance = r.rules.drops.gems.chance.common;
    expect(r.gems.some((g) => Math.abs(g.value - xp / chance) < 1e-6)).toBe(true);
  });

  it('o chefe sempre solta uma ampola de raridade alta', () => {
    const r = run();
    const boss = addEnemy(r, 'ldl', 40, 0);
    boss.speed = 0;
    boss.hp = 0.01;
    for (let i = 0; i < 30 && boss.hp > 0; i++) stepRun(r, STILL, DT);
    const amp = r.pickups.find((p) => p.kind === 'ampoule');
    expect(amp?.minRarity).toBe(r.rules.drops.ampoule.bossMinRarity);
  });

  it('abrir a ampola para a run até o jogador ver', () => {
    const r = run();
    openAmpoule(r, 'common');
    expect(r.ampoule).not.toBeNull();
    expect(Object.keys(r.supplements)).toHaveLength(1);
    const t = r.time;
    stepRun(r, STILL, DT);
    expect(r.time).toBe(t);
    closeAmpoule(r);
    stepRun(r, STILL, DT);
    expect(r.time).toBeGreaterThan(t);
  });
});
