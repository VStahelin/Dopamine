import {
  BOND_COLOR,
  ELEMENTS,
  FRAMES,
  ICON_PALETTE,
  ICON_SIZE,
  WORLD_SPRITES,
  type FrameKind,
  type MoleculeDef,
  type OrbStyle,
  type PixelGrid,
} from '../../assets/sprites';
import { DISPLAY } from '../../config';
import { paletteColor } from './palette';

/**
 * Desenho dos sprites a partir dos dados de `src/assets/sprites` (decisão 0019), sem depender do
 * Phaser: tudo é pintado com retângulos num `Painter`. No jogo o pintor é um
 * `Phaser.GameObjects.Graphics` (textures.ts); no exportador de PNG é um buffer de pixels
 * (tools/sprites). Assim os dois saem iguais.
 *
 * Sprites do mundo usam unidades do mundo multiplicadas por `detail` (pixels de arte por
 * unidade, decisão 0009): o mesmo sprite sai com mais pixels sem mudar de tamanho no mundo.
 */
export interface Painter {
  fillStyle(color: number, alpha?: number): Painter;
  fillRect(x: number, y: number, width: number, height: number): Painter;
}

export interface Size {
  width: number;
  height: number;
}

/** Escurece uma cor RGB pelo fator (0 a 1). */
export function shade(color: number, factor: number): number {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/** Pinta um círculo pixelado de diâmetro `d` com canto superior esquerdo em (x, y). */
export function pixelCircle(p: Painter, x: number, y: number, d: number): void {
  const r = d / 2;
  for (let row = 0; row < d; row++) {
    const dy = row + 0.5 - r;
    const w = Math.round(2 * Math.sqrt(Math.max(0, r * r - dy * dy)));
    if (w > 0) p.fillRect(x + Math.round(r - w / 2), y + row, w, 1);
  }
}

/**
 * Octógono em degraus, o "pixel redondo" do canvas: cantos cortados em dois degraus de 1/8 do
 * lado, como o `clip-path` das pranchetas.
 */
export function pixelOctagon(p: Painter, x: number, y: number, size: number): void {
  const step = Math.max(1, Math.round(size / 8));
  const quarter = step * 2;
  p.fillRect(x + quarter, y, size - quarter * 2, size);
  p.fillRect(x + step, y + step, size - step * 2, size - step * 2);
  p.fillRect(x, y + quarter, size, size - quarter * 2);
}

/** Linha grossa feita de quadrados, para continuar pixelada. */
function pixelLine(
  p: Painter,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
): void {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + (x1 - x0) * t - thickness / 2);
    const y = Math.round(y0 + (y1 - y0) * t - thickness / 2);
    p.fillRect(x, y, thickness, thickness);
  }
}

/**
 * Bolinha do canvas (átomo, gema, elétron, disparo, moeda): octógono com borda escura, miolo na
 * cor e um quadrado de brilho no canto de cima à esquerda.
 */
function paintBall(
  p: Painter,
  x: number,
  y: number,
  size: number,
  colors: { dark: number; fill: number; light: number },
  border: number,
): void {
  p.fillStyle(colors.dark);
  pixelOctagon(p, x, y, size);
  p.fillStyle(colors.fill);
  pixelOctagon(p, x + border, y + border, size - border * 2);
  const spot = Math.max(1, Math.round(size / 5));
  p.fillStyle(colors.light).fillRect(
    x + Math.round(size * 0.24),
    y + Math.round(size * 0.24),
    spot,
    spot,
  );
}

const element = (el: keyof typeof ELEMENTS) => {
  const e = ELEMENTS[el];
  return {
    size: e.size,
    colors: {
      dark: paletteColor(e.dark),
      fill: paletteColor(e.fill),
      light: paletteColor(e.light),
    },
  };
};

/**
 * Tamanho da textura da molécula, com o centro da textura no centro geométrico da molécula
 * (para o sprite girar e alinhar certo).
 */
export function moleculeSize(def: MoleculeDef, detail: number): Size {
  const pad = detail * 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [el, x, y] of def.atoms) {
    const r = (element(el).size * detail) / 2;
    minX = Math.min(minX, x * detail - r);
    minY = Math.min(minY, y * detail - r);
    maxX = Math.max(maxX, x * detail + r);
    maxY = Math.max(maxY, y * detail + r);
  }
  return {
    width: (Math.ceil(Math.max(-minX, maxX)) + pad) * 2,
    height: (Math.ceil(Math.max(-minY, maxY)) + pad) * 2,
  };
}

