import { describe, expect, it } from 'vitest';
import { LOGO } from '../../assets/sprites';
import { logoHorizontal, logoLine, logoSmall, logoStacked } from './logoArt';

const rectangular = (rows: readonly string[]) => rows.every((r) => r.length === rows[0]!.length);
const unknownColors = (rows: readonly string[]) =>
  [...new Set(rows.join(''))].filter((c) => c !== '.' && !LOGO.palette[c]);

describe('logo', () => {
  it('emblemas têm o tamanho certo e só cores da paleta', () => {
    for (const size of ['32', '16'] as const) {
      const rows = LOGO.emblem[size];
      expect(rows.length, size).toBe(Number(size));
      expect(
        rows.every((r) => r.length === Number(size)),
        size,
      ).toBe(true);
      expect(unknownColors(rows), size).toEqual([]);
    }
  });

  it('a fonte tem letras com a altura certa e acentos que existem', () => {
    for (const [ch, rows] of Object.entries(LOGO.font.glyphs)) {
      expect(rows.length, ch).toBe(LOGO.font.height);
      expect(rectangular(rows), ch).toBe(true);
    }
    for (const [ch, [base, mark]] of Object.entries(LOGO.font.accented)) {
      expect(LOGO.font.glyphs[base], ch).toBeDefined();
      expect(LOGO.font.marks[mark], ch).toBeDefined();
    }
  });

  it('as variantes saem retangulares e só com cores da paleta', () => {
    for (const rows of [logoStacked(), logoHorizontal(), logoSmall()]) {
      expect(rectangular(rows)).toBe(true);
      expect(unknownColors(rows)).toEqual([]);
    }
  });

  it('acento deixa a linha mais alta, sem mudar a largura', () => {
    const plain = logoLine('FARMACO', { style: 'orange', scale: 2, bold: 1, banner: true });
    const accented = logoLine('FÁRMACO', { style: 'orange', scale: 2, bold: 1, banner: true });
    expect(accented[0]!.length).toBe(plain[0]!.length);
    expect(accented.length).toBe(plain.length + 6);
  });
});
