import { describe, expect, it } from 'vitest';
import { heal, hitEnemy } from './combat';
import { addEnemy, createRun, drainEvents, newWeapon } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';

describe('números da run para a pausa', () => {
  it('soma o dano de cada arma, sem passar da vida que a molécula tinha', () => {
    const run = createRun(1, rulesWithoutSpawn());
    const e = addEnemy(run, 'glucose', 50, 0);
    e.hp = 10;
    hitEnemy(run, e, 4, { source: 'radical', continuous: true });
    hitEnemy(run, e, 100, { source: 'radical', continuous: true });
    expect(run.tally.damageByWeapon.radical).toBeCloseTo(10);
  });

  it('o evento de dano traz a afinidade e se o golpe é contínuo', () => {
    const run = createRun(1, rulesWithoutSpawn(), 'lipase');
    const e = addEnemy(run, 'glucose', 50, 0);
    hitEnemy(run, e, 1, { continuous: true });
    const ev = drainEvents(run).find((x) => x.type === 'damage');
    expect(ev).toMatchObject({ continuous: true });
    expect(ev && ev.type === 'damage' && ev.affinity).toBeLessThan(1);
  });

  it('conta as interações perdidas e avisa a recuperação', () => {
    const run = createRun(1, rulesWithoutSpawn());
    run.weapons = [newWeapon('radical')];
    run.weapons[0]!.cooldown = 1e9;
    const e = addEnemy(run, 'glucose', 0, 0);
    e.speed = 0;
    stepRun(run, STILL, DT);
    expect(run.tally.interactionsLost).toBeGreaterThan(0);
    drainEvents(run);
    heal(run, 3);
    expect(drainEvents(run)).toContainEqual({ type: 'heal', amount: 3 });
  });
});
