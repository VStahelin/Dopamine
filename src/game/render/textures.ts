import type * as Phaser from 'phaser';
import { DISPLAY } from '../../config';
import { PALETTE } from './palette';

export const TEXTURES = {
  ground: 'ground',
  agent: 'agent',
} as const;

/** Texturas provisórias desenhadas por código, até os sprites de molécula da fase 1. */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const size = DISPLAY.tileSizePx;
  const g = scene.make.graphics({}, false);

  // Ladrilho de areia com rejunte embaixo e à direita.
  g.fillStyle(PALETTE.sand).fillRect(0, 0, size, size);
  g.fillStyle(PALETTE.sandGrout)
    .fillRect(0, size - 1, size, 1)
    .fillRect(size - 1, 0, 1, size);
  g.generateTexture(TEXTURES.ground, size, size);
  g.clear();

  // Agente: quadrado ciano com contorno escuro e brilho no canto.
  g.fillStyle(PALETTE.outline).fillRect(0, 0, size, size);
  g.fillStyle(PALETTE.water).fillRect(2, 2, size - 4, size - 4);
  g.fillStyle(PALETTE.hydrogen).fillRect(4, 4, 2, 2);
  g.generateTexture(TEXTURES.agent, size, size);

  g.destroy();
}
