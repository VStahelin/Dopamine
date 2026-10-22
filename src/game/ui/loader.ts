/**
 * Tela de carregamento do `index.html`: aparece antes de qualquer script, enquanto o jogo baixa,
 * mostra cada etapa da abertura e some quando o título abre. Volta por cima de tudo, bloqueando
 * o jogo, durante uma atualização (docs/atualizacoes.md).
 */
function el<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

/** Mostra a tela com a mensagem; `overlay` deixa o jogo aparecendo escurecido por trás. */
export function showLoader(status: string, detail = '', overlay = false): void {
  const root = el('#loader');
  if (!root) return;
  root.classList.remove('hidden');
  root.classList.toggle('overlay', overlay);
  setLoaderStatus(status, detail);
  setLoaderProgress(null);
}

export function setLoaderStatus(status: string, detail?: string): void {
  const s = el('#loader .status');
  if (s) s.textContent = status;
  const d = el('#loader .detail');
  if (d && detail !== undefined) d.textContent = detail;
}

/** Progresso de 0 a 1; `null` volta à barra que vai e vem (sem saber quanto falta). */
export function setLoaderProgress(fraction: number | null): void {
  const bar = el('#loader .bar');
  const fill = el<HTMLDivElement>('#loader .bar div');
  if (!bar || !fill) return;
  bar.classList.toggle('known', fraction !== null);
  fill.style.width = fraction === null ? '' : `${Math.round(Math.max(0.04, fraction) * 100)}%`;
  fill.style.marginLeft = fraction === null ? '' : '0';
}

export function hideLoader(): void {
  el('#loader')?.classList.add('hidden');
}
