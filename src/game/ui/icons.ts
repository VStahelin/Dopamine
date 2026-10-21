import type * as Phaser from 'phaser';
import { PALETTE } from '../render/palette';

/** Desenha um ícone de pixels a partir de linhas de texto: '#' contorno, 'o' cor, '.' vazio. */
function drawPattern(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  pattern: readonly string[],
  color: number,
  pixel = 1,
): void {
  pattern.forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c === '.') return;
      g.fillStyle(c === '#' ? PALETTE.outline : color);
      g.fillRect(x + i * pixel, y + j * pixel, pixel, pixel);
    });
  });
}

const STAR = [
  '....##....',
  '...#oo#...',
  '...#oo#...',
  '####oo####',
  '#oooooooo#',
  '.#oooooo#.',
  '..#oooo#..',
  '.#oo##oo#.',
  '.#o#..#o#.',
  '.##....##.',
];

const LOCK = ['.###.', '#...#', '#...#', '#####', '#ooo#', '#o#o#', '#ooo#', '#####'];

const HEART = ['.##.##.', '#oo#oo#', '#ooooo#', '.#ooo#.', '..#o#..', '...#...'];

/** Estrela de 10×10 pixels (vezes `pixel`): dourada se conquistada, apagada se não. */
export function drawStar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  filled: boolean,
  pixel = 2,
): void {
  drawPattern(g, x, y, STAR, filled ? PALETTE.gold : PALETTE.panelDark, pixel);
}

/** Cadeado de 5×8 pixels. */
export function drawLock(g: Phaser.GameObjects.Graphics, x: number, y: number, pixel = 1): void {
  drawPattern(g, x, y, LOCK, PALETTE.stone, pixel);
}

/** Coração de 7×6 pixels, o ícone do indivíduo. */
export function drawHeart(g: Phaser.GameObjects.Graphics, x: number, y: number, pixel = 2): void {
  drawPattern(g, x, y, HEART, PALETTE.interaction, pixel);
}
