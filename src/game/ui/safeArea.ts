/**
 * Áreas seguras do aparelho (notch, cantos arredondados), em pixels CSS. Lê o `env()` do CSS
 * com um elemento escondido; fora de um app instalado ou sem notch, tudo dá 0.
 */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let probe: HTMLDivElement | undefined;

export function safeAreaCss(): Insets {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) ' +
      'env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(probe);
  }
  const s = getComputedStyle(probe);
  return {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0,
  };
}

/** Áreas seguras nas unidades lógicas de uma tela de interface com zoom `zoom`. */
export function safeAreaUi(zoom: number): Insets {
  const css = safeAreaCss();
  const k = Math.min(window.devicePixelRatio || 1, 4) / zoom;
  return {
    top: Math.ceil(css.top * k),
    right: Math.ceil(css.right * k),
    bottom: Math.ceil(css.bottom * k),
    left: Math.ceil(css.left * k),
  };
}
