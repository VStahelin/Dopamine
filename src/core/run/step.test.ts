import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from './rules';
import { addEnemy, createRun } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';
import { applyChoice, levelUpOffer } from './upgrades';

function steps(n: number, fn: () => void) {
  for (let i = 0; i < n; i++) fn();
}

describe('stepRun', () => {
  it('move o agente sem correr mais na diagonal', () => {
    const run = createRun(1, rulesWithoutSpawn());
    steps(60, () => stepRun(run, { ...STILL, move: { x: 1, y: 1 } }, DT));
    expect(Math.hypot(run.agent.x, run.agent.y)).toBeCloseTo(
      DEFAULT_RULES.run.agent.moveSpeedPxPerSecond,
    );
  });

  it('inimigos perseguem o agente', () => {
    const run = createRun(1, rulesWithoutSpawn());
    const e = addEnemy(run, 'fattyAcid', 400, 0);
    steps(30, () => stepRun(run, STILL, DT));
    expect(e.x).toBeLessThan(400);
  });

  it('contato gasta interações, com invulnerabilidade logo depois', () => {
    // Triglicerídeo: aguenta o primeiro disparo e encosta no agente.
    const run = createRun(1, rulesWithoutSpawn());
    const e = addEnemy(run, 'triglyceride', 0, 0);
    stepRun(run, STILL, DT);
    expect(run.agent.interactions).toBe(100 - e.contactDamage);
    stepRun(run, STILL, DT);
    expect(run.agent.interactions).toBe(100 - e.contactDamage);
  });

  it('a run acaba quando as interações chegam a zero', () => {
    const run = createRun(1, rulesWithoutSpawn());
    run.agent.interactions = 3;
    addEnemy(run, 'triglyceride', 0, 0);
    stepRun(run, STILL, DT);
    expect(run.agent.interactions).toBe(0);
    expect(run.over).toBe(true);

    const time = run.time;
    stepRun(run, STILL, DT);
    expect(run.time).toBe(time);
  });

  it('a arma decompõe o inimigo e a gema dá XP até o level up', () => {
    const run = createRun(1, rulesWithoutSpawn());
    // Perto o bastante para a gema cair dentro do raio de coleta.
    const e = addEnemy(run, 'glucose', 25, 0);
    e.speed = 0;
    e.xp = 10;
    steps(120, () => stepRun(run, STILL, DT));

    expect(run.kills).toBe(1);
    expect(run.enemies).toHaveLength(0);
    expect(run.level).toBe(2);
    expect(run.pendingLevelUps).toBe(1);
  });

  it('a simulação para no level up e volta depois da escolha', () => {
    const run = createRun(1, rulesWithoutSpawn());
    run.xp = run.xpToNext;
    stepRun(run, STILL, DT);
    expect(run.pendingLevelUps).toBe(1);

    const time = run.time;
    stepRun(run, STILL, DT);
    expect(run.time).toBe(time);

    const offer = levelUpOffer(run);
    expect(offer).toHaveLength(DEFAULT_RULES.stats.levelUp.choices!.base);
    expect(levelUpOffer(run)).toBe(offer);

    applyChoice(run, offer[0]!);
    expect(run.pendingLevelUps).toBe(0);
    stepRun(run, STILL, DT);
    expect(run.time).toBeGreaterThan(time);
  });

  it('inimigos nascem fora da tela', () => {
    const run = createRun(7);
    steps(600, () => stepRun(run, STILL, DT));
    expect(run.enemies.length).toBeGreaterThan(0);
    expect(run.kills + run.enemies.length).toBeGreaterThan(5);
  });

  it('a mesma semente e a mesma entrada repetem a run', () => {
    const play = () => {
      const run = createRun(42);
      steps(60 * 30, () => {
        stepRun(
          run,
          { move: { x: Math.sin(run.time), y: Math.cos(run.time) }, viewRadius: 300 },
          DT,
        );
        if (run.pendingLevelUps > 0) applyChoice(run, levelUpOffer(run)[0]!);
      });
      return { x: run.agent.x, kills: run.kills, level: run.level, hp: run.agent.interactions };
    };
    expect(play()).toEqual(play());
  });
});
