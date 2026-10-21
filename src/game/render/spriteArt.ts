import {
  ELEMENTS,
  ICON_PALETTE,
  WORLD_SPRITES,
  type MoleculeDef,
  type PixelGrid,
} from '../../assets/sprites';
import { DISPLAY } from '../../config';
import { PALETTE, paletteColor } from './palette';

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
 * Átomo pixelado: contorno escuro, corpo na cor do elemento com sombra em meia-lua embaixo à
 * direita e um brilho no canto superior esquerdo.
 */
function paintAtom(
  p: Painter,
  x: number,
  y: number,
  size: number,
  color: number,
  outline: number,
): void {
  p.fillStyle(PALETTE.outline);
  pixelCircle(p, x, y, size);
  const inner = size - outline * 2;
  p.fillStyle(shade(color, 0.7));
  pixelCircle(p, x + outline, y + outline, inner);
  const lit = Math.round(inner * 0.8);
  p.fillStyle(color);
  pixelCircle(p, x + outline, y + outline, lit);
  const spot = Math.max(1, Math.round(size / 7));
  p.fillStyle(0xffffff, 0.9);
  p.fillRect(
    x + outline + Math.round(inner * 0.22),
    y + outline + Math.round(inner * 0.2),
    spot,
    spot,
  );
}

const element = (el: keyof typeof ELEMENTS) => ({
  color: paletteColor(ELEMENTS[el].color),
  size: ELEMENTS[el].size,
});

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
  const thin = Math.max(1, Math.round(0.7 * detail));
  p.fillStyle(PALETTE.outline);
  for (const [a, b, order] of def.bonds) {
    const [, x0, y0] = def.atoms[a]!;
    const [, x1, y1] = def.atoms[b]!;
    const [px, py, qx, qy] = [at(x0, halfW), at(y0, halfH), at(x1, halfW), at(y1, halfH)];
    if (order === 2) {
      const len = Math.hypot(qx - px, qy - py);
      const nx = (-(qy - py) / len) * 1.2 * detail;
      const ny = ((qx - px) / len) * 1.2 * detail;
      pixelLine(p, px + nx, py + ny, qx + nx, qy + ny, thin);
      pixelLine(p, px - nx, py - ny, qx - nx, qy - ny, thin);
    } else {
      pixelLine(p, px, py, qx, qy, bond);
    }
  }

  // Átomos mais abaixo ficam por cima.
  for (const [el, x, y] of [...def.atoms].sort((a, b) => a[2] - b[2])) {
    const { color, size: s } = element(el);
    const d = s * detail;
    paintAtom(
      p,
      Math.round(at(x, halfW) - d / 2),
      Math.round(at(y, halfH) - d / 2),
      d,
      color,
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

/** Elétron da Nuvem de Elétrons: pontos concêntricos com contorno e brilho. */
export function paintElectron(p: Painter, detail: number): Size {
  const { size, layers } = WORLD_SPRITES.electron;
  const d = size * detail;
  layers.forEach((color, i) => {
    const inset = i * detail;
    p.fillStyle(paletteColor(color));
    pixelCircle(p, inset, inset, i === 2 ? Math.max(2, d - 5 * detail) : d - 2 * inset);
  });
  return { width: d, height: d };
}

/** Ladrilho de areia com rejunte e grãos, sempre o mesmo (sorteio com semente fixa). */
export function paintGround(p: Painter, detail: number): Size {
  const { colors, grainDensity } = WORLD_SPRITES.ground;
  const [sand, grout, light] = colors.map(paletteColor) as [number, number, number];
  const size = DISPLAY.tileSizePx * detail;
  p.fillStyle(sand).fillRect(0, 0, size, size);

  let seed = WORLD_SPRITES.ground.seed;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const grain = Math.max(1, Math.round(detail / 2));
  for (let i = 0; i < size * grainDensity; i++) {
    p.fillStyle(rand() < 0.5 ? light : grout);
    p.fillRect(Math.floor(rand() * size), Math.floor(rand() * size), grain, grain);
  }

  const line = Math.max(1, Math.round(detail / 2));
  p.fillStyle(grout)
    .fillRect(0, size - line, size, line)
    .fillRect(size - line, 0, line, size);
  return { width: size, height: size };
}

/** Gema de XP: cristal em losango com contorno, faces claras e escuras e brilho. */
export function paintGem(p: Painter, detail: number): Size {
  const gem = WORLD_SPRITES.gem;
  const body = paletteColor(gem.body);
  const size = gem.size * detail;
  const c = (size - 1) / 2;
  const diamond = (inset: number, color: number) => {
    p.fillStyle(color);
    for (let row = inset; row < size - inset; row++) {
      const half = Math.floor(c - inset - Math.abs(row - c));
      if (half >= 0) p.fillRect(Math.round(c - half), row, half * 2 + 1, 1);
    }
  };
  diamond(0, paletteColor(gem.outline));
  diamond(detail, shade(body, gem.bodyShade));
  // Face clara: metade de cima.
  p.fillStyle(body);
  for (let row = detail; row <= c; row++) {
    const half = Math.floor(c - detail - Math.abs(row - c));
    if (half >= 0) p.fillRect(Math.round(c - half), row, half * 2 + 1, 1);
  }
  p.fillStyle(paletteColor(gem.shine));
  pixelCircle(p, Math.round(c - detail * 1.5), Math.round(c - detail * 1.5), Math.max(2, detail));
  return { width: size, height: size };
}
