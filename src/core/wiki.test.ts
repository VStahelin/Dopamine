import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseWiki, plainText } from './wiki';

describe('wiki no Compêndio (fase 6)', () => {
  it('tira links, negrito e código', () => {
    expect(plainText('Veja **isto** em [itens](itens.md) e `run.json`.')).toBe(
      'Veja isto em itens e run.json.',
    );
  });

  it('páginas, nota sem "Números de", listas e tabelas', () => {
    const pages = parseWiki(
      [
        '# Wiki',
        '> aviso para quem programa',
        '## Página',
        '*Números de `meta.json`. O Compêndio mostra cada item.*',
        '### Verbete',
        'Texto com **negrito**.',
        '- **Item:** um item.',
        '| Nome | Meta | Prêmio |',
        '| --- | --- | --- |',
        '| A | 100 | +50 ATP |',
      ].join('\n'),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.note).toBe('O Compêndio mostra cada item.');
    expect(pages[0]!.entries[0]!.lines).toEqual([
      'Texto com negrito.',
      '· Item: um item.',
      '· A: 100 · +50 ATP',
    ]);
  });

  it('o docs/wiki.md do repositório vira páginas sem marcação sobrando', () => {
    const pages = parseWiki(readFileSync('docs/wiki.md', 'utf8'));
    expect(pages.length).toBeGreaterThan(8);
    for (const p of pages) {
      for (const e of p.entries) {
        for (const l of e.lines) expect(l).not.toMatch(/\]\(|\*\*|`/);
      }
    }
  });
});
