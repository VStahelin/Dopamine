import { describe, expect, it } from 'vitest';
import { MAP } from '../../config';
import { createRun } from '../run/state';
import { stepRun } from '../run/step';
import { DT, rulesWithoutSpawn, STILL } from '../run/testRules';
import { generateChunk, mapName, mapParams, type MapParams } from './chunk';
import { createRunMap, pushOut, updateMap } from './world';

const params: MapParams = { seed: 1234, env: 'blood', density: 'dense' };

describe('mapas gerados (fase 5.7)', () => {
  it('mesma semente, mesmo bloco', () => {
    const a = generateChunk(MAP, params, 3, -2);
    const b = generateChunk(MAP, params, 3, -2);
    expect(Array.from(a.tiles)).toEqual(Array.from(b.tiles));
    expect(a.objects).toEqual(b.objects);
    const other = generateChunk(MAP, { ...params, seed: 999 }, 3, -2);
    expect(other.objects).not.toEqual(a.objects);
  });

  it('o começo da run fica livre de obstáculos', () => {
    const free = MAP.startFreeTiles * MAP.tileSizePx;
    for (const [bx, by] of [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ] as const) {
      for (const o of generateChunk(MAP, params, bx, by).objects) {
        if (o.kind === 'decor') continue;
        expect(Math.hypot(o.x, o.y)).toBeGreaterThanOrEqual(free - 40);
      }
    }
  });

  it('obstáculos de grupos diferentes ficam longe o bastante para passar', () => {
    const min = MAP.obstacleMinDistanceTiles * MAP.tileSizePx;
    for (let seed = 1; seed <= 20; seed++) {
      const c = generateChunk(MAP, { ...params, seed }, 2, 2);
      // O primeiro objeto de cada grupo é o que respeita a distância; as cópias encostam nele.
      const anchors = c.objects.filter(
        (o, i) =>
          o.kind !== 'decor' &&
          !c.objects
            .slice(0, i)
            .some((p) => p.sprite === o.sprite && Math.hypot(p.x - o.x, p.y - o.y) < p.radius * 2),
      );
      for (const a of anchors) {
        for (const b of anchors) {
          if (a === b) continue;
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(min - 1);
        }
      }
    }
  });

  it('o nome do mapa traz ambiente, densidade e semente', () => {
    expect(mapName(MAP, { seed: 0xa3f9, env: 'blood', density: 'dense' })).toBe(
      'Corrente sanguínea · Denso · #A3F9',
    );
    expect(Object.keys(MAP.environments)).toContain(mapParams(MAP, 5).env);
  });

  it('um círculo dentro de um obstáculo é empurrado para fora', () => {
    const map = createRunMap(params);
    updateMap(MAP, map, 2000, 2000);
    const solid = map.solids[0]!.object;
    const p = pushOut(map, solid.x + 1, solid.y, 7);
    expect(Math.hypot(p.x - solid.x, p.y - solid.y)).toBeGreaterThanOrEqual(
      solid.radius + 7 - 0.01,
    );
  });

  it('na run, o agente não atravessa obstáculos', () => {
    const r = createRun(1, rulesWithoutSpawn());
    stepRun(r, STILL, DT);
    r.agent.x = 3000;
    r.agent.y = 3000;
    stepRun(r, STILL, DT);
    const solid = r.map.solids.find((s) => s.object.kind === 'obstacle')!.object;
    r.agent.x = solid.x;
    r.agent.y = solid.y + 1;
    stepRun(r, STILL, DT);
    expect(Math.hypot(r.agent.x - solid.x, r.agent.y - solid.y)).toBeGreaterThanOrEqual(
      solid.radius,
    );
  });
});
