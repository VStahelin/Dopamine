import { LOGO, type LogoInkStyle, type PixelGrid } from '../../assets/sprites';
import { paletteColor } from './palette';
import type { Painter, Size } from './spriteArt';

/**
 * Logo do jogo (docs/logo.md), montada a partir de `logo.json`: o nome é escrito com a fonte em
 * pixel de lá, então trocar a grafia (por exemplo, FÁRMACO) é só mudar `name` e rodar
 * `npm run sprites:build`. Tudo sai como grades com as letras da paleta da logo.
 */

/** Variante de cor: a colorida, ou tudo numa tinta só (creme para fundo escuro, noite para claro). */
export type LogoVariant = 'color' | 'monoCream' | 'monoNight';

type Cells = string[][];

const blank = (w: number, h: number): Cells =>
  Array.from({ length: h }, () => Array<string>(w).fill('.'));

const toRows = (cells: Cells): string[] => cells.map((r) => r.join(''));

/** Cola `src` em `dst` com o canto em (x, y); '.' não apaga nada. */
function stamp(dst: Cells, src: PixelGrid | Cells, x: number, y: number): void {
  src.forEach((row, j) => {
    [...row].forEach((c, i) => {
      if (c !== '.' && dst[y + j]?.[x + i] !== undefined) dst[y + j]![x + i] = c;
    });
  });
}

/** Desenho de uma letra (com acento ou cedilha, se tiver), linha 0 = topo da maiúscula. */
interface Glyph {
  width: number;
  /** Pixels acesos, relativos ao topo da maiúscula (acentos ficam com y negativo). */
  pixels: [number, number][];
}

function glyph(ch: string): Glyph {
  const { glyphs, marks, accented } = LOGO.font;
  const [base, mark] = accented[ch] ?? [ch, undefined];
  const rows = glyphs[base!] ?? glyphs[' ']!;
  const pixels: [number, number][] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => c === '#' && pixels.push([x, y])));
  const width = rows[0]!.length;
  if (mark) {
    const m = marks[mark]!;
    // Acentos ficam 1 pixel acima da maiúscula; a cedilha, logo abaixo.
    const top = mark === 'cedilla' ? LOGO.font.height : -m.length - 1;
    const dx = Math.floor((width - m[0]!.length) / 2);
    m.forEach((row, y) => [...row].forEach((c, x) => c === '#' && pixels.push([x + dx, top + y])));
  }
  return { width, pixels };
}

/** Máscara de uma linha de texto: pixels em `scale`, cada letra `rise` pixels acima da anterior. */
function textMask(text: string, scale: number, rise: number, bold: number) {
  const glyphs = [...text.toUpperCase()].map(glyph);
  const gap = LOGO.font.spacing * scale + bold;
  const width =
    glyphs.reduce((sum, g) => sum + g.width * scale, 0) + gap * (glyphs.length - 1) + bold;
  const ys = glyphs.flatMap((g) => g.pixels.map(([, y]) => y));
  const top = Math.min(0, ...ys) * scale;
  const bottom = (Math.max(LOGO.font.height - 1, ...ys) + 1) * scale;
  const lift = rise * (glyphs.length - 1);
  const height = bottom - top + lift;
  const on = Array.from({ length: height }, () => Array<boolean>(width).fill(false));
  /** Deslocamento vertical de cada coluna, para a faixa acompanhar a subida das letras. */
  const columnLift = Array<number>(width).fill(0);
  let x = 0;
  glyphs.forEach((g, i) => {
    const dy = lift - rise * i - top;
    // Negrito: cada pixel da fonte ganha `bold` pixels a mais para a direita.
    for (const [px, py] of g.pixels)
      for (let j = 0; j < scale; j++)
        for (let k = 0; k < scale + bold; k++) on[py * scale + j + dy]![px * scale + k + x] = true;
    for (let c = x; c < x + g.width * scale + (i < glyphs.length - 1 ? gap : 0); c++)
      columnLift[c] = rise * i;
    x += g.width * scale + gap;
  });
  return { on, width, height, columnLift };
}

/**
 * Pinta uma máscara com o estilo: brilho na borda de cima, sombra na de baixo, contorno de 1
 * pixel em volta (inclusive nas diagonais) e `drop` pixels de sombra dura abaixo.
 */
