import { describe, expect, it } from 'vitest';
import { TUTORIAL } from '../../config';
import { addEnemy, createRun } from './state';
import { stepRun } from './step';
import { DT, STILL, rulesWithoutSpawn } from './testRules';
import {
  createTutorial,
  skipTutorial,
  tutorialCard,
  tutorialDone,
  updateTutorial,
} from './tutorial';

describe('primeira run guiada (fase 6)', () => {
  it('cada passo some quando o jogador faz o que ele pede', () => {
    const r = createRun(1, rulesWithoutSpawn(), 'dopamine');
    const t = createTutorial(r);
    const id = () => TUTORIAL.steps[t.index]?.id;
    expect(id()).toBe('move');
    r.agent.x += TUTORIAL.steps[0]!.movePx!;
    updateTutorial(t, r);
    expect(id()).toBe('act');
    r.kills += TUTORIAL.steps[1]!.kills!;
    updateTutorial(t, r);
    expect(id()).toBe('gems');
    r.level = 2;
    updateTutorial(t, r);
    expect(id()).toBe('special');
    // Sem carga, o cartão do especial fica escondido.
    r.special.charges = 0;
    expect(tutorialCard(t, r)).toBeNull();
    r.special.charges = 1;
    expect(tutorialCard(t, r)?.def.id).toBe('special');
    addEnemy(r, 'glucose', r.agent.x + 200, r.agent.y);
    stepRun(r, { ...STILL, special: true }, DT);
    updateTutorial(t, r);
    expect(id()).toBe('survive');
    r.time += TUTORIAL.steps[4]!.seconds!;
    updateTutorial(t, r);
    expect(tutorialDone(t)).toBe(true);
    expect(tutorialCard(t, r)).toBeNull();
  });

  it('Pular acaba o tutorial na hora', () => {
    const r = createRun(1, rulesWithoutSpawn(), 'dopamine');
    const t = createTutorial(r);
    skipTutorial(t);
    expect(tutorialCard(t, r)).toBeNull();
  });
});
