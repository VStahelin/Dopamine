import { describe, expect, it } from 'vitest';
import { addEnemy, createRun, drainEvents } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';

function run() {
  return createRun(1, rulesWithoutSpawn());
}

function steps(n: number, fn: () => void) {
  for (let i = 0; i < n; i++) fn();
}

describe('atributos ofensivos', () => {
  it('Chance de catálise 100% faz todo golpe ser crítico', () => {
    const r = run();
    r.stats.critChance = 1;
    const e = addEnemy(r, 'triglyceride', 40, 0);
    e.speed = 0;
    steps(30, () => stepRun(r, STILL, DT));
    const hits = drainEvents(r).filter((ev) => ev.type === 'damage');
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h).toMatchObject({
        crit: true,
        amount: r.rules.weapons.radical.base.damage * r.stats.critDamage,
      });
    }
  });

  it('Especificidade aumenta o dano em inimigos fortes', () => {
    const r = run();
    r.stats.critChance = 0;
    r.stats.eliteDamage = 2;
    const e = addEnemy(r, 'triglyceride', 40, 0);
    e.speed = 0;
    steps(30, () => stepRun(r, STILL, DT));
    const hit = drainEvents(r).find((ev) => ev.type === 'damage');
    expect(hit).toMatchObject({ amount: r.rules.weapons.radical.base.damage * 2 });
  });

  it('Repulsão empurra o inimigo atingido', () => {
    const r = run();
    r.stats.critChance = 0;
    const e = addEnemy(r, 'triglyceride', 60, 0);
    e.speed = 0;
    steps(30, () => stepRun(r, STILL, DT));
    expect(e.x).toBeGreaterThan(60);
  });

  it('Reação em cadeia salta para outro inimigo', () => {
    const r = run();
    r.stats.ricochet = 1;
    const a = addEnemy(r, 'triglyceride', 40, 0);
    const b = addEnemy(r, 'triglyceride', 40, 50);
    a.speed = 0;
    b.speed = 0;
    steps(60, () => stepRun(r, STILL, DT));
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
  });
});

describe('atributos defensivos', () => {
  it('Esquiva 100% evita o dano', () => {
    const r = run();
    r.stats.dodge = 1;
    addEnemy(r, 'triglyceride', 0, 0);
    stepRun(r, STILL, DT);
    expect(r.agent.interactions).toBe(100);
    expect(drainEvents(r).some((ev) => ev.type === 'dodge')).toBe(true);
  });

  it('Membrana reduz o dano, mas nunca abaixo do mínimo', () => {
    const r = run();
    r.stats.armor = 100;
    addEnemy(r, 'triglyceride', 0, 0);
    stepRun(r, STILL, DT);
    expect(r.agent.interactions).toBe(100 - r.rules.run.minDamageTaken);
  });

  it('Reflexo devolve dano a quem encosta', () => {
    const r = run();
    r.stats.thorns = 1;
    r.weapons[0]!.cooldown = 99;
    const e = addEnemy(r, 'triglyceride', 0, 0);
    stepRun(r, STILL, DT);
    expect(e.hp).toBe(e.maxHp - e.contactDamage);
  });

  it('Homeostase recupera interações com o tempo', () => {
    const r = run();
    r.agent.interactions = 50;
    r.stats.regenPerSecond = 2;
    steps(60, () => stepRun(r, STILL, DT));
    expect(r.agent.interactions).toBeCloseTo(52);
  });

  it('Segunda dose volta com metade das interações', () => {
    const r = run();
    r.stats.revives = 1;
    r.agent.interactions = 1;
    addEnemy(r, 'triglyceride', 0, 0);
    stepRun(r, STILL, DT);
    expect(r.over).toBe(false);
    expect(r.agent.interactions).toBe(r.stats.maxInteractions / 2);
    expect(r.used.revives).toBe(1);
  });
});

describe('Estresse', () => {
  it('deixa os inimigos mais fortes e mais valiosos', () => {
    const r = run();
    r.stats.curse = 1;
    const e = addEnemy(r, 'glucose', 100, 0);
    const def = r.rules.enemies.glucose;
    expect(e.maxHp).toBe(def.hp * (1 + r.rules.run.curse.hp));
    expect(e.xp).toBe(def.xp * (1 + r.rules.run.curse.xp));
  });
});
