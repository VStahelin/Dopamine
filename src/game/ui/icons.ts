import type * as Phaser from 'phaser';
import { PALETTE } from '../render/palette';

/**
 * Ícones e peças de pixel art da interface, copiados do artboard "Menu principal (protótipo)"
 * do canvas de identidade visual.
 */

/** Ícones de 8×8 pixels: 'o' = pixel aceso. */
export const ICONS = {
  agents: [
    '........',
    '.oo..oo.',
    '.oo..oo.',
    '..o..o..',
    '...oo...',
    '...oo...',
    '...oo...',
    '........',
  ],
  arsenal: [
    '..oooo..',
    '...oo...',
    '...oo...',
    '..oooo..',
    '.oooooo.',
    'oooooooo',
    'oooooooo',
    '.oooooo.',
  ],
  case: [
    '...oo...',
    '...oo...',
    '...oo...',
    'oooooooo',
    'oooooooo',
    '...oo...',
    '...oo...',
    '...oo...',
  ],
  lab: [
    'o..o..o.',
    'o..o..o.',
    'o..o..o.',
    'o..o..o.',
    'oo.oo.oo',
    'oo.oo.oo',
    '........',
    'oooooooo',
  ],
  organism: [
    '.oo..oo.',
    'oooooooo',
    'oooooooo',
    'oooooooo',
    '.oooooo.',
    '..oooo..',
    '...oo...',
    '........',
  ],
  menu: [
    '........',
    'oooooooo',
    '........',
    '........',
    'oooooooo',
    '........',
    '........',
    'oooooooo',
  ],
  trophy: [
    'oooooooo',
    'oooooooo',
    '.oooooo.',
    '..oooo..',
    '...oo...',
    '...oo...',
    '..oooo..',
    '.oooooo.',
  ],
  book: [
    '.oooooo.',
    '.o....o.',
    '.o.oo.o.',
    '.o....o.',
    '.o.oo.o.',
    '.o....o.',
    '.oooooo.',
    '........',
  ],
  medal: [
    'o......o',
    '.o....o.',
    '..oooo..',
    '.oooooo.',
    '.oo..oo.',
    '.oooooo.',
    '..oooo..',
    '........',
  ],
  chest: [
    '........',
    '.oooooo.',
    'oooooooo',
    'oooooooo',
    'ooo..ooo',
    'oooooooo',
    'oooooooo',
    '........',
  ],
  idle: [
    'o..o..o.',
    'o..o..o.',
    '........',
    '.o..o..o',
    '.o..o..o',
    '........',
    'oooooooo',
    'oooooooo',
  ],
} as const;

export type IconName = keyof typeof ICONS;

/** Desenha um ícone de 8×8 com canto superior esquerdo em (x, y). */
export function drawIcon(
  g: Phaser.GameObjects.Graphics,
  name: IconName,
  x: number,
  y: number,
  color: number,
  pixel = 3,
): void {
  g.fillStyle(color);
  ICONS[name].forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c === 'o') g.fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}

/** Organismo pixelado de 14×22: 'o' contorno, 'b' corpo, 'r' setor doente. */
const BODY = [
  '....oooooo....',
  '...obbbbbbo...',
  '...obbbbbbo...',
  '...obbbbbbo...',
  '....obbbbo....',
  '.....obbo.....',
  '..oooobboooo..',
  '.obbbbbbbbbbo.',
  'obbbrrrrrrbbbo',
  'obbbrrrrrrbbbo',
  'obobrrrrrrbobo',
  'obobrrrrrrbobo',
  'obobbbbbbbbobo',
  'obo.obbbbo.obo',
  'ooo.obbbbo.ooo',
  '....obbbbo....',
  '....obbobbo...',
  '....obbobbo...',
  '....obbobbo...',
  '....obbobbo...',
  '...obbbobbbo..',
  '...ooooooooo..',
];

export const BODY_SIZE = { cols: 14, rows: 22 };

