/** Grade espacial simples para achar vizinhos sem comparar todos com todos. */
export class SpatialGrid {
  private readonly cells = new Map<number, number[]>();

  constructor(private readonly cellSize: number) {}

  clear(): void {
    this.cells.clear();
  }

  insert(index: number, x: number, y: number): void {
    const key = this.key(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
    const cell = this.cells.get(key);
    if (cell) cell.push(index);
    else this.cells.set(key, [index]);
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
        const cell = this.cells.get(this.key(cx, cy));
        if (cell) for (const index of cell) visit(index);
      }
    }
  }

  private key(cx: number, cy: number): number {
    return (cx + 32768) * 65536 + (cy + 32768);
  }
}
