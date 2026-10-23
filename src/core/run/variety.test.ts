import { describe, expect, it } from 'vitest';
import { hitEnemy } from './combat';
import { spawnFormation } from './formations';
import { DEFAULT_RULES, type RunRules } from './rules';
import { addEnemy, createRun, drainEvents, type RunState } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';
import { levelUpOffer, nativeLevel, refreshStats } from './upgrades';
import { weaponMaxLevel } from './weaponParams';

/** Sem moléculas comuns, chefes nem agregados: só as formações. */
function rules(familyWeights?: RunRules['familyWeights']): RunRules {
  const base = rulesWithoutSpawn();
  return {
    ...base,
    familyWeights,
    run: {
      ...base.run,
      aggregates: { ...base.run.aggregates, minGapSeconds: 1e9, maxGapSeconds: 1e9 },
    },
  };
}

function advance(r: RunState, seconds: number) {
  while (r.time < seconds) {
    r.pendingLevelUps = 0;
    r.agent.interactions = r.stats.maxInteractions;
    r.weapons = [];
    stepRun(r, STILL, DT);
  }
}

describe('formações e crises (fase 5.6)', () => {
  it('a primeira formação vem com aviso e nasce fora da tela', () => {
    const r = createRun(1, rules());
    const f = r.rules.run.formations;
    advance(r, f.firstAtSeconds + 0.1);
    const warning = drainEvents(r).find((e) => e.type === 'formationWarning');
    expect(warning).toBeDefined();
    expect(r.enemies).toHaveLength(0);
    advance(r, f.firstAtSeconds + f.warningSeconds + 0.1);
    expect(r.enemies.length).toBeGreaterThan(5);
    for (const e of r.enemies) expect(Math.hypot(e.x, e.y)).toBeGreaterThan(STILL.viewRadius * 0.9);
  });

  it('a doença escolhe a formação: Física baixa traz açúcares e lipídios', () => {
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 40; seed++) {
      const r = createRun(
        seed,
        rules({ sugar: 2.5, lipid: 2.5, stress: 0.2, radical: 0.2, toxin: 0.2 }),
      );
      advance(r, r.rules.run.formations.firstAtSeconds + 0.1);
      const id = r.formations.pending[0]?.id ?? '';
      counts[id] = (counts[id] ?? 0) + 1;
    }
    const physical = (counts.glycemicSpike ?? 0) + (counts.lipidWall ?? 0);
    expect(physical).toBeGreaterThan(25);
  });

  it('o pico do dente de serra traz a crise: a formação da doença em dobro', () => {
    const r = createRun(
      1,
      rules({ sugar: 2.5, lipid: 0.2, stress: 0.2, radical: 0.2, toxin: 0.2 }),
    );
    const cycle = r.rules.economy.difficulty.peakEveryMinutes * 60;
    advance(r, cycle + 0.1);
    const warning = drainEvents(r).find((e) => e.type === 'formationWarning' && e.crisis);
    expect(warning).toMatchObject({ name: 'Crise glicêmica' });
    expect(r.formations.pending.filter((p) => p.crisis && p.id === 'glycemicSpike')).toHaveLength(
      2,
    );
    expect(r.formations.crisis?.family).toBe('sugar');
  });

  it('o enxame atravessa em linha reta e some longe', () => {
    const r = createRun(1, rules());
    spawnFormation(r, 'glycemicSpike', 0, 300, 1);
    const e = r.enemies[0]!;
    expect(e.straight).toBe(true);
    const x = e.x;
    advance(r, 1);
    expect(e.x).toBeLessThan(x);
    e.x = -5000;
    advance(r, 1.1);
    expect(r.enemies.includes(e)).toBe(false);
  });
});

describe('receptor nativo e Superdosagem', () => {
  it('o receptor nativo sobe 1 nível a cada 10 níveis, até 5', () => {
    const r = createRun(1, DEFAULT_RULES, 'dopamine');
    const base = r.stats.cooldown;
    r.level = 20;
    refreshStats(r);
    expect(nativeLevel(r)).toBe(2);
    expect(r.stats.cooldown).toBeCloseTo(base - 0.16);
    r.level = 90;
    expect(nativeLevel(r)).toBe(5);
  });

  it('o Sítio ativo da Lipase aumenta o dano contra lipídios', () => {
    const damage = (level: number) => {
      const r = createRun(1, rulesWithoutSpawn(), 'lipase');
      r.level = level;
      r.stats.critChance = 0;
      const e = addEnemy(r, 'triglyceride', 0, 0);
      const hp = e.hp;
      hitEnemy(r, e, 10);
      return hp - e.hp;
    };
    // Nível 30 = receptor nativo no nível 3: +30% contra lipídios.
    expect(damage(30)).toBeCloseTo(damage(1) * 1.3);
  });

  it('com tudo no máximo, o level up oferece a Superdosagem', () => {
    const r = createRun(1, rulesWithoutSpawn());
    r.stats.weaponSlots = 1;
    r.stats.modifierSlots = 0;
    r.weapons[0]!.level = weaponMaxLevel(r.rules.weapons[r.weapons[0]!.id]);
    r.pendingLevelUps = 1;
    const offer = levelUpOffer(r);
    expect(offer.filter((c) => c.kind === 'boost').length).toBeGreaterThan(0);
    expect(offer.some((c) => c.kind === 'heal')).toBe(true);
    expect(r.overdose).toBe(true);
  });
});