function inkMask(on: boolean[][], style: LogoInkStyle, drop: number): Cells {
  const h = on.length;
  const w = on[0]!.length;
  const out = blank(w + 2, h + 2 + drop);
  const at = (x: number, y: number) => on[y]?.[x] === true;
  for (let y = -1; y <= h + drop; y++)
    for (let x = -1; x <= w; x++) {
      if (at(x, y)) continue;
      let near = false;
      for (let j = -1 - drop; j <= 1; j++)
        for (let i = -1; i <= 1; i++) if (at(x + i, y + j) && (j >= -1 || i === 0)) near = true;
      if (near) out[y + 1]![x + 1] = style.outline;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      out[y + 1]![x + 1] = !at(x, y - 1) ? style.light : !at(x, y + 1) ? style.dark : style.fill;
    }
  return out;
}

export interface LogoLineOptions {
  style: keyof typeof LOGO.styles;
  /** Pixels de arte por pixel da fonte: 2 na logo grande, 1 na versão pequena. */
  scale: number;
  /** Quanto cada letra sobe em relação à anterior (a inclinação da logo empilhada). */
  rise?: number;
  /** Faixa vermelha atrás do texto, como na tela de título. */
  banner?: boolean;
  drop?: number;
  /** Pixels extras de espessura nos traços verticais. */
  bold?: number;
}

/** Uma linha do nome já pintada, com contorno e sombra (e a faixa, se pedir). */
export function logoLine(text: string, opts: LogoLineOptions): string[] {
  const rise = opts.rise ?? 0;
  const drop = opts.drop ?? opts.scale;
  const mask = textMask(text, opts.scale, rise, opts.bold ?? 0);
  const letters = inkMask(mask.on, LOGO.styles[opts.style], drop);
  if (!opts.banner) return toRows(letters);

  // Faixa: retângulo em degraus que sobe junto com as letras, com cortes em V nas pontas.
  const padX = 3 * opts.scale;
  const padY = 2 * opts.scale;
  const notch = 2 * opts.scale;
  const bw = mask.width + 2 * padX;
  const lift = rise * (text.length - 1);
  const bh = mask.height - lift + 2 * padY;
  const on = Array.from({ length: bh + lift }, () => Array<boolean>(bw).fill(false));
  for (let x = 0; x < bw; x++) {
    const col = Math.min(mask.width - 1, Math.max(0, x - padX));
    const y0 = lift - mask.columnLift[col]!;
    const fromEnd = Math.min(x, bw - 1 - x);
    for (let y = 0; y < bh; y++) {
      const mid = Math.abs(y - (bh - 1) / 2);
      if (fromEnd < notch && mid < notch - fromEnd) continue;
      on[y0 + y]![x] = true;
    }
  }
  const band = inkMask(on, LOGO.styles.banner, drop);
  const out = blank(band[0]!.length, Math.max(band.length, letters.length + padY));
  stamp(out, band, 0, 0);
  stamp(out, letters, padX, padY);
  return toRows(out);
}

/** Tamanho grande do nome: fonte em 2× com traço de 3 pixels. */
const BIG = { scale: 2, bold: 1 } as const;

/**
 * Logo principal: o nome em duas linhas inclinadas, a primeira na faixa vermelha, e o emblema
 * de 16 no espaço que sobra à esquerda da segunda linha.
 */
export function logoStacked(): string[] {
  const [first = '', second = ''] = LOGO.name;
  const top = logoLine(first, { ...BIG, style: 'orange', rise: 1, banner: true });
  const bottom = logoLine(second, { ...BIG, style: 'green', rise: 1 });
  const emblem = LOGO.emblem['32'];
  const topW = top[0]!.length;
  const bottomW = bottom[0]!.length;
  // A segunda linha encosta à direita; o emblema ocupa o canto livre e invade a faixa.
  const indent = Math.max(emblem.length + 2, topW - bottomW - 2);
  const y2 = top.length - 8;
  const ey = top.length - 9;
  const width = Math.max(topW, indent + bottomW);
  const out = blank(width, Math.max(y2 + bottom.length, ey + emblem.length));
  stamp(out, top, 0, 0);
  stamp(out, emblem, 0, ey);
  stamp(out, bottom, indent, y2);
  return toRows(out);
}

