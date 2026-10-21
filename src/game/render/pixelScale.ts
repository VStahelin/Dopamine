/**
 * Maior zoom inteiro que ainda mostra pelo menos `minShortSide` unidades no lado menor da tela.
 * Usado nas telas de interface.
 */
export function integerZoom(width: number, height: number, minShortSide: number): number {
  return Math.max(1, Math.floor(Math.min(width, height) / minShortSide));
}

export interface WorldScale {
  /** Pixels de arte por unidade do mundo: o detalhe com que os sprites são desenhados. */
  detail: number;
  /** Pixels da tela por pixel de arte; sempre inteiro, para a arte não borrar. */
  pixelSize: number;
  /** Pixels da tela por unidade do mundo (zoom da câmera). */
  zoom: number;
}

/**
 * Escala do mundo (decisão 0009). O canvas tem a resolução real do aparelho; os sprites são
 * desenhados com `detail` pixels de arte por unidade do mundo, e cada pixel de arte ocupa
 * `pixelSize` pixels inteiros da tela. Entre as combinações possíveis, fica a que mostra a área
 * mais próxima de `targetShortSide` unidades no lado menor da tela.
 */
export function worldScale(
  width: number,
  height: number,
  targetShortSide: number,
  details: readonly number[],
): WorldScale {
  const short = Math.min(width, height);
  let best: WorldScale = { detail: details[0] ?? 1, pixelSize: 1, zoom: details[0] ?? 1 };
  let bestError = Infinity;
  for (const detail of details) {
    for (let pixelSize = 1; pixelSize <= 8; pixelSize++) {
      const zoom = detail * pixelSize;
      const error = Math.abs(Math.log(short / zoom / targetShortSide));
      if (error < bestError) {
        bestError = error;
        best = { detail, pixelSize, zoom };
      }
    }
  }
  return best;
}
