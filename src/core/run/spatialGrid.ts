/** Baldes da tabela de espalhamento; potência de 2. */
const BUCKETS = 4096;

/**
 * Grade espacial para achar vizinhos sem comparar todos com todos. As células vão para uma
 * tabela de espalhamento de tamanho fixo, com listas ligadas em arrays tipados: montar a grade a
 * cada passo não cria objetos (playtest rodada 2, PERF-1). Cada item guarda a célula exata, então
 * duas células no mesmo balde não se misturam.
 */
export class SpatialGrid {
  private readonly head = new Int32Array(BUCKETS).fill(-1);
  /** Baldes usados desde o último `clear`, para limpar só eles. */
  private touched = new Int32Array(64);
  private touchedCount = 0;
  private next = new Int32Array(64);
  private ids = new Int32Array(64);
  private cellX = new Int32Array(64);
  private cellY = new Int32Array(64);
  private count = 0;

  constructor(private readonly cellSize: number) {}

  clear(): void {
    for (let i = 0; i < this.touchedCount; i++) this.head[this.touched[i]!] = -1;
    this.touchedCount = 0;
    this.count = 0;
  }

  insert(index: number, x: number, y: number): void {
    if (this.count === this.ids.length) this.grow();
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const b = bucket(cx, cy);
    if (this.head[b] === -1) {
      if (this.touchedCount === this.touched.length) this.touched = grown(this.touched);
      this.touched[this.touchedCount++] = b;
    }
    const k = this.count++;
    this.ids[k] = index;
    this.cellX[k] = cx;
    this.cellY[k] = cy;
    this.next[k] = this.head[b]!;
    this.head[b] = k;
  }

  /** Chama `visit` para cada índice nas células que cobrem o círculo (x, y, radius). */
  query(x: number, y: number, radius: number, visit: (index: number) => void): void {
    const s = this.cellSize;
    const x0 = Math.floor((x - radius) / s);
    const x1 = Math.floor((x + radius) / s);
    const y0 = Math.floor((y - radius) / s);
    const y1 = Math.floor((y + radius) / s);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        for (let k = this.head[bucket(cx, cy)]!; k !== -1; k = this.next[k]!) {
          if (this.cellX[k] === cx && this.cellY[k] === cy) visit(this.ids[k]!);
        }
      }
    }
  }

  private grow(): void {
    this.next = grown(this.next);
    this.ids = grown(this.ids);
    this.cellX = grown(this.cellX);
    this.cellY = grown(this.cellY);
  }
}

function bucket(cx: number, cy: number): number {
  return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & (BUCKETS - 1);
}

function grown(a: Int32Array<ArrayBuffer>): Int32Array<ArrayBuffer> {
  const b = new Int32Array(a.length * 2);
  b.set(a);
  return b;
}
