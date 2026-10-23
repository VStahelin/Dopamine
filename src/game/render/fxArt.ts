import type { Painter } from './spriteArt';

/**
 * Efeitos do campo desenhados em pixels de arte (aura, poça, pulso, cone, feixe, golpe,
 * estalo), para combinarem com os sprites em vez de linhas e círculos lisos. As medidas estão em
 * unidades do mundo; `px` é o tamanho de um pixel de arte (1 / detail, decisão 0009) e tudo cai
 * na grade dele.
 */
const snap = (v: number, px: number) => Math.round(v / px) * px;

/** Faixas horizontais de um círculo: para cada linha, metade da largura. */
function rows(r: number, px: number, each: (dy: number, half: number) => void): void {
  for (let dy = -r; dy < r; dy += px) {
    const mid = dy + px / 2;
    const half = Math.sqrt(Math.max(0, r * r - mid * mid));
    if (half > 0) each(dy, snap(half, px));
  }
}

/** Disco pixelado de raio `r`. */
export function pixelDisc(p: Painter, cx: number, cy: number, r: number, px: number): void {
  const x0 = snap(cx, px);
  const y0 = snap(cy, px);
  rows(snap(r, px), px, (dy, half) => p.fillRect(x0 - half, y0 + dy, half * 2, px));
}

/** Anel pixelado: borda de espessura `width` por dentro do raio `r`. */
export function pixelRing(
  p: Painter,
  cx: number,
  cy: number,
  r: number,
  width: number,
  px: number,
): void {
  const x0 = snap(cx, px);
  const y0 = snap(cy, px);
  const outer = snap(r, px);
  const inner = Math.max(0, outer - Math.max(px, snap(width, px)));
  rows(outer, px, (dy, half) => {
    const mid = dy + px / 2;
    const inHalf = Math.abs(mid) < inner ? snap(Math.sqrt(inner * inner - mid * mid), px) : 0;
    if (inHalf <= 0) {
      p.fillRect(x0 - half, y0 + dy, half * 2, px);
      return;
    }
    p.fillRect(x0 - half, y0 + dy, half - inHalf, px);
    p.fillRect(x0 + inHalf, y0 + dy, half - inHalf, px);
  });
}

/** Linha grossa em quadrados de pixel de arte (feixe). */
export function pixelBand(
  p: Painter,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  px: number,
): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const w = Math.max(px, snap(width, px));
  const step = Math.max(px, w / 2);
  for (let d = 0; d <= len; d += step) {
    const t = len === 0 ? 0 : d / len;
    p.fillRect(snap(x0 + (x1 - x0) * t - w / 2, px), snap(y0 + (y1 - y0) * t - w / 2, px), w, w);
  }
}

/** Setor (cone) pixelado em células de `cell` unidades. */
export function pixelSector(
  p: Painter,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  spread: number,
  cell: number,
): void {
  const half = spread / 2;
  for (let y = -r; y < r; y += cell) {
    for (let x = -r; x < r; x += cell) {
      const mx = x + cell / 2;
      const my = y + cell / 2;
      if (mx * mx + my * my > r * r) continue;
      const a = Math.atan2(my, mx);
      if (Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle))) > half) continue;
      p.fillRect(snap(cx + x, cell), snap(cy + y, cell), cell, cell);
    }
  }
}
