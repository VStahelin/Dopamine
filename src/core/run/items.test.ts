import { describe, expect, it } from 'vitest';
import { closeCapsule, openCapsule, rollItem } from './items';
import { addEnemy, createRun, newWeapon, type RunState } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';
import { coinValue } from './upgrades';
import { weaponMaxLevel } from './weaponParams';

function run(capsulesOpened = 0): RunState {
  return createRun(1, { ...rulesWithoutSpawn(), capsulesOpened });
}

function steps(r: RunState, n: number) {
  for (let i = 0; i < n; i++) stepRun(r, STILL, DT);
}

describe('vesículas', () => {
  it('nascem num anel fora da tela a cada intervalo', () => {
    const r = run();
    steps(r, Math.ceil(r.rules.drops.vesicles.everySeconds / DT) + 1);
    expect(r.vesicles).toHaveLength(1);
    const v = r.vesicles[0]!;
    expect(Math.hypot(v.x, v.y)).toBeGreaterThan(STILL.viewRadius);
  });

  it('um disparo rompe a vesícula e solta um item', () => {
    const r = run();
    r.vesicles.push({ x: 40, y: 0 });
    // O Radical Livre só dispara com alvo: uma molécula parada logo atrás da vesícula.
    addEnemy(r, 'triglyceride', 60, 0).speed = 0;
    steps(r, 60);
    expect(r.vesicles).toHaveLength(0);
    expect(r.pickups.length + r.seenItems.length).toBeGreaterThan(0);
  });

  it('itens com nível mínimo não saem no começo da run', () => {
    const r = run();
    const items = new Set(Array.from({ length: 2000 }, () => rollItem(r)));
    for (const id of ['dryIce', 'osmosis', 'glycogen', 'lysosome', 'glucagon']) {
      expect(items.has(id as never)).toBe(false);
    }
    expect(items.has('atp')).toBe(true);
  });
});

describe('itens', () => {
  it('Glicose dá 5 moedas de ATP com o valor atual', () => {
    const r = run();
    const value = coinValue(r);
    r.pickups.push({ x: 0, y: 0, kind: 'glucose', attracted: false });
    steps(r, 1);
    expect(r.atp).toBeCloseTo(5 * value * r.stats.currencyGain, 1);
    expect(r.seenItems).toContain('glucose');
  });

  it('Gelo seco para as moléculas e elas não gastam interações', () => {
    const r = run();
    r.pickups.push({ x: 0, y: 0, kind: 'dryIce', attracted: false });
    const e = addEnemy(r, 'glucose', 30, 0);
    steps(r, 1);
    const x = e.x;
    steps(r, 60);
    // Não anda até o agente (o empurrão dos golpes ainda afasta).
    expect(e.x).toBeGreaterThanOrEqual(x - 0.01);
    e.x = 0;
    steps(r, 10);
    expect(r.agent.interactions).toBe(r.stats.maxInteractions);
  });

  it('Lisossomo decompõe as moléculas na tela, menos o chefe', () => {
    const r = run();
    const common = addEnemy(r, 'glucose', 100, 0);
    const boss = addEnemy(r, 'ldl', -100, 0);
    r.pickups.push({ x: 0, y: 0, kind: 'lysosome', attracted: false });
    steps(r, 1);
    expect(common.hp).toBeLessThanOrEqual(0);
    expect(boss.hp).toBeGreaterThan(0);
  });

  it('Vitamina soma Sorte até o fim da run', () => {
    const r = run();
    const before = r.stats.luck;
    r.pickups.push({ x: 0, y: 0, kind: 'vitamin', attracted: false });
    steps(r, 1);
    expect(r.stats.luck).toBeCloseTo(before + 0.1);
  });
});

describe('cápsula do chefe', () => {
  it('o chefe solta a cápsula, que para a run até o jogador ver', () => {
    const r = run();
    const boss = addEnemy(r, 'ldl', 30, 0);
    boss.hp = 0.01;
    boss.speed = 0;
    steps(r, 30);
    expect(r.pickups.some((p) => p.kind === 'capsule')).toBe(true);
    // O XP do chefe deixa um level up esperando; aqui só importa a cápsula.
    r.pendingLevelUps = 0;
    r.pickups = r.pickups.map((p) => ({ ...p, x: 0, y: 0 }));
    steps(r, 1);
    expect(r.capsule).not.toBeNull();
    const time = r.time;
    steps(r, 10);
    expect(r.time).toBe(time);
    closeCapsule(r);
    steps(r, 1);
    expect(r.time).toBeGreaterThan(time);
  });

  it('a sorte de principiante segue 1, 1, 3', () => {
    const counts = [0, 1, 2].map((opened) => {
      const r = run(opened);
      openCapsule(r, false);
      return r.capsule!.items.length;
    });
    expect(counts).toEqual([1, 1, 3]);
  });

  it('sobe o nível de uma arma que o agente tem', () => {
    const r = run();
    openCapsule(r, false);
    expect(r.capsule!.items[0]).toMatchObject({ kind: 'weapon', id: 'radical', level: 2 });
    expect(r.weapons[0]!.level).toBe(2);
    expect(r.atp).toBeGreaterThan(0);
  });

  it('a de prata evolui uma arma pronta', () => {
    const r = run();
    const w = r.weapons[0]!;
    w.level = weaponMaxLevel(r.rules.weapons[w.id]);
    r.passives.peroxide = { level: 1, bonus: 0 };
    openCapsule(r, true);
    expect(r.capsule!.items[0]).toMatchObject({ kind: 'evolve', into: 'fenton' });
    expect(r.weapons[0]!.id).toBe('fenton');
  });

  it('sem nada para subir, vira Fosfocreatina', () => {
    const r = run();
    r.weapons = [newWeapon('radical')];
    r.weapons[0]!.level = weaponMaxLevel(r.rules.weapons.radical);
    openCapsule(r, false);
    expect(r.capsule!.items[0]!.kind).toBe('phosphocreatine');
  });
});