/** Logo horizontal: emblema de 16 e o nome numa linha só, sem faixa nem inclinação. */
export function logoHorizontal(): string[] {
  const [first = '', second = ''] = LOGO.name;
  const a = logoLine(first, { ...BIG, style: 'orange' });
  const b = logoLine(second, { ...BIG, style: 'green' });
  const emblem = LOGO.emblem['16'];
  const h = Math.max(emblem.length, a.length, b.length);
  const gap = 4;
  const ax = emblem[0]!.length + gap;
  const bx = ax + a[0]!.length + gap;
  const out = blank(bx + b[0]!.length, h);
  const textY = Math.floor((h - a.length) / 2);
  stamp(out, emblem, 0, Math.floor((h - emblem.length) / 2));
  stamp(out, a, ax, textY);
  stamp(out, b, bx, textY);
  return toRows(out);
}

/** Versão pequena: fonte em 1×, legível com 9 pixels de altura. */
export function logoSmall(): string[] {
  const [first = '', second = ''] = LOGO.name;
  const a = logoLine(first, { style: 'orange', scale: 1 });
  const b = logoLine(second, { style: 'green', scale: 1 });
  const gap = 2;
  const out = blank(a[0]!.length + gap + b[0]!.length, Math.max(a.length, b.length));
  stamp(out, a, 0, 0);
  stamp(out, b, a[0]!.length + gap, 0);
  return toRows(out);
}

/**
 * Cor de uma letra da grade na variante. Nas monocromáticas tudo vira uma tinta só, menos o
 * contorno e a sombra (que somem, e a costura da cápsula vira um vão) e o miolo da faixa, que fica
 * vazado dentro do contorno dela (letra `q`).
 */
function variantColor(c: string, variant: LogoVariant): string | undefined {
  if (variant === 'color') return LOGO.palette[c];
  if (MONO_HOLES.has(c)) return undefined;
  return variant === 'monoCream' ? LOGO.inks.cream : LOGO.inks.night;
}

const MONO_HOLES = new Set([
  'k',
  'd',
  LOGO.styles.banner.fill,
  LOGO.styles.banner.light,
  LOGO.styles.banner.dark,
]);

/** Pinta uma grade da logo com `scale` pixels por pixel de arte, a partir de (x, y). */
export function paintLogoGrid(
  p: Painter,
  rows: PixelGrid,
  scale: number,
  variant: LogoVariant = 'color',
  x = 0,
  y = 0,
): Size {
  rows.forEach((row, j) => {
    [...row].forEach((c, i) => {
      const color = variantColor(c, variant);
      if (!color) return;
      p.fillStyle(paletteColor(color)).fillRect(x + i * scale, y + j * scale, scale, scale);
    });
  });
  return { width: (rows[0]?.length ?? 0) * scale, height: rows.length * scale };
}

/** Disco em blocos de `unit` pixels, com `d` blocos de diâmetro, centrado em (cx, cy). */
function chunkyDisc(p: Painter, cx: number, cy: number, d: number, unit: number, color: string) {
  const r = d / 2;
  p.fillStyle(paletteColor(color));
  for (let j = 0; j < d; j++) {
    const dy = j + 0.5 - r;
    const w = 2 * Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    if (w > 0) p.fillRect(cx - (w / 2) * unit, cy - r * unit + j * unit, w * unit, unit);
  }
}

/** Átomo solto da decoração: contorno, miolo e brilho, em blocos de `unit`. */
function paintAtom(p: Painter, cx: number, cy: number, d: number, unit: number, fill: string) {
  chunkyDisc(p, cx, cy, d + 2, unit, LOGO.palette.k!);
  chunkyDisc(p, cx, cy, d, unit, fill);
  p.fillStyle(paletteColor(LOGO.palette.W!));
  p.fillRect(cx - Math.ceil(d / 4) * unit, cy - Math.ceil(d / 4) * unit, unit, unit);
}

/** Retângulo com cantos em degraus de `unit` pixels (`steps` degraus). */
function steppedRect(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  unit: number,
  steps: number,
  color: string,
) {
  p.fillStyle(paletteColor(color));
  for (let i = 0; i < steps; i++) {
    const inset = (steps - i) * unit;
    p.fillRect(x + inset, y + i * unit, w - 2 * inset, unit);
    p.fillRect(x + inset, y + h - (i + 1) * unit, w - 2 * inset, unit);
  }
  p.fillRect(x, y + steps * unit, w, h - 2 * steps * unit);
}

