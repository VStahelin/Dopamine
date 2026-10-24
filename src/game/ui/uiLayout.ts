import * as Phaser from 'phaser';
import { DISPLAY } from '../../config';
import { integerZoom } from '../render/pixelScale';
import { loadIconsForZoom } from '../render/textures';
import { setTextResolution } from './theme';

type Size = { width: number; height: number };

/**
 * Prepara a câmera de uma cena de interface com zoom inteiro a partir do canto superior
 * esquerdo, e chama `layout` com a largura e a altura lógicas. Chama de novo a cada
 * redimensionamento da tela.
 */
export function setupUiLayout(
  scene: Phaser.Scene,
  layout: (width: number, height: number) => void,
  /**
   * Tamanho lógico mínimo que a tela precisa; sem ele, vale `uiMinShortSidePx` no lado menor.
   * Uma função escolhe pelo tamanho da tela (o menu de PC usa a regra do lado menor).
   */
  minSizeOf?: Size | ((width: number, height: number) => Size | undefined),
): void {
  const apply = () => {
    const { width, height } = scene.scale;
    const minSize = typeof minSizeOf === 'function' ? minSizeOf(width, height) : minSizeOf;
    const zoom = minSize
      ? Math.max(1, Math.floor(Math.min(width / minSize.width, height / minSize.height)))
      : integerZoom(width, height, uiMinShortSide(width, height));
    scene.cameras.main.setOrigin(0, 0).setZoom(zoom);
    // Pelo menos 2×: em telas 1× o texto pequeno precisa de mais pixels (veja textFix.ts).
    setTextResolution(Math.max(2, zoom));
    layout(Math.floor(width / zoom), Math.floor(height / zoom));
    // Zoom novo: carrega os ícones desse tamanho e monta a tela de novo quando chegarem.
    loadIconsForZoom(scene, zoom, apply);
  };
  apply();
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, apply);
  });
}

/** Lado menor lógico que a interface precisa: maior em telas grandes, como o PC. */
export function uiMinShortSide(width: number, height: number): number {
  const cssShort = Math.min(width, height) / Math.min(window.devicePixelRatio || 1, 4);
  return cssShort >= DISPLAY.largeScreenShortSideCss
    ? DISPLAY.uiMinShortSidePxLarge
    : DISPLAY.uiMinShortSidePx;
}

/**
 * Tamanho lógico mínimo das telas de cartão por cima da run (ampola, cápsula): em tela grande, o
 * PC, o zoom sobe para o cartão ocupar um bom pedaço da tela; no celular fica o padrão.
 */
export function cardUiMinSize(width: number, height: number): Size | undefined {
  const cssShort = Math.min(width, height) / Math.min(window.devicePixelRatio || 1, 4);
  return cssShort >= DISPLAY.largeScreenShortSideCss ? { width: 340, height: 330 } : undefined;
}

/** Converte a posição de um ponteiro para as coordenadas lógicas de uma cena de interface. */
export function pointerToUi(
  scene: Phaser.Scene,
  pointer: Phaser.Input.Pointer,
): { x: number; y: number } {
  const zoom = scene.cameras.main.zoom;
  return { x: pointer.x / zoom, y: pointer.y / zoom };
}

/** Fundo escurecido para telas por cima da run. */
export function addDim(scene: Phaser.Scene, width: number, height: number, alpha = 0.7) {
  return scene.add.rectangle(0, 0, width, height, 0x000000, alpha).setOrigin(0).setInteractive();
}
