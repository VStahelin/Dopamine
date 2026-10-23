import type {
  MapConfig,
  MapDensity,
  MapEnvironment,
  MapEnvironmentDef,
  MapGroupDef,
} from '../../config';
import { Rng } from '../random';
import { hash, lattice, valueNoise } from './noise';

/**
 * Um bloco do mapa (fase 5.7, docs/mapas.md): 16×16 tiles com o chão e os objetos, gerados pela
 * semente da run e pela posição. Gerar o mesmo bloco duas vezes dá o mesmo resultado.
 */
export interface MapObject {
  /** Índice dentro do bloco, para lembrar os destrutíveis quebrados. */
  index: number;
  kind: 'obstacle' | 'destructible' | 'decor';
  /** Id do sprite em src/assets/sprites/map.json. */
  sprite: string;
  x: number;
  y: number;
  /** Raio de colisão (0 na decoração). */
  radius: number;
  /** Grupo do bloco a que pertence (docs/mapas.md, "Grupos"); -1 na decoração solta. */
  group: number;
}

export interface Chunk {
  bx: number;
  by: number;
  /** Tile de cada posição (linha a linha): 0 base, 1 variação em manchas, 2 variação salpicada. */
  tiles: Uint8Array;
  objects: MapObject[];
  /** Vesículas do ninho deste bloco (ponto de interesse), em unidades do mundo. */
  nest: { x: number; y: number }[];
}

export interface MapParams {
  seed: number;
  env: MapEnvironment;
  density: MapDensity;
}

const between = (rng: Rng, [min, max]: [number, number]) => min + rng.int(max - min + 1);

/** Gera o bloco (bx, by). O bloco (0, 0) começa no começo da run, livre em volta. */
export function generateChunk(cfg: MapConfig, p: MapParams, bx: number, by: number): Chunk {
  const n = cfg.chunkTiles;
  const tile = cfg.tileSizePx;
  const size = n * tile;
  const env = cfg.environments[p.env];
  const rng = new Rng(hash(p.seed, bx, by, 7));

  // 1. Chão: manchas de variação 1 pelo ruído e variação 2 salpicada.
  const tiles = new Uint8Array(n * n);
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const gx = bx * n + tx;
      const gy = by * n + ty;
      const v = valueNoise(p.seed, gx, gy, cfg.floorNoise.scaleTiles);
      let t = v > cfg.floorNoise.threshold ? 1 : 0;
      if (lattice(p.seed + 1, gx, gy) < cfg.floorNoise.variant2Chance) t = 2;
      tiles[ty * n + tx] = t;
    }
  }

  // 2. Densidade local: um ruído largo abre clareiras (0,3 a 1,3 do limite da run).
  const cx = bx * n + n / 2;
  const cy = by * n + n / 2;
  const local = 0.3 + valueNoise(p.seed + 2, cx, cy, cfg.densityNoise.scaleTiles);
  const density = cfg.densities[p.density];

  const groups = Math.round(between(rng, density.groups) * local);
  const singles = Math.round(between(rng, density.obstacles) * local);
  const destructibles = between(rng, density.destructibles);

  // 3. O que vai no bloco: primeiro os grupos com motivo, depois os objetos soltos.
  const obstacleIds = Object.keys(env.obstacles);
  const layouts: Layout[] = [];
  for (let i = 0; i < groups; i++) {
    const def = rng.weighted(env.groups, (g) => g.weight);
    if (def) layouts.push(layoutGroup(def, env, tile, rng));
  }
  for (let i = 0; i < singles; i++) {
    const sprite = obstacleIds[rng.int(obstacleIds.length)]!;
    const radius = env.obstacles[sprite]!;
    layouts.push({ footprint: radius, parts: [{ kind: 'obstacle', sprite, x: 0, y: 0, radius }] });
  }
  for (let i = 0; i < destructibles; i++) {
    const { id, radius } = env.destructible;
    layouts.push({
      footprint: radius,
      parts: [{ kind: 'destructible', sprite: id, x: 0, y: 0, radius }],
    });
  }

  // 4. Cada um num lugar livre: longe da borda, do começo da run e dos outros, com uma passagem
  // de `passageTiles` entre eles, borda a borda.
  const passage = cfg.passageTiles * tile;
  const margin = cfg.edgeMarginTiles * tile;
  const startFree = cfg.startFreeTiles * tile;
  const ox = bx * size;
  const oy = by * size;
  const objects: MapObject[] = [];
  const placed: { x: number; y: number; footprint: number }[] = [];
  layouts.forEach((layout, group) => {
    const f = layout.footprint;
    if (margin + f > size - margin - f) return;
    for (let tries = 0; tries < 30; tries++) {
      const x = ox + rng.range(margin + f, size - margin - f);
      const y = oy + rng.range(margin + f, size - margin - f);
      if (Math.hypot(x, y) < startFree + f) continue;
      if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < q.footprint + f + passage)) continue;
      placed.push({ x, y, footprint: f });
      for (const o of layout.parts) {
        objects.push({ ...o, index: objects.length, x: x + o.x, y: y + o.y, group });
      }
      return;
    }
  });

  // 5. Decoração solta, sem colisão, em qualquer lugar (a maior parte vem nos grupos).
  const decor = between(rng, cfg.decorPerChunk);
  for (let i = 0; i < decor; i++) {
    const sprite = env.decor[rng.int(env.decor.length)]!;
    objects.push({
      index: objects.length,
      kind: 'decor',
      sprite,
      x: ox + rng.range(0, size),
      y: oy + rng.range(0, size),
      radius: 0,
      group: -1,
    });
  }

  // 6. Ninho de vesículas, nunca no bloco do começo.
  const nest: { x: number; y: number }[] = [];
  if ((bx !== 0 || by !== 0) && rng.next() < cfg.nestChance) {
    const count = between(rng, cfg.nestVesicles);
    const nx = ox + size / 2;
    const ny = oy + size / 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      nest.push({ x: nx + Math.cos(a) * tile, y: ny + Math.sin(a) * tile });
    }
  }

  return { bx, by, tiles, objects, nest };
}

