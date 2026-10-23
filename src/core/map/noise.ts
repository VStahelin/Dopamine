/**
 * Números pseudoaleatórios por posição, para o mapa (fase 5.7): o mesmo par (semente, x, y)
 * sempre dá o mesmo valor, então nada do mapa precisa ser guardado.
 */

/** Mistura inteiros num hash de 32 bits. */
export function hash(...values: number[]): number {
  let h = 0x811c9dc5;
  for (const v of values) {
    h = Math.imul(h ^ (v | 0), 0x01000193);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
  }
  return h >>> 0;
}

/** Valor em [0, 1) para um ponto da grade. */
export function lattice(seed: number, x: number, y: number): number {
  return hash(seed, x, y) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Ruído de valor suave em [0, 1): manchas do tamanho de `scale` (em tiles). */
export function valueNoise(seed: number, x: number, y: number, scale: number): number {
  const gx = x / scale;
  const gy = y / scale;
  const i = Math.floor(gx);
  const j = Math.floor(gy);
  const tx = smooth(gx - i);
  const ty = smooth(gy - j);
  const a = lattice(seed, i, j) * (1 - tx) + lattice(seed, i + 1, j) * tx;
  const b = lattice(seed, i, j + 1) * (1 - tx) + lattice(seed, i + 1, j + 1) * tx;
  return a * (1 - ty) + b * ty;
}