/** Pinta a molécula: ligações, depois os átomos de trás para a frente. */
export function paintMolecule(p: Painter, def: MoleculeDef, detail: number): Size {
  const size = moleculeSize(def, detail);
  const halfW = size.width / 2;
  const halfH = size.height / 2;
  const at = (v: number, half: number) => v * detail + half;

  const bond = Math.max(2, Math.round(1.7 * detail));
  const thin = Math.max(1, Math.round(0.9 * detail));
  p.fillStyle(paletteColor(BOND_COLOR));
  for (const [a, b, order] of def.bonds) {
    const [, x0, y0] = def.atoms[a]!;
    const [, x1, y1] = def.atoms[b]!;
    const [px, py, qx, qy] = [at(x0, halfW), at(y0, halfH), at(x1, halfW), at(y1, halfH)];
    if (order === 2) {
      const len = Math.hypot(qx - px, qy - py);
      const nx = (-(qy - py) / len) * 1.3 * detail;
      const ny = ((qx - px) / len) * 1.3 * detail;
      pixelLine(p, px + nx, py + ny, qx + nx, qy + ny, thin);
      pixelLine(p, px - nx, py - ny, qx - nx, qy - ny, thin);
    } else {
      pixelLine(p, px, py, qx, qy, bond);
    }
  }

  // Átomos mais abaixo ficam por cima.
  for (const [el, x, y] of [...def.atoms].sort((a, b) => a[2] - b[2])) {
    const { size: s, colors } = element(el);
    const d = s * detail;
    paintBall(
      p,
      Math.round(at(x, halfW) - d / 2),
      Math.round(at(y, halfH) - d / 2),
      d,
      colors,
      detail,
    );
  }
  return size;
}

/** Grade de ícone com a paleta dos ícones, `scale` pixels por pixel de arte. */
export function paintGrid(p: Painter, grid: PixelGrid, scale = 1): Size {
  grid.forEach((row, y) => {
    [...row].forEach((c, x) => {
      const color = ICON_PALETTE[c];
      if (!color) return;
      p.fillStyle(paletteColor(color)).fillRect(x * scale, y * scale, scale, scale);
    });
  });
  return { width: (grid[0]?.length ?? 0) * scale, height: grid.length * scale };
}

/** Bolinha do campo a partir do estilo de `world.json`. */
export function paintOrb(p: Painter, style: OrbStyle, detail: number): Size {
  const size = style.size * detail;
  const colors = {
    dark: paletteColor(style.border),
    fill: paletteColor(style.fill),
    light: paletteColor(style.light),
  };
  paintBall(p, 0, 0, size, colors, Math.max(1, Math.round(detail * 1.5)));
  return { width: size, height: size };
}

/** Ladrilho de areia com o rejunte da prancheta (linhas na borda de cima e da esquerda). */
export function paintGround(p: Painter, detail: number): Size {
  const { fill, line, lineWidth } = WORLD_SPRITES.ground;
  const size = DISPLAY.tileSizePx * detail;
  const w = lineWidth * detail;
  p.fillStyle(paletteColor(fill)).fillRect(0, 0, size, size);
  p.fillStyle(paletteColor(line)).fillRect(0, 0, size, w).fillRect(0, 0, w, size);
  return { width: size, height: size };
}

/** Gema de XP: losango ciano com borda escura e brilho, como na prancheta. */
export function paintGem(p: Painter, detail: number): Size {
  const gem = WORLD_SPRITES.gem;
  const size = gem.size * detail;
  const c = (size - 1) / 2;
  const border = Math.max(1, Math.round(detail * 1.5));
  const diamond = (inset: number, color: number) => {
    p.fillStyle(color);
    for (let row = inset; row < size - inset; row++) {
      const half = Math.floor(c - inset - Math.abs(row - c));
      if (half >= 0) p.fillRect(Math.round(c - half), row, half * 2 + 1, 1);
    }
  };
  diamond(0, paletteColor(gem.border));
  diamond(border, paletteColor(gem.fill));
  const spot = Math.max(1, detail);
  p.fillStyle(paletteColor(gem.light)).fillRect(
    Math.round(c - spot * 1.5),
    Math.round(c - spot * 1.5),
    spot,
    spot,
  );
  return { width: size, height: size };
}

/** Espessura da borda e do filete da moldura em cada escala do ícone. */
export function frameLine(scale: number): number {
  return scale >= 3 ? 3 : 2;
}

/** Lado do espaço com moldura para um ícone de 16×16 em `scale` (1 → 24, 2 → 40, 3 → 60). */
export function slotSize(scale: number): number {
  return ICON_SIZE * scale + frameLine(scale) * 4;
}

/** Moldura de um espaço de ícone (prancheta "Crônico: ícones, dano e paisagem"). */
export function paintFrame(p: Painter, kind: FrameKind, scale: number): Size {
  const f = FRAMES[kind];
  const size = slotSize(scale);
  const line = frameLine(scale);
  const border = paletteColor(f.border);
  if (f.dashed) {
    p.fillStyle(paletteColor(f.fill)).fillRect(0, 0, size, size);
    p.fillStyle(border);
    const dash = line * 2;
    for (let i = 0; i < size; i += dash * 2) {
      const len = Math.min(dash, size - i);
      p.fillRect(i, 0, len, line).fillRect(i, size - line, len, line);
      p.fillRect(0, i, line, len).fillRect(size - line, i, line, len);
    }
    return { width: size, height: size };
  }
  p.fillStyle(border).fillRect(0, 0, size, size);
  let inner = line;
  if (f.inset) {
    p.fillStyle(paletteColor(f.inset)).fillRect(line, line, size - line * 2, size - line * 2);
    inner += line;
  }
  p.fillStyle(paletteColor(f.fill)).fillRect(inner, inner, size - inner * 2, size - inner * 2);
  return { width: size, height: size };
}
