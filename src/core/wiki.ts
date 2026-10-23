/** Uma página da wiki (`## ` do docs/wiki.md): título, nota e os verbetes (`### `). */
export interface WikiPage {
  title: string;
  /** Linha em itálico do começo da página, sem a parte "Números de ..." para quem programa. */
  note: string | null;
  intro: string[];
  entries: { title: string; lines: string[] }[];
}

/** Tira a marcação que o jogo não desenha: links, negrito, itálico e código. */
export function plainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(^|\s)\*([^*]+)\*(?=\s|$|[.,;:])/g, '$1$2')
    .trim();
}

/** Nota da página sem a frase "Números de `x.json`." (só serve para quem mexe no jogo). */
function playerNote(line: string): string | null {
  const text = plainText(line.replace(/^\*|\*$/g, ''));
  const rest = text.replace(/^Números de .*?\.(\s+(?=[A-ZÀ-Ú])|$)/, '').trim();
  return rest === '' ? null : rest;
}

function cells(line: string): string[] {
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => plainText(c.trim()));
}

/**
 * Lê o docs/wiki.md (fase 6): cada `## ` é uma página e cada `### ` um verbete. Listas viram
 * linhas com "·", tabelas viram uma linha por fileira ("Nome: meta · recompensa"), e o que vem
 * antes da primeira página (o aviso para quem mexe no jogo) fica de fora.
 */
export function parseWiki(text: string): WikiPage[] {
  const pages: WikiPage[] = [];
  let tableHeader = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      pages.push({ title: plainText(line.slice(3)), note: null, intro: [], entries: [] });
      continue;
    }
    const page = pages[pages.length - 1];
    if (!page || line === '' || line === '---' || line.startsWith('>')) {
      tableHeader = false;
      continue;
    }
    if (line.startsWith('### ')) {
      page.entries.push({ title: plainText(line.slice(4)), lines: [] });
      continue;
    }
    const entry = page.entries[page.entries.length - 1];
    const target = entry ? entry.lines : page.intro;
    if (line.startsWith('|')) {
      // A primeira fileira é o cabeçalho e a segunda, a linha de traços.
      if (!tableHeader) {
        tableHeader = true;
        continue;
      }
      if (/^\|[\s|:-]+\|$/.test(line)) continue;
      const [first, ...rest] = cells(line);
      target.push(`· ${first}: ${rest.join(' · ')}`);
      continue;
    }
    tableHeader = false;
    if (!entry && page.intro.length === 0 && page.note === null && /^\*[^*].*\*$/.test(line)) {
      page.note = playerNote(line);
      continue;
    }
    if (line.startsWith('- ')) target.push(`· ${plainText(line.slice(2))}`);
    else target.push(plainText(line));
  }
  return pages.filter((p) => p.entries.length > 0 || p.intro.length > 0);
}
