import type * as Phaser from 'phaser';
import { PALETTE_CSS } from '../render/palette';

/** Fontes da aba Design: Pixelify Sans para títulos e textos, Silkscreen para rótulos curtos. */
export const FONT_MAIN = '"Pixelify Sans", monospace';
export const FONT_LABEL = 'Silkscreen, monospace';

/** Espera as fontes carregarem, sem travar o jogo se a rede falhar. */
export async function loadFonts(): Promise<void> {
  const fonts = [
    document.fonts.load('700 16px "Pixelify Sans"'),
    document.fonts.load('600 16px "Pixelify Sans"'),
    document.fonts.load('16px Silkscreen'),
  ];
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
  await Promise.race([Promise.allSettled(fonts), timeout]);
}

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

/**
 * Resolução com que os textos são desenhados. As telas de interface ampliam tudo com zoom
 * inteiro; o texto precisa nascer já nessa resolução para sair nítido, e não ampliado.
 * `setupUiLayout` atualiza este valor antes de montar cada tela.
 */
let textResolution = 1;

export function setTextResolution(resolution: number): void {
  textResolution = resolution;
}

/** Texto de impacto: grosso, com contorno escuro (logo, títulos, números grandes). */
export function impactText(size: number, color: string = PALETTE_CSS.hydrogen): TextStyle {
  return {
    fontFamily: FONT_MAIN,
    fontStyle: '700',
    fontSize: `${size}px`,
    color,
    stroke: PALETTE_CSS.outline,
    strokeThickness: Math.max(2, Math.round(size / 6)),
    resolution: textResolution,
  };
}

/** Texto de interface e nomes. */
export function bodyText(size: number, color: string = PALETTE_CSS.hydrogen): TextStyle {
  return {
    fontFamily: FONT_MAIN,
    fontStyle: '600',
    fontSize: `${size}px`,
    color,
    resolution: textResolution,
  };
}

/**
 * Soma uma sombra dura (sem desfoque) embaixo do texto, como o `text-shadow: 0 Npx` do guia de
 * estilo.
 */
export function withShadow(style: TextStyle, color: string, offsetY: number): TextStyle {
  return {
    ...style,
    shadow: { offsetX: 0, offsetY, color, blur: 0, stroke: true, fill: true },
  };
}

/** Rótulo com contorno, para ler sobre o campo de batalha (HUD). */
export function hudLabelText(size: number, color: string = PALETTE_CSS.hydrogen): TextStyle {
  return { ...labelText(size, color), stroke: PALETTE_CSS.outline, strokeThickness: 3 };
}

/** Rótulos curtos em caixa alta. */
export function labelText(size: number, color: string = PALETTE_CSS.hydrogen): TextStyle {
  return { fontFamily: FONT_LABEL, fontSize: `${size}px`, color, resolution: textResolution };
}

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