/**
 * Ícone do app (`any`): o emblema de 32 numa placa com moldura de madeira, como os espaços de
 * ícone do jogo. `size` múltiplo de 64.
 */
export function paintAppIcon(p: Painter, size: number): Size {
  const u = size / 64;
  const pal = LOGO.palette;
  steppedRect(p, 0, 0, size, size, u, 3, pal.k!);
  steppedRect(p, u, u, size - 2 * u, size - 2 * u, u, 2, pal.m!);
  steppedRect(p, u, 2 * u, size - 2 * u, size - 3 * u, u, 2, pal.M!);
  steppedRect(p, 2 * u, 3 * u, size - 4 * u, size - 5 * u, u, 2, pal.w!);
  steppedRect(p, 4 * u, 4 * u, size - 8 * u, size - 8 * u, u, 1, pal.k!);
  p.fillStyle(paletteColor(pal.n!)).fillRect(5 * u, 5 * u, size - 10 * u, size - 10 * u);
  const s = Math.floor(((size - 10 * u) / 32) * 0.9);
  const off = (size - 32 * s) / 2;
  chunkyDisc(p, size / 2, size / 2, 26, s, LOGO.palette.p!);
  paintLogoGrid(p, LOGO.emblem['32'], s, 'color', off, off);
  return { width: size, height: size };
}

/**
 * Ícone sem moldura e sem transparência: `maskable` do PWA e o ícone do iOS, que cortam as
 * bordas. O emblema fica dentro do círculo seguro (80% do lado).
 */
export function paintMaskableIcon(p: Painter, size: number): Size {
  const pal = LOGO.palette;
  p.fillStyle(paletteColor(pal.n!)).fillRect(0, 0, size, size);
  const s = Math.floor((size * 0.56) / 32);
  const off = Math.round((size - 32 * s) / 2);
  chunkyDisc(p, size / 2, size / 2, 30, s, pal.p!);
  paintLogoGrid(p, LOGO.emblem['32'], s, 'color', off, off);
  return { width: size, height: size };
}

/** Favicon: o emblema de 16 com fundo transparente. */
export function paintFavicon(p: Painter, size: number): Size {
  return paintLogoGrid(p, LOGO.emblem['16'], size / 16);
}

/** Átomos e brilhos espalhados das artes de loja, em fração da largura e da altura. */
const DECOR: readonly [number, number, number, string][] = [
  [0.07, 0.18, 5, 'R'],
  [0.15, 0.78, 4, 'B'],
  [0.9, 0.16, 4, 'B'],
  [0.94, 0.72, 6, 'R'],
  [0.82, 0.88, 3, 'G'],
  [0.24, 0.1, 3, 'G'],
  [0.05, 0.5, 3, 'O'],
  [0.7, 0.07, 3, 'O'],
];

/**
 * Arte de loja: fundo noite com átomos soltos e a logo empilhada no centro, em blocos inteiros.
 * Serve para o banner (1024×500) e para a tela de abertura em pé (1080×1920).
 */
export function paintStoreArt(p: Painter, width: number, height: number): Size {
  const pal = LOGO.palette;
  p.fillStyle(paletteColor(pal.n!)).fillRect(0, 0, width, height);
  const logo = logoStacked();
  const scale = Math.floor(Math.min((width * 0.7) / logo[0]!.length, (height * 0.6) / logo.length));
  const unit = Math.max(2, Math.floor(scale / 2));
  // Pontilhado discreto, como o fundo dos painéis.
  p.fillStyle(paletteColor(pal.p!));
  for (let y = unit * 4; y < height; y += unit * 12)
    for (let x = ((y / (unit * 12)) % 2) * unit * 6 + unit * 3; x < width; x += unit * 12)
      p.fillRect(x, y, unit, unit);
  for (const [fx, fy, d, color] of DECOR)
    paintAtom(p, Math.round(fx * width), Math.round(fy * height), d, scale, pal[color]!);
  const x = Math.round((width - logo[0]!.length * scale) / 2);
  const y = Math.round((height - logo.length * scale) / 2);
  paintLogoGrid(p, logo, scale, 'color', x, y);
  return { width, height };
}
