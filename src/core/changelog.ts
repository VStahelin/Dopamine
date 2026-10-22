/** Uma versão do CHANGELOG.md: título (`v0.6.0 · 22/10/2026`), texto solto e as seções. */
export interface ChangelogVersion {
  title: string;
  intro: string[];
  sections: { name: string; items: string[] }[];
}

/**
 * Lê o CHANGELOG.md: cada `## ` abre uma versão, cada `### ` uma seção (Novidades, Ajustes,
 * Correções) e cada `- ` um item. O que vem antes da primeira versão é ignorado.
 */
export function parseChangelog(text: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      versions.push({ title: line.slice(3).trim(), intro: [], sections: [] });
      continue;
    }
    const version = versions[versions.length - 1];
    if (!version || line === '') continue;
    if (line.startsWith('### ')) {
      version.sections.push({ name: line.slice(4).trim(), items: [] });
    } else if (line.startsWith('- ')) {
      const section = version.sections[version.sections.length - 1];
      if (section) section.items.push(line.slice(2).trim());
      else version.intro.push(line.slice(2).trim());
    } else {
      version.intro.push(line);
    }
  }
  return versions;
}