export function drawBody(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  pixel: number,
): void {
  const colors: Record<string, number> = {
    o: PALETTE.cyan,
    b: PALETTE.bodyFill,
    r: PALETTE.interaction,
  };
  BODY.forEach((row, j) => {
    [...row].forEach((c, i) => {
      const color = colors[c];
      if (color === undefined) return;
      g.fillStyle(color).fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}

/** Octógono "pixelado" do guia de estilo (cantos em degrau), em coordenadas relativas 0–1. */
const OCTAGON = [
  [0.25, 0],
  [0.75, 0],
  [0.75, 0.125],
  [0.875, 0.125],
  [0.875, 0.25],
  [1, 0.25],
  [1, 0.75],
  [0.875, 0.75],
  [0.875, 0.875],
  [0.75, 0.875],
  [0.75, 1],
  [0.25, 1],
  [0.25, 0.875],
  [0.125, 0.875],
  [0.125, 0.75],
  [0, 0.75],
  [0, 0.25],
  [0.125, 0.25],
  [0.125, 0.125],
  [0.25, 0.125],
] as const;

function polygon(
  g: Phaser.GameObjects.Graphics,
  points: readonly (readonly [number, number])[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  // fillPoints só lê x e y de cada ponto.
  const pts = points.map(([px, py]) => ({ x: x + px * w, y: y + py * h }));
  g.fillPoints(pts as unknown as Phaser.Math.Vector2[], true);
}

/** Moeda de ATP: octógono dourado com borda escura e brilho. */
export function drawCoin(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
  g.fillStyle(PALETTE.goldDark);
  polygon(g, OCTAGON, x, y, size, size);
  g.fillStyle(PALETTE.gold);
  polygon(g, OCTAGON, x + 3, y + 3, size - 6, size - 6);
  g.fillStyle(PALETTE.goldHi).fillRect(
    x + Math.round(size * 0.4),
    y + Math.round(size * 0.27),
    4,
    Math.round(size * 0.45),
  );
}

const STAR = [
  [0.5, 0],
  [0.63, 0.35],
  [1, 0.38],
  [0.71, 0.6],
  [0.81, 1],
  [0.5, 0.78],
  [0.19, 1],
  [0.29, 0.6],
  [0, 0.38],
  [0.37, 0.35],
] as const;

/** Estrela de 5 pontas com contorno escuro: dourada se conquistada, apagada se não. */
export function drawStar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  filled: boolean,
): void {
  g.fillStyle(PALETTE.ink);
  polygon(g, STAR, x, y, size, size);
  g.fillStyle(filled ? PALETTE.gold : PALETTE.panel);
  polygon(g, STAR, x + 4, y + 4, size - 8, size - 8);
}

const SHIELD = [
  [0, 0],
  [1, 0],
  [1, 0.62],
  [0.5, 1],
  [0, 0.62],
] as const;

/** Distintivo do caso (escudo): contorno escuro, fundo azul-painel. */
export function drawShield(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(PALETTE.ink);
  polygon(g, SHIELD, x, y, w, h);
  g.fillStyle(PALETTE.panel);
  polygon(g, SHIELD, x + 3, y + 3, w - 6, h - 6);
}

/** Moldura de madeira: contorno, madeira escura e um filete claro por dentro. */
export function drawWoodFrame(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(PALETTE.outline).fillRect(x, y, w, h);
  g.fillStyle(PALETTE.woodLight).fillRect(x + 4, y + 4, w - 8, h - 8);
  g.fillStyle(PALETTE.woodDark).fillRect(x + 6, y + 6, w - 12, h - 12);
}

/** Fundo creme de slot (como o slot de agente do guia de estilo). */
export function drawCreamSlot(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(PALETTE.creamShade).fillRect(x, y, w, h);
  g.fillStyle(PALETTE.cream).fillRect(x + 3, y + 3, w - 3, h - 3);
}

/** Caixa azul com contorno quase preto (trilhos, estrelas). */
export function drawInkBox(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number = PALETTE.panelDeep,
): void {
  g.fillStyle(PALETTE.ink).fillRect(x, y, w, h);
  g.fillStyle(fill).fillRect(x + 3, y + 3, w - 6, h - 6);
}

/** Fundo quadriculado da área central do menu. */
export function drawGrid(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  cell = 26,
): void {
  g.fillStyle(PALETTE.night).fillRect(x, y, w, h);
  g.fillStyle(PALETTE.panelDeep);
  for (let gx = 0; gx < w; gx += cell) g.fillRect(x + gx, y, 2, h);
  for (let gy = 0; gy < h; gy += cell) g.fillRect(x, y + gy, w, 2);
}

/** Selo vermelho de novidade ("!"). */
export function drawBadge(g: Phaser.GameObjects.Graphics, x: number, y: number, size = 18): void {
  g.fillStyle(PALETTE.outline).fillRect(x, y, size, size);
  g.fillStyle(PALETTE.interaction).fillRect(x + 3, y + 3, size - 6, size - 6);
}

const LOCK = ['.###.', '#...#', '#...#', '#####', '#ooo#', '#o#o#', '#ooo#', '#####'];

/** Cadeado de 5×8 pixels. */
export function drawLock(g: Phaser.GameObjects.Graphics, x: number, y: number, pixel = 1): void {
  LOCK.forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c === '.') return;
      g.fillStyle(c === '#' ? PALETTE.outline : PALETTE.stone);
      g.fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}
