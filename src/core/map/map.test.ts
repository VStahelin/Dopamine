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

  it('grupos diferentes deixam uma passagem entre eles', () => {
    const passage = MAP.passageTiles * MAP.tileSizePx;
    for (let seed = 1; seed <= 20; seed++) {
      const c = generateChunk(MAP, { ...params, seed }, 2, 2);
      const solids = c.objects.filter((o) => o.kind !== 'decor');
      for (const a of solids) {
        for (const b of solids) {
          if (a.group === b.group) continue;
          const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius;
          expect(gap).toBeGreaterThanOrEqual(passage - 1);
        }
      }
    }
  });

  it('cada ambiente monta grupos com motivo, com objetos que existem nele', () => {
    for (const env of Object.keys(MAP.environments) as (keyof typeof MAP.environments)[]) {
      const def = MAP.environments[env];
      expect(def.groups.length).toBeGreaterThan(0);
      for (const g of def.groups) {
        expect(g.why.length).toBeGreaterThan(0);
        for (const part of g.parts) {
          if (part.kind === 'obstacle') expect(def.obstacles[part.sprite!]).toBeDefined();
          if (part.kind === 'decor') expect(def.decor).toContain(part.sprite);
        }
      }
      // Num mapa denso, a maior parte dos objetos com colisão vem em grupos de mais de um.
      let grouped = 0;
      let total = 0;
      for (let seed = 1; seed <= 10; seed++) {
        const c = generateChunk(MAP, { seed, env, density: 'dense' }, 3, 1);
        const solids = c.objects.filter((o) => o.kind !== 'decor');
        total += solids.length;
        grouped += solids.filter((o) => solids.some((p) => p !== o && p.group === o.group)).length;
      }
      expect(grouped / total).toBeGreaterThan(0.5);
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
