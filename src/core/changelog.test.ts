import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseChangelog } from './changelog';

describe('parseChangelog', () => {
  it('separa versões, seções e itens', () => {
    const text = [
      '# Novidades',
      'Texto do topo, ignorado.',
      '## v0.2.0 · 21/10/2026',
      'Inclui a v0.1.',
      '### Novidades',
      '- Run jogável.',
      '- Menu.',
      '### Correções',
      '- Um bug.',
      '## v0.1.0',
      '### Ajustes',
      '- Algo.',
    ].join('\n');
    expect(parseChangelog(text)).toEqual([
      {
        title: 'v0.2.0 · 21/10/2026',
        intro: ['Inclui a v0.1.'],
        sections: [
          { name: 'Novidades', items: ['Run jogável.', 'Menu.'] },
          { name: 'Correções', items: ['Um bug.'] },
        ],
      },
      { title: 'v0.1.0', intro: [], sections: [{ name: 'Ajustes', items: ['Algo.'] }] },
    ]);
  });

  it('o CHANGELOG.md do repositório tem versões com itens', () => {
    const versions = parseChangelog(readFileSync('CHANGELOG.md', 'utf8'));
    expect(versions.length).toBeGreaterThan(5);
    for (const v of versions) {
      expect(v.sections.reduce((n, s) => n + s.items.length, 0)).toBeGreaterThan(0);
    }
  });
});
