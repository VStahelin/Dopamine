import type * as Phaser from 'phaser';
import { DISPLAY, type EnemyKind } from '../../config';
import { createMoleculeTexture, MOLECULES } from './molecules';
import { PALETTE } from './palette';

export const TEXTURES = {
  ground: 'ground',
  agent: 'agent',
  projectile: 'projectile',
  gem: 'gem',
} as const;

export const ENEMY_TEXTURES: Record<EnemyKind, string> = {
  glucose: 'enemy-glucose',
  fattyAcid: 'enemy-fattyAcid',
  triglyceride: 'enemy-triglyceride',
};

/** Gera todas as texturas por código, sem arquivos de imagem. */
export function createTextures(scene: Phaser.Scene): void {
  const size = DISPLAY.tileSizePx;
  const g = scene.make.graphics({}, false);

  // Ladrilho de areia com rejunte embaixo e à direita.
  g.fillStyle(PALETTE.sand).fillRect(0, 0, size, size);
  g.fillStyle(PALETTE.sandGrout)
    .fillRect(0, size - 1, size, 1)
    .fillRect(size - 1, 0, 1, size);
  g.generateTexture(TEXTURES.ground, size, size);
  g.clear();

  // Gema de XP: losango azul com contorno e brilho.
  const gem = [
    [3, 0, 1],
    [2, 1, 3],
    [1, 2, 5],
    [0, 3, 7],
    [1, 4, 5],
    [2, 5, 3],
    [3, 6, 1],
  ] as const;
  g.fillStyle(PALETTE.outline);
  for (const [x, y, w] of gem) g.fillRect(x, y, w, 1);
  g.fillStyle(PALETTE.progress);
  for (const [x, y, w] of gem.slice(1, -1)) g.fillRect(x + 1, y, w - 2, 1);
  g.fillStyle(PALETTE.water).fillRect(2, 2, 1, 1).fillRect(3, 1, 1, 1);
  g.generateTexture(TEXTURES.gem, 7, 7);
  g.destroy();

  createMoleculeTexture(scene, TEXTURES.agent, MOLECULES.dopamine());
  createMoleculeTexture(scene, TEXTURES.projectile, MOLECULES.hydroxyl());
  createMoleculeTexture(scene, ENEMY_TEXTURES.glucose, MOLECULES.glucose());
  createMoleculeTexture(scene, ENEMY_TEXTURES.fattyAcid, MOLECULES.fattyAcid());
  createMoleculeTexture(scene, ENEMY_TEXTURES.triglyceride, MOLECULES.triglyceride());
}
