/**
 * Maior zoom inteiro que ainda mostra pelo menos `minShortSide` pixels lógicos no lado menor
 * da tela. Zoom inteiro mantém os pixels nítidos (1×, 2×, 3×).
 */
export function integerZoom(width: number, height: number, minShortSide: number): number {
  return Math.max(1, Math.floor(Math.min(width, height) / minShortSide));
}
