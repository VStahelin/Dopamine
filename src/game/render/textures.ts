import type * as Phaser from 'phaser';
import { DISPLAY, type AgentId, type EnemyKind, type WeaponId } from '../../config';
import {
  createMoleculeTexture,
  MOLECULES,
  pixelCircle,
  shade,
  type MoleculeDef,
} from './molecules';
import { PALETTE } from './palette';

export const TEXTURES = {
  ground: 'ground',
  gem: 'gem',
  electron: 'electron',
} as const;

/** Sprite de cada inimigo. */
export const ENEMY_TEXTURES: Record<EnemyKind, string> = {
  glucose: 'enemy-glucose',
  fructose: 'enemy-fructose',
  maltose: 'enemy-maltose',
  sucrose: 'enemy-sucrose',
  starch: 'enemy-starch',
  glycerol: 'enemy-glycerol',
  fattyAcid: 'enemy-fattyAcid',
  triglyceride: 'enemy-triglyceride',
  ldl: 'enemy-ldl',
};

/** Sprite de cada agente jogável. */
export const AGENT_TEXTURES: Record<AgentId, string> = {
  dopamine: 'agent-dopamine',
  lipase: 'agent-lipase',
  insulin: 'agent-insulin',
};

/** Sprite do projétil de cada arma que dispara; as outras desenham efeitos (cone, feixe...). */
export const PROJECTILE_TEXTURES: Partial<Record<WeaponId, string>> = {
  radical: 'proj-hydroxyl',
  fenton: 'proj-hydroxyl',
  chainReaction: 'proj-superoxide',
};

/** Chave da textura `name` desenhada com `detail` pixels de arte por unidade do mundo. */
export function textureKey(name: string, detail: number): string {
  return `${name}@${detail}`;
}

/** Tamanho da gema de XP, em unidades do mundo. */
const GEM_SIZE = 7;

const MOLECULE_SPRITES: [string, () => MoleculeDef][] = [
  [AGENT_TEXTURES.dopamine, MOLECULES.dopamine],
  [AGENT_TEXTURES.lipase, MOLECULES.lipase],
  [AGENT_TEXTURES.insulin, MOLECULES.insulin],
  [ENEMY_TEXTURES.glucose, MOLECULES.glucose],
  [ENEMY_TEXTURES.fructose, MOLECULES.fructose],
  [ENEMY_TEXTURES.maltose, MOLECULES.maltose],
  [ENEMY_TEXTURES.sucrose, MOLECULES.sucrose],
  [ENEMY_TEXTURES.starch, MOLECULES.starch],
  [ENEMY_TEXTURES.glycerol, MOLECULES.glycerol],
  [ENEMY_TEXTURES.fattyAcid, MOLECULES.fattyAcid],
  [ENEMY_TEXTURES.triglyceride, MOLECULES.triglyceride],
  [ENEMY_TEXTURES.ldl, MOLECULES.ldl],
  ['proj-hydroxyl', MOLECULES.hydroxyl],
  ['proj-superoxide', MOLECULES.superoxide],
];

/** Gera todas as texturas por código, uma versão para cada nível de detalhe (decisão 0009). */
export function createTextures(scene: Phaser.Scene): void {
  for (const detail of DISPLAY.spriteDetails) {
    createGround(scene, detail);
    createGem(scene, detail);
    createElectron(scene, detail);
    for (const [key, build] of MOLECULE_SPRITES) {
      createMoleculeTexture(scene, textureKey(key, detail), build(), detail);
    }
  }
}

/** Elétron da Nuvem de Elétrons: ponto azul com contorno e brilho. */
function createElectron(scene: Phaser.Scene, detail: number): void {
  const d = 7 * detail;
  const g = scene.make.graphics({}, false);
  g.fillStyle(PALETTE.ink);
  pixelCircle(g, 0, 0, d);
  g.fillStyle(PALETTE.progress);
  pixelCircle(g, detail, detail, d - 2 * detail);
  g.fillStyle(PALETTE.cyan);
  pixelCircle(g, detail * 2, detail * 2, Math.max(2, d - 5 * detail));
  g.generateTexture(textureKey(TEXTURES.electron, detail), d, d);
  g.destroy();
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
