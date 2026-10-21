import { describe, expect, it } from 'vitest';
import { AGENTS, ENEMIES, IDLE, META, PASSIVES, WEAPONS } from '../../config';
import { ELEMENTS, ICON_PALETTE, ICON_SIZE, ICONS, MOLECULES, UI_SPRITES, type PixelGrid } from '.';

function badPixels(grid: PixelGrid, size: number, colors: Record<string, unknown>): string[] {
  const problems: string[] = [];
  if (grid.length !== size) problems.push(`${grid.length} linhas`);
  grid.forEach((row, y) => {
    if (row.length !== size) problems.push(`linha ${y} com ${row.length} pixels`);
    for (const c of row) if (c !== '.' && !(c in colors)) problems.push(`cor "${c}" na linha ${y}`);
  });
  return problems;
}

describe('sprites', () => {
  it('toda arma tem ícone', () => {
    const missing = Object.keys(WEAPONS).filter((id) => !ICONS.weapons[id]);
    expect(missing).toEqual([]);
  });

  it('todo modificador tem ícone', () => {
    const missing = Object.keys(PASSIVES).filter((id) => !ICONS.passives[id]);
    expect(missing).toEqual([]);
  });

  it('todo especial de agente tem ícone', () => {
    const missing = Object.values(AGENTS)
      .map((a) => a.special.kind)
      .filter((kind) => !ICONS.specials[kind]);
    expect(missing).toEqual([]);
  });

  it('todo nó do Laboratório tem ícone (modificador do mesmo atributo, stats ou especial)', () => {
    const missing = Object.entries(META.lab.nodes)
      .filter(([, n]) => !n.stat.startsWith('special.'))
      .filter(([, n]) => !Object.values(PASSIVES).some((p) => p.stat === n.stat))
      .filter(([, n]) => !ICONS.stats[n.stat])
      .map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it('ícones têm 16×16 pixels e só cores da paleta', () => {
    for (const [group, icons] of Object.entries(ICONS)) {
      for (const [id, grid] of Object.entries(icons)) {
        expect(badPixels(grid, ICON_SIZE, ICON_PALETTE), `${group}/${id}`).toEqual([]);
      }
    }
  });

  it('ícones do menu têm 8×8 pixels', () => {
    for (const [id, grid] of Object.entries(UI_SPRITES.icons)) {
      expect(badPixels(grid, 8, { o: 1 }), id).toEqual([]);
    }
  });

  it('todo agente (run e idle) e toda molécula inimiga têm sprite', () => {
    const ids = [...Object.keys(AGENTS), ...Object.keys(ENEMIES), ...Object.keys(IDLE.agents)];
    expect(ids.filter((id) => !MOLECULES[id])).toEqual([]);
  });

  it('moléculas só usam elementos conhecidos e ligam átomos que existem', () => {
    for (const [id, m] of Object.entries(MOLECULES)) {
      for (const [el] of m.atoms) expect(ELEMENTS[el], `${id}: ${el}`).toBeDefined();
      for (const [a, b] of m.bonds) {
        expect(m.atoms[a] && m.atoms[b], `${id}: ligação ${a}-${b}`).toBeTruthy();
      }
    }
  });
});
