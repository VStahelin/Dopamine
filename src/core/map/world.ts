import type { MapConfig } from '../../config';
import { SpatialGrid } from '../run/spatialGrid';
import { generateChunk, type Chunk, type MapObject, type MapParams } from './chunk';

/**
 * O mapa da run (fase 5.7): os blocos gerados em volta do agente, os destrutíveis já quebrados e
 * uma grade com os objetos sólidos perto, para as colisões. Só os quebrados são guardados.
 */
export interface RunMap {
  params: MapParams;
  chunks: Map<string, Chunk>;
  /** Índices dos destrutíveis quebrados em cada bloco. */
  broken: Map<string, Set<number>>;
  /** Golpes já levados por destrutível ainda inteiro (chave bloco:índice). */
  hits: Map<string, number>;
  /** Blocos cujo ninho de vesículas já nasceu. */
  nests: Set<string>;
  /** Bloco do agente na última atualização; muda a grade quando ele troca de bloco. */
  center: string;
  /** Obstáculos e destrutíveis inteiros perto do agente, com a grade para achar vizinhos. */
  solids: { chunk: string; object: MapObject }[];
  grid: SpatialGrid;
}

export const chunkKey = (bx: number, by: number) => `${bx},${by}`;

export function createRunMap(params: MapParams): RunMap {
  return {
    params,
    chunks: new Map(),
    broken: new Map(),
    hits: new Map(),
    nests: new Set(),
    center: '',
    solids: [],
    grid: new SpatialGrid(64),
  };
}

/** Bloco que contém o ponto (x, y). */
export function chunkAt(cfg: MapConfig, x: number, y: number): { bx: number; by: number } {
  const size = cfg.chunkTiles * cfg.tileSizePx;
  return { bx: Math.floor(x / size), by: Math.floor(y / size) };
}

/**
 * Gera os blocos em volta de (x, y), solta os longe e refaz a grade dos sólidos quando o agente
 * troca de bloco. Devolve as vesículas dos ninhos que acabaram de aparecer.
 */
export function updateMap(
  cfg: MapConfig,
  map: RunMap,
  x: number,
  y: number,
): { x: number; y: number }[] {
  const { bx, by } = chunkAt(cfg, x, y);
  const center = chunkKey(bx, by);
  if (center === map.center) return [];
  map.center = center;
  const reach = cfg.activeRadius + 1;
  const nests: { x: number; y: number }[] = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const key = chunkKey(bx + dx, by + dy);
      if (map.chunks.has(key)) continue;
      const chunk = generateChunk(cfg, map.params, bx + dx, by + dy);
      map.chunks.set(key, chunk);
      if (chunk.nest.length > 0 && !map.nests.has(key)) {
        map.nests.add(key);
        nests.push(...chunk.nest);
      }
    }
  }
  for (const [key, c] of map.chunks) {
    if (Math.max(Math.abs(c.bx - bx), Math.abs(c.by - by)) > cfg.discardRadius + 1) {
      map.chunks.delete(key);
    }
  }
  rebuildSolids(cfg, map);
  return nests;
}

/** Refaz a lista e a grade dos sólidos inteiros nos blocos em volta do agente. */
export function rebuildSolids(cfg: MapConfig, map: RunMap): void {
  const [cx, cy] = map.center.split(',').map(Number) as [number, number];
  const reach = cfg.activeRadius + 1;
  map.solids = [];
  map.grid.clear();
  for (const [key, c] of map.chunks) {
    if (Math.max(Math.abs(c.bx - cx), Math.abs(c.by - cy)) > reach) continue;
    const broken = map.broken.get(key);
    for (const object of c.objects) {
      if (object.kind === 'decor' || broken?.has(object.index)) continue;
      map.grid.insert(map.solids.length, object.x, object.y);
      map.solids.push({ chunk: key, object });
    }
  }
}

/**
 * Tira um círculo (x, y, radius) de dentro dos sólidos: ele desliza pela borda. Devolve a
 * posição corrigida.
 */
export function pushOut(
  map: RunMap,
  x: number,
  y: number,
  radius: number,
  out: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } {
  let px = x;
  let py = y;
  map.grid.query(px, py, radius + 32, (i) => {
    const o = map.solids[i]!.object;
    const dx = px - o.x;
    const dy = py - o.y;
    const min = radius + o.radius;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min) return;
    const d = Math.sqrt(d2) || 0.001;
    px = o.x + (dx / d) * min;
    py = o.y + (dy / d) * min;
  });
  out.x = px;
  out.y = py;
  return out;
}

/** Quebra um destrutível: lembra no bloco e tira da grade. */
export function breakSolid(cfg: MapConfig, map: RunMap, chunk: string, index: number): void {
  const set = map.broken.get(chunk) ?? new Set<number>();
  set.add(index);
  map.broken.set(chunk, set);
  map.hits.delete(`${chunk}:${index}`);
  rebuildSolids(cfg, map);
}
