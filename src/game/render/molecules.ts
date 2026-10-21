import type * as Phaser from 'phaser';
import { PALETTE } from './palette';

/**
 * Sprites de molécula montados com átomos e ligações (aba Design): cada átomo é um círculo
 * pixelado com contorno escuro, sombra em meia-lua e um ponto de brilho; ligações são barras
 * escuras entre os centros. As moléculas são versões simplificadas das reais.
 *
 * As coordenadas e tamanhos estão em unidades do mundo; o desenho multiplica tudo por `detail`
 * (pixels de arte por unidade, decisão 0009), então o mesmo sprite sai com mais pixels sem
 * mudar de tamanho no mundo.
 */
export type Element = 'C' | 'H' | 'O' | 'N' | 'S';

export interface Atom {
  el: Element;
  x: number;
  y: number;
}

export interface MoleculeDef {
  atoms: Atom[];
  /** Pares de índices de átomos; o terceiro valor 2 desenha ligação dupla. */
  bonds: [number, number, (1 | 2)?][];
}

const ELEMENT = {
  C: { color: PALETTE.carbon, size: 9 },
  H: { color: PALETTE.hydrogen, size: 6 },
  O: { color: PALETTE.oxygen, size: 9 },
  N: { color: PALETTE.nitrogen, size: 9 },
  S: { color: PALETTE.sulfur, size: 10 },
} as const;

const BOND = 7;

