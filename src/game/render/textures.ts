import type * as Phaser from 'phaser';
import { DISPLAY, type EnemyKind } from '../../config';
import { createMoleculeTexture, MOLECULES, pixelCircle, shade } from './molecules';
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

/** Chave da textura `name` desenhada com `detail` pixels de arte por unidade do mundo. */
export function textureKey(name: string, detail: number): string {
  return `${name}@${detail}`;
}

/** Tamanho da gema de XP, em unidades do mundo. */
const GEM_SIZE = 7;

/** Gera todas as texturas por código, uma versão para cada nível de detalhe (decisão 0009). */
export function createTextures(scene: Phaser.Scene): void {
  for (const detail of DISPLAY.spriteDetails) {
    createGround(scene, detail);
    createGem(scene, detail);
    createMoleculeTexture(scene, textureKey(TEXTURES.agent, detail), MOLECULES.dopamine(), detail);
    createMoleculeTexture(
      scene,
      textureKey(TEXTURES.projectile, detail),
      MOLECULES.hydroxyl(),
      detail,
    );
    createMoleculeTexture(
      scene,
      textureKey(ENEMY_TEXTURES.glucose, detail),
      MOLECULES.glucose(),
      detail,
    );
    createMoleculeTexture(
      scene,
      textureKey(ENEMY_TEXTURES.fattyAcid, detail),
      MOLECULES.fattyAcid(),
      detail,
    );
    createMoleculeTexture(
      scene,
      textureKey(ENEMY_TEXTURES.triglyceride, detail),
      MOLECULES.triglyceride(),
      detail,
    );
  }
}

/** Ladrilho de areia com rejunte e grãos, sempre o mesmo (sorteio com semente fixa). */
function createGround(scene: Phaser.Scene, detail: number): void {
  const size = DISPLAY.tileSizePx * detail;
  const g = scene.make.graphics({}, false);
  g.fillStyle(PALETTE.sand).fillRect(0, 0, size, size);

  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const grain = Math.max(1, Math.round(detail / 2));
  for (let i = 0; i < size * 0.6; i++) {
    const light = rand() < 0.5;
    g.fillStyle(light ? 0xe4c48e : PALETTE.sandGrout);
    g.fillRect(Math.floor(rand() * size), Math.floor(rand() * size), grain, grain);
  }

  const grout = Math.max(1, Math.round(detail / 2));
  g.fillStyle(PALETTE.sandGrout)
    .fillRect(0, size - grout, size, grout)
    .fillRect(size - grout, 0, grout, size);
  g.generateTexture(textureKey(TEXTURES.ground, detail), size, size);
  g.destroy();
}

/** Gema de XP: cristal em losango com contorno, faces claras e escuras e brilho. */
function createGem(scene: Phaser.Scene, detail: number): void {
  const size = GEM_SIZE * detail;
  const c = (size - 1) / 2;
  const g = scene.make.graphics({}, false);
  const diamond = (inset: number, color: number) => {
    g.fillStyle(color);
    for (let row = inset; row < size - inset; row++) {
      const half = Math.floor(c - inset - Math.abs(row - c));
      if (half >= 0) g.fillRect(Math.round(c - half), row, half * 2 + 1, 1);
    }
  };
  diamond(0, PALETTE.outline);
  diamond(detail, shade(PALETTE.progress, 0.75));
  // Face clara: metade de cima.
  g.fillStyle(PALETTE.progress);
  for (let row = detail; row <= c; row++) {
    const half = Math.floor(c - detail - Math.abs(row - c));
    if (half >= 0) g.fillRect(Math.round(c - half), row, half * 2 + 1, 1);
  }
  g.fillStyle(PALETTE.water);
  pixelCircle(g, Math.round(c - detail * 1.5), Math.round(c - detail * 1.5), Math.max(2, detail));
  g.generateTexture(textureKey(TEXTURES.gem, detail), size, size);
  g.destroy();
}