/** Um grupo (ou objeto solto) montado em volta de (0, 0), antes de ir para o bloco. */
interface Layout {
  /** Raio que os objetos com colisão ocupam, da borda de fora ao centro. */
  footprint: number;
  parts: Omit<MapObject, 'index' | 'group'>[];
}

/**
 * Monta um grupo com motivo (docs/mapas.md, "Grupos") em volta de (0, 0): centro, anel com
 * abertura, fileira, aglomerado ou dispersão, parte por parte.
 */
function layoutGroup(def: MapGroupDef, env: MapEnvironmentDef, tile: number, rng: Rng): Layout {
  const parts: Layout['parts'] = [];
  const free = (x: number, y: number, r: number) =>
    parts.every((o) => o.radius === 0 || Math.hypot(o.x - x, o.y - y) >= o.radius + r);
  for (const part of def.parts) {
    const destructible = part.kind === 'destructible';
    const sprite = destructible ? env.destructible.id : part.sprite!;
    const radius =
      part.kind === 'decor' ? 0 : destructible ? env.destructible.radius : env.obstacles[sprite]!;
    const n = part.shape === 'center' ? 1 : between(rng, part.count ?? [1, 1]);
    const reach = (part.radiusTiles ?? 1) * tile;
    const add = (x: number, y: number) => parts.push({ kind: part.kind, sprite, x, y, radius });
    switch (part.shape) {
      case 'center':
        add(0, 0);
        break;
      case 'ring': {
        // Uma posição a mais fica vazia: a entrada do anel.
        const slots = n + (part.gap ? 1 : 0);
        const a0 = rng.range(0, Math.PI * 2);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / slots) * Math.PI * 2;
          add(Math.cos(a) * reach, Math.sin(a) * reach);
        }
        break;
      }
      case 'line': {
        const a = rng.range(0, Math.PI);
        const step = (part.spacingTiles ?? 1) * tile;
        for (let i = 0; i < n; i++) {
          const d = (i - (n - 1) / 2) * step;
          add(Math.cos(a) * d, Math.sin(a) * d);
        }
        break;
      }
      case 'cluster':
      case 'scatter':
        for (let i = 0; i < n; i++) {
          for (let tries = 0; tries < 20; tries++) {
            const a = rng.range(0, Math.PI * 2);
            const d = Math.sqrt(rng.next()) * reach;
            const x = Math.cos(a) * d;
            const y = Math.sin(a) * d;
            if (radius > 0 && !free(x, y, radius)) continue;
            add(x, y);
            break;
          }
        }
        break;
    }
  }
  const footprint = parts.reduce(
    (m, o) => (o.radius > 0 ? Math.max(m, Math.hypot(o.x, o.y) + o.radius) : m),
    0,
  );
  return { footprint, parts };
}

/** Sorteia o ambiente e a densidade da run a partir da semente. */
export function mapParams(cfg: MapConfig, seed: number, env?: MapEnvironment): MapParams {
  const rng = new Rng(hash(seed, 99));
  const envs = Object.keys(cfg.environments) as MapEnvironment[];
  const chosen = env ?? envs[rng.int(envs.length)]!;
  const densities = Object.keys(cfg.densities) as MapDensity[];
  const density = rng.weighted(densities, (d) => cfg.densities[d].chance) ?? 'standard';
  return { seed, env: chosen, density };
}

/** Nome do mapa: ambiente, densidade e a semente em 4 letras (CORRENTE SANGUÍNEA · DENSO · #A3F9). */
export function mapName(cfg: MapConfig, p: MapParams): string {
  const code = (p.seed & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `${cfg.environments[p.env].name} · ${cfg.densities[p.density].name} · #${code}`;
}
