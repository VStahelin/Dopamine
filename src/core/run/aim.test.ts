import { describe, expect, it } from 'vitest';
import { aimPoint } from './combat';
import { addEnemy, createRun } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';

/** Run parada perto de um destrutível do mapa, sem moléculas nem vesículas em volta. */
function nearDestructible() {
  const r = createRun(3, rulesWithoutSpawn());
  stepRun(r, STILL, DT);
  const d = r.map.solids.find((s) => s.object.kind === 'destructible')!;
  r.agent.x = d.object.x + 100;
  r.agent.y = d.object.y;
  r.vesicles = [];
  stepRun(r, STILL, DT);
  // Outros destrutíveis mais perto que este ficam de fora do teste.
  for (const s of r.map.solids) {
    if (s.object !== d.object && s.object.kind === 'destructible') s.object.kind = 'obstacle';
  }
  return { r, d };
}

describe('mira nos objetos que quebram', () => {
  it('sem molécula perto, a arma mira no destrutível e quebra ele', () => {
    const { r, d } = nearDestructible();
    const aim = aimPoint(r, r.agent.x, r.agent.y, 400);
    expect(aim).toMatchObject({ x: d.object.x, y: d.object.y });
    for (let i = 0; i < 60 * 6; i++) {
      r.vesicles = [];
      r.agent.interactions = r.stats.maxInteractions;
      stepRun(r, STILL, DT);
    }
    expect(r.map.broken.get(d.chunk)?.has(d.object.index)).toBe(true);
  });

  it('a molécula mais perto que o objeto continua sendo o alvo', () => {
    const { r } = nearDestructible();
    const e = addEnemy(r, 'glucose', r.agent.x + 40, r.agent.y, 1);
    expect(aimPoint(r, r.agent.x, r.agent.y, 400)?.enemy).toBe(e);
  });
});
