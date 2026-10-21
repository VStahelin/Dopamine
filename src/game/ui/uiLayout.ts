import * as Phaser from 'phaser';
import { DISPLAY } from '../../config';
import { integerZoom } from '../render/pixelScale';
import { loadIconsForZoom } from '../render/textures';
import { setTextResolution } from './theme';

/**
 * Prepara a câmera de uma cena de interface com zoom inteiro a partir do canto superior
 * esquerdo, e chama `layout` com a largura e a altura lógicas. Chama de novo a cada
 * redimensionamento da tela.
 */
export function setupUiLayout(
  scene: Phaser.Scene,
  layout: (width: number, height: number) => void,
  /** Tamanho lógico mínimo que a tela precisa; sem ele, vale `uiMinShortSidePx` no lado menor. */
  minSize?: { width: number; height: number },
): void {
  const apply = () => {
    const { width, height } = scene.scale;
    const zoom = minSize
      ? Math.max(1, Math.floor(Math.min(width / minSize.width, height / minSize.height)))
      : integerZoom(width, height, DISPLAY.uiMinShortSidePx);
    scene.cameras.main.setOrigin(0, 0).setZoom(zoom);
    setTextResolution(zoom);
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
