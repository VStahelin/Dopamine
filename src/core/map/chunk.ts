import type { MapConfig, MapDensity, MapEnvironment } from '../../config';
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
  const maxObstacles = Math.round(between(rng, density.obstacles) * local);
  const destructibles = between(rng, density.destructibles);

  // 3. Pontos com distância mínima (amostragem por tentativa), longe da borda e do começo.
  const minDist = cfg.obstacleMinDistanceTiles * tile;
  const margin = cfg.edgeMarginTiles * tile;
  const startFree = cfg.startFreeTiles * tile;
  const ox = bx * size;
  const oy = by * size;
  const points: { x: number; y: number }[] = [];
  for (let tries = 0; tries < 60 && points.length < maxObstacles + destructibles; tries++) {
    const x = ox + rng.range(margin, size - margin);
    const y = oy + rng.range(margin, size - margin);
    if (x * x + y * y < startFree * startFree) continue;
    if (points.some((q) => (q.x - x) ** 2 + (q.y - y) ** 2 < minDist * minDist)) continue;
    points.push({ x, y });
  }

  const objects: MapObject[] = [];
  const push = (kind: MapObject['kind'], sprite: string, x: number, y: number, radius: number) =>
    objects.push({ index: objects.length, kind, sprite, x, y, radius });
  const obstacleIds = Object.keys(env.obstacles);
  points.forEach((pt, i) => {
    if (i < destructibles) {
      push('destructible', env.destructible.id, pt.x, pt.y, env.destructible.radius);
      return;
    }
    const sprite = obstacleIds[rng.int(obstacleIds.length)]!;
    const r = env.obstacles[sprite]!;
    push('obstacle', sprite, pt.x, pt.y, r);
    // Aglomerado: 1 ou 2 cópias encostadas (o grupo conta como um obstáculo só).
    if (rng.next() < cfg.clusterChance) {
      const copies = 1 + rng.int(2);
      for (let c = 0; c < copies; c++) {
        const a = rng.range(0, Math.PI * 2);
        push('obstacle', sprite, pt.x + Math.cos(a) * r * 1.8, pt.y + Math.sin(a) * r * 1.8, r);
      }
    }
  });

  // 5. Decoração, sem colisão, em qualquer lugar.
  const decor = between(rng, cfg.decorPerChunk);
  for (let i = 0; i < decor; i++) {
    const sprite = env.decor[rng.int(env.decor.length)]!;
    push('decor', sprite, ox + rng.range(0, size), oy + rng.range(0, size), 0);
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
