import type * as Phaser from 'phaser';
import { PALETTE } from './palette';

/**
 * Sprites de molécula montados com átomos e ligações (aba Design): cada átomo é um círculo
 * pixelado com contorno escuro e um ponto de brilho; ligações são barras escuras entre os
 * centros. As moléculas são versões simplificadas das reais, com só alguns hidrogênios.
 */
export type Element = 'C' | 'H' | 'O' | 'N';

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
} as const;

const BOND = 7;

/** Pontos de um hexágono "em pé" com centro (cx, cy). */
function hexagon(cx: number, cy: number, r = BOND): { x: number; y: number }[] {
  return Array.from({ length: 6 }, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

function ring(cx: number, cy: number, elements: Element[]): MoleculeDef {
  const atoms = hexagon(cx, cy).map((p, i) => ({ el: elements[i] ?? 'C', ...p }));
  const bonds: MoleculeDef['bonds'] = atoms.map((_, i) => [i, (i + 1) % 6]);
  return { atoms, bonds };
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

/** Radical hidroxila (OH•), o projétil do Radical Livre. */
function hydroxyl(): MoleculeDef {
  const m: MoleculeDef = { atoms: [{ el: 'O', x: 0, y: 0 }], bonds: [] };
  attach(m, 0, 'H', -45);
  return m;
}

export const MOLECULES = { dopamine, glucose, fattyAcid, triglyceride, hydroxyl } as const;

/** Desenha um círculo pixelado de diâmetro `d` com canto superior esquerdo em (x, y). */
function pixelCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, d: number) {
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

/** Gera a textura `key` a partir da molécula. Devolve o tamanho gerado. */
export function createMoleculeTexture(
  scene: Phaser.Scene,
  key: string,
  def: MoleculeDef,
): { width: number; height: number } {
  const pad = 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const a of def.atoms) {
    const r = ELEMENT[a.el].size / 2;
    minX = Math.min(minX, a.x - r);
    minY = Math.min(minY, a.y - r);
    maxX = Math.max(maxX, a.x + r);
    maxY = Math.max(maxY, a.y + r);
  }
  const ox = Math.ceil(-minX) + pad;
  const oy = Math.ceil(-minY) + pad;
  const width = Math.ceil(maxX - minX) + pad * 2 + 1;
  const height = Math.ceil(maxY - minY) + pad * 2 + 1;

  const g = scene.make.graphics({}, false);
  g.fillStyle(PALETTE.outline);
  for (const [a, b, order] of def.bonds) {
    const p = def.atoms[a]!;
    const q = def.atoms[b]!;
    if (order === 2) {
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      const nx = (-(q.y - p.y) / len) * 1.5;
      const ny = ((q.x - p.x) / len) * 1.5;
      pixelLine(g, p.x + ox + nx, p.y + oy + ny, q.x + ox + nx, q.y + oy + ny, 1);
      pixelLine(g, p.x + ox - nx, p.y + oy - ny, q.x + ox - nx, q.y + oy - ny, 1);
    } else {
      pixelLine(g, p.x + ox, p.y + oy, q.x + ox, q.y + oy, 2);
    }
  }

  // De trás para a frente: átomos mais abaixo ficam por cima.
  for (const a of [...def.atoms].sort((p, q) => p.y - q.y)) {
    const { color, size } = ELEMENT[a.el];
    const x = Math.round(a.x + ox - size / 2);
    const y = Math.round(a.y + oy - size / 2);
    g.fillStyle(PALETTE.outline);
    pixelCircle(g, x, y, size);
    g.fillStyle(color);
    pixelCircle(g, x + 1, y + 1, size - 2);
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(
      x + Math.floor(size / 3),
      y + Math.floor(size / 4),
      size > 6 ? 2 : 1,
      size > 6 ? 2 : 1,
    );
  }

  g.generateTexture(key, width, height);
  g.destroy();
  return { width, height };
}