/** Pontos de um polígono regular "em pé" (hexágono por padrão) com centro (cx, cy). */
function polygon(cx: number, cy: number, sides = 6, r = BOND): { x: number; y: number }[] {
  return Array.from({ length: sides }, (_, k) => {
    const a = ((-90 + (360 / sides) * k) * Math.PI) / 180;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

function ring(cx: number, cy: number, elements: Element[], sides = 6): MoleculeDef {
  const atoms = polygon(cx, cy, sides).map((p, i) => ({ el: elements[i] ?? 'C', ...p }));
  const bonds: MoleculeDef['bonds'] = atoms.map((_, i) => [i, (i + 1) % sides]);
  return { atoms, bonds };
}

/** Junta outra molécula, deslocada, e liga um átomo de cada (índices locais). */
function merge(
  m: MoleculeDef,
  other: MoleculeDef,
  dx: number,
  dy: number,
  link?: [number, number],
) {
  const offset = m.atoms.length;
  for (const a of other.atoms) m.atoms.push({ ...a, x: a.x + dx, y: a.y + dy });
  for (const [a, b, o] of other.bonds) m.bonds.push([a + offset, b + offset, o]);
  if (link) m.bonds.push([link[0], link[1] + offset]);
  return offset;
}

/** Acrescenta um átomo ligado a outro, na direção do ângulo em graus. */
function attach(m: MoleculeDef, from: number, el: Element, angleDeg: number, order: 1 | 2 = 1) {
  const a = (angleDeg * Math.PI) / 180;
  const base = m.atoms[from]!;
  const len = el === 'H' ? BOND * 0.8 : BOND;
  m.atoms.push({ el, x: base.x + Math.cos(a) * len, y: base.y + Math.sin(a) * len });
  m.bonds.push([from, m.atoms.length - 1, order]);
  return m.atoms.length - 1;
}

/** Dopamina: anel benzênico com duas hidroxilas e a cadeia etilamina. */
function dopamine(): MoleculeDef {
  const m = ring(0, 0, ['C', 'C', 'C', 'C', 'C', 'C']);
  attach(m, 4, 'O', 210);
  attach(m, 5, 'O', 150);
  const c1 = attach(m, 1, 'C', -30);
  const c2 = attach(m, c1, 'C', 30);
  const n = attach(m, c2, 'N', -30);
  attach(m, n, 'H', 20);
  return m;
}

/** Glicose: anel de piranose (5 C e 1 O) com uma hidroxila. */
function glucose(): MoleculeDef {
  const m = ring(0, 0, ['O', 'C', 'C', 'C', 'C', 'C']);
  attach(m, 3, 'O', 90);
  attach(m, 5, 'H', 210);
  return m;
}

/** Ácido graxo: cadeia em zigue-zague terminando em carboxila. */
function fattyAcid(): MoleculeDef {
  const m: MoleculeDef = { atoms: [{ el: 'C', x: 0, y: 0 }], bonds: [] };
  let last = 0;
  for (let i = 0; i < 4; i++) last = attach(m, last, 'C', i % 2 === 0 ? -30 : 30);
  attach(m, last, 'O', -30, 2);
  attach(m, last, 'O', 60);
  attach(m, 0, 'H', 180);
  return m;
}

/** Triglicerídeo: espinha de glicerol com três cadeias curtas. */
function triglyceride(): MoleculeDef {
  const m: MoleculeDef = {
    atoms: [
      { el: 'C', x: 0, y: -BOND },
      { el: 'C', x: 0, y: 0 },
      { el: 'C', x: 0, y: BOND },
    ],
    bonds: [
      [0, 1],
      [1, 2],
    ],
  };
  for (const [i, dy] of [
    [0, -1],
    [1, 0],
    [2, 1],
  ] as const) {
    const o = attach(m, i, 'O', dy * 25);
    let c = attach(m, o, 'C', 0);
    attach(m, c, 'O', -90 + dy * 30, 2);
    c = attach(m, c, 'C', 20);
    attach(m, c, 'C', -20);
  }
  return m;
}

/** Frutose: anel de furanose (4 C e 1 O) com uma hidroxila. */
function fructose(): MoleculeDef {
  const m = ring(0, 0, ['O', 'C', 'C', 'C', 'C'], 5);
  attach(m, 2, 'O', 20);
  return m;
}

/** Maltose: duas glicoses ligadas por um oxigênio. */
function maltose(): MoleculeDef {
  const m = ring(-11, 0, ['O', 'C', 'C', 'C', 'C', 'C']);
  const o = attach(m, 2, 'O', 30);
  merge(m, ring(11, 0, ['O', 'C', 'C', 'C', 'C', 'C']), 0, 0, [o, 5]);
  return m;
}

/** Sacarose: glicose (hexágono) e frutose (pentágono) ligadas por um oxigênio. */
function sucrose(): MoleculeDef {
  const m = ring(-11, 0, ['O', 'C', 'C', 'C', 'C', 'C']);
  const o = attach(m, 2, 'O', 30);
  merge(m, ring(10, 2, ['O', 'C', 'C', 'C', 'C'], 5), 0, 0, [o, 4]);
  return m;
}

/** Amido: cadeia de três anéis de glicose. */
function starch(): MoleculeDef {
  const m = ring(-22, 0, ['O', 'C', 'C', 'C', 'C', 'C']);
  let o = attach(m, 2, 'O', 30);
  const mid = merge(m, ring(0, 0, ['O', 'C', 'C', 'C', 'C', 'C']), 0, 0, [o, 5]);
  o = attach(m, mid + 2, 'O', 30);
  merge(m, ring(22, 0, ['O', 'C', 'C', 'C', 'C', 'C']), 0, 0, [o, 5]);
  return m;
}

/** Glicerol: três carbonos, cada um com uma hidroxila. */
function glycerol(): MoleculeDef {
  const m: MoleculeDef = {
    atoms: [
      { el: 'C', x: 0, y: -BOND },
      { el: 'C', x: 0, y: 0 },
      { el: 'C', x: 0, y: BOND },
    ],
    bonds: [
      [0, 1],
      [1, 2],
    ],
  };
  attach(m, 0, 'O', -30);
  attach(m, 1, 'O', 180);
  attach(m, 2, 'O', 30);
  return m;
}

/** Partícula de LDL (chefe): casca de fosfolipídios em volta de um núcleo de colesterol. */
function ldl(): MoleculeDef {
  const shell = polygon(0, 0, 12, 20).map((p, i) => ({
    el: (i % 3 === 0 ? 'N' : i % 2 ? 'O' : 'C') as Element,
    ...p,
  }));
  const m: MoleculeDef = { atoms: shell, bonds: shell.map((_, i) => [i, (i + 1) % 12]) };
  merge(m, ring(0, 0, ['C', 'C', 'C', 'C', 'C', 'C']), 0, 0);
  const core = m.atoms.length;
  m.atoms.push({ el: 'O', x: 0, y: 0 });
  m.bonds.push([core - 6, core]);
  return m;
}

/** Lipase (enzima): trecho de cadeia de proteína, N–C–C(=O) repetido. */
function lipase(): MoleculeDef {
  const m: MoleculeDef = { atoms: [{ el: 'N', x: -24, y: 0 }], bonds: [] };
  let last = 0;
  for (let i = 0; i < 3; i++) {
    const ca = attach(m, last, 'C', -30);
    const c = attach(m, ca, 'C', 30);
    attach(m, c, 'O', 90, 2);
    if (i < 2) last = attach(m, c, 'N', -30);
  }
  attach(m, 0, 'H', 210);
  return m;
}

/** Insulina: duas cadeias (A e B) presas por pontes de enxofre. */
function insulin(): MoleculeDef {
  const m: MoleculeDef = { atoms: [], bonds: [] };
  const chain = (y: number, el: Element) => {
    const start = m.atoms.length;
    for (let i = 0; i < 4; i++) {
      m.atoms.push({ el: i === 0 ? el : 'C', x: -16 + i * 11, y: y + (i % 2 ? 3 : -3) });
      if (i > 0) m.bonds.push([start + i - 1, start + i]);
    }
    return start;
  };
  const a = chain(-10, 'N');
  const b = chain(10, 'N');
  for (const i of [1, 3]) {
    const sa = m.atoms.length;
    m.atoms.push({ el: 'S', x: m.atoms[a + i]!.x, y: -2 });
    m.atoms.push({ el: 'S', x: m.atoms[b + i]!.x, y: 4 });
    m.bonds.push([a + i, sa], [sa, sa + 1], [sa + 1, b + i]);
  }
  return m;
}

/** Superóxido (O₂•⁻), o projétil da Reação em Cadeia. */
function superoxide(): MoleculeDef {
  const m: MoleculeDef = { atoms: [{ el: 'O', x: 0, y: 0 }], bonds: [] };
  attach(m, 0, 'O', 0);
  return m;
}

/** Radical hidroxila (OH•), o projétil do Radical Livre. */
function hydroxyl(): MoleculeDef {
  const m: MoleculeDef = { atoms: [{ el: 'O', x: 0, y: 0 }], bonds: [] };
  attach(m, 0, 'H', -45);
  return m;
}

export const MOLECULES = {
  dopamine,
  lipase,
  insulin,
  glucose,
  fructose,
  maltose,
  sucrose,
  starch,
  glycerol,
  fattyAcid,
  triglyceride,
  ldl,
  hydroxyl,
  superoxide,
} as const;

/** Escurece uma cor RGB pelo fator (0 a 1). */
export function shade(color: number, factor: number): number {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/** Desenha um círculo pixelado de diâmetro `d` com canto superior esquerdo em (x, y). */
export function pixelCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, d: number) {
  const r = d / 2;
  for (let row = 0; row < d; row++) {
    const dy = row + 0.5 - r;
    const w = Math.round(2 * Math.sqrt(Math.max(0, r * r - dy * dy)));
    if (w > 0) g.fillRect(x + Math.round(r - w / 2), y + row, w, 1);
  }
}

/** Linha grossa feita de quadrados, para continuar pixelada. */
function pixelLine(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
) {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + (x1 - x0) * t - thickness / 2);
    const y = Math.round(y0 + (y1 - y0) * t - thickness / 2);
    g.fillRect(x, y, thickness, thickness);
  }
}

/**
 * Átomo pixelado: contorno escuro, corpo na cor do elemento com sombra em meia-lua embaixo à
 * direita e um brilho no canto superior esquerdo.
 */
function drawAtom(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  outline: number,
) {
  g.fillStyle(PALETTE.outline);
  pixelCircle(g, x, y, size);
  const inner = size - outline * 2;
  g.fillStyle(shade(color, 0.7));
  pixelCircle(g, x + outline, y + outline, inner);
  const lit = Math.round(inner * 0.8);
  g.fillStyle(color);
  pixelCircle(g, x + outline, y + outline, lit);
  const spot = Math.max(1, Math.round(size / 7));
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(
    x + outline + Math.round(inner * 0.22),
    y + outline + Math.round(inner * 0.2),
    spot,
    spot,
  );
}

/**
 * Gera a textura `key` a partir da molécula, com `detail` pixels de arte por unidade do mundo.
 * Mostre o sprite com escala `1 / detail` para ele ter o tamanho certo no mundo.
 */
export function createMoleculeTexture(
  scene: Phaser.Scene,
  key: string,
  def: MoleculeDef,
  detail: number,
): void {
  const pad = detail * 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const a of def.atoms) {
    const r = (ELEMENT[a.el].size * detail) / 2;
    minX = Math.min(minX, a.x * detail - r);
    minY = Math.min(minY, a.y * detail - r);
    maxX = Math.max(maxX, a.x * detail + r);
    maxY = Math.max(maxY, a.y * detail + r);
  }
  // Centro da textura no centro geométrico da molécula, para o sprite girar e alinhar certo.
  const halfW = Math.ceil(Math.max(-minX, maxX)) + pad;
  const halfH = Math.ceil(Math.max(-minY, maxY)) + pad;
  const at = (v: number, half: number) => v * detail + half;

  const g = scene.make.graphics({}, false);
  const bond = Math.max(2, Math.round(1.7 * detail));
  const thin = Math.max(1, Math.round(0.7 * detail));
  g.fillStyle(PALETTE.outline);
  for (const [a, b, order] of def.bonds) {
    const p = def.atoms[a]!;
    const q = def.atoms[b]!;
    const [px, py, qx, qy] = [at(p.x, halfW), at(p.y, halfH), at(q.x, halfW), at(q.y, halfH)];
    if (order === 2) {
      const len = Math.hypot(qx - px, qy - py);
      const nx = (-(qy - py) / len) * 1.2 * detail;
      const ny = ((qx - px) / len) * 1.2 * detail;
      pixelLine(g, px + nx, py + ny, qx + nx, qy + ny, thin);
      pixelLine(g, px - nx, py - ny, qx - nx, qy - ny, thin);
    } else {
      pixelLine(g, px, py, qx, qy, bond);
    }
  }

  // De trás para a frente: átomos mais abaixo ficam por cima.
  for (const a of [...def.atoms].sort((p, q) => p.y - q.y)) {
    const { color, size } = ELEMENT[a.el];
    const d = size * detail;
    drawAtom(
      g,
      Math.round(at(a.x, halfW) - d / 2),
      Math.round(at(a.y, halfH) - d / 2),
      d,
      color,
      detail,
    );
  }

  g.generateTexture(key, halfW * 2, halfH * 2);
  g.destroy();
}
