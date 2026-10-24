import type * as Phaser from 'phaser';
import { UI_SPRITES, type ColoredGrid } from '../../assets/sprites';
import type { MapEnvironment } from '../../config';
import { PALETTE, paletteColor } from '../render/palette';

/**
 * Peças de pixel art da interface. Os desenhos ficam em `src/assets/sprites/ui.json`
 * (decisão 0019); aqui só o jeito de desenhar.
 */

/** Ícones de 8×8 pixels do menu: 'o' = pixel aceso. */
export type IconName = keyof typeof UI_SPRITES.icons & string;

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
  (UI_SPRITES.icons[name] ?? []).forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c === 'o') g.fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}

/** Desenha uma grade colorida (organismo, cadeado) com canto superior esquerdo em (x, y). */
function drawColoredGrid(
  g: Phaser.GameObjects.Graphics,
  sprite: ColoredGrid,
  x: number,
  y: number,
  pixel: number,
): void {
  sprite.rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      const name = sprite.colors[c];
      if (name === undefined) return;
      g.fillStyle(paletteColor(name)).fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}

/** Organismo pixelado: contorno, corpo e setor doente. */
export const BODY_SIZE = {
  cols: UI_SPRITES.body.rows[0]?.length ?? 0,
  rows: UI_SPRITES.body.rows.length,
};

export function drawBody(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  pixel: number,
): void {
  drawColoredGrid(g, UI_SPRITES.body, x, y, pixel);
}

/** Corpo com os locais da tela "Onde agir?" (fase 5.12). */
export const BODY_MAP_SIZE = {
  cols: UI_SPRITES.bodyMap.rows[0]?.length ?? 0,
  rows: UI_SPRITES.bodyMap.rows.length,
};

/** Letra de cada local no `bodyMap` de ui.json. */
const BODY_MAP_LOCALS: Readonly<Record<string, MapEnvironment>> = {
  B: 'brain',
  U: 'lung',
  L: 'liver',
  I: 'intestine',
  V: 'blood',
};

/** Desenha o corpo dos locais; `colorOf` pinta cada local (aceso, apagado, bloqueado). */
export function drawBodyMap(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  pixel: number,
  colorOf: (env: MapEnvironment) => number,
): void {
  UI_SPRITES.bodyMap.rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      const env = BODY_MAP_LOCALS[c];
      const color =
        c === 'o' ? PALETTE.cyan : c === 'b' ? PALETTE.bodyFill : env ? colorOf(env) : undefined;
      if (color === undefined) return;
      g.fillStyle(color).fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}

/** Pixel (coluna, linha) no meio de cada local do `bodyMap`, para tocar e marcar. */
export function bodyMapCenters(): Record<MapEnvironment, { col: number; row: number }> {
  const sum: Partial<Record<MapEnvironment, { c: number; r: number; n: number }>> = {};
  UI_SPRITES.bodyMap.rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      const env = BODY_MAP_LOCALS[c];
      if (!env) return;
      const s = (sum[env] ??= { c: 0, r: 0, n: 0 });
      s.c += i;
      s.r += j;
      s.n++;
    });
  });
  return Object.fromEntries(
    Object.entries(sum).map(([env, s]) => [env, { col: s.c / s.n, row: s.r / s.n }]),
  ) as Record<MapEnvironment, { col: number; row: number }>;
}

/** Formas em coordenadas relativas 0–1: octógono "pixelado" do guia de estilo, estrela, escudo. */
const { octagon: OCTAGON, star: STAR, shield: SHIELD } = UI_SPRITES.shapes;

function polygon(
  g: Phaser.GameObjects.Graphics,
  points: readonly (readonly number[])[],
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  // fillPoints só lê x e y de cada ponto.
  const pts = points.map(([px = 0, py = 0]) => ({ x: x + px * w, y: y + py * h }));
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
  // O "!" branco do canvas: haste e ponto de 2 px de largura.
  const inner = size - 6;
  const sx = x + Math.floor((size - 2) / 2);
  const stem = Math.max(2, inner - 5);
  g.fillStyle(0xffffff)
    .fillRect(sx, y + 4, 2, stem)
    .fillRect(sx, y + 5 + stem, 2, 2);
}

/** Cadeado de 5×8 pixels. */
export function drawLock(g: Phaser.GameObjects.Graphics, x: number, y: number, pixel = 1): void {
  drawColoredGrid(g, UI_SPRITES.lock, x, y, pixel);
}
