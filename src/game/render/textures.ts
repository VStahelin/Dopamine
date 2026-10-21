import type * as Phaser from 'phaser';
import { ICONS, MOLECULES, UI_SPRITES, WORLD_SPRITES, type IconGroup } from '../../assets/sprites';
import {
  AGENTS,
  DISPLAY,
  ENEMIES,
  type AgentId,
  type EnemyKind,
  type PassiveId,
  type SpecialKind,
  type WeaponId,
} from '../../config';
import {
  paintGem,
  paintGrid,
  paintGround,
  paintMolecule,
  paintOrb,
  type Painter,
  type Size,
} from './spriteArt';

/**
 * Gerador único de texturas (decisão 0019): transforma os dados de `src/assets/sprites` em
 * texturas do Phaser. Sprites do mundo saem uma vez para cada detail (decisão 0009); ícones saem
 * com 1 pixel de textura por pixel de arte e crescem só em escala inteira. O desenho em si
 * fica em spriteArt.ts.
 */
export const TEXTURES = {
  ground: 'ground',
  gem: 'gem',
  electron: 'electron',
  shot: 'shot',
  coin: 'coin',
} as const;

/** Sprite de cada inimigo. */
export const ENEMY_TEXTURES = Object.fromEntries(
  Object.keys(ENEMIES).map((id) => [id, `enemy-${id}`]),
) as Record<EnemyKind, string>;

/** Sprite de cada agente jogável. */
export const AGENT_TEXTURES = Object.fromEntries(
  Object.keys(AGENTS).map((id) => [id, `agent-${id}`]),
) as Record<AgentId, string>;

/** Sprite do projétil de cada arma que dispara; as outras desenham efeitos (cone, feixe...). */
export const PROJECTILE_TEXTURES: Partial<Record<WeaponId, string>> = {
  radical: TEXTURES.shot,
  fenton: TEXTURES.shot,
  chainReaction: 'proj-superoxide',
};

/** Chave da textura `name` desenhada com `detail` pixels de arte por unidade do mundo. */
export function textureKey(name: string, detail: number): string {
  return `${name}@${detail}`;
}

const MISSING_ICON = 'icon-missing';
/** Cadeado dos espaços bloqueados. */
export const LOCKED_ICON = 'icon-locked';

/** Textura do ícone (16×16) de uma arma, modificador ou especial, ou o ícone padrão. */
export function iconTexture(group: 'weapons', id: WeaponId): string;
export function iconTexture(group: 'passives', id: PassiveId): string;
export function iconTexture(group: 'specials', id: SpecialKind): string;
export function iconTexture(group: IconGroup, id: string): string {
  return ICONS[group][id] ? `icon-${group}-${id}` : MISSING_ICON;
}

const MOLECULE_SPRITES: [string, string][] = [
  ...Object.entries(AGENT_TEXTURES).map(([id, key]) => [key, id] as [string, string]),
  ...Object.entries(ENEMY_TEXTURES).map(([id, key]) => [key, id] as [string, string]),
  ['proj-hydroxyl', 'hydroxyl'],
  ['proj-superoxide', 'superoxide'],
];

/** Gera todas as texturas: mundo e moléculas em cada detail, e os ícones. */
export function createTextures(scene: Phaser.Scene): void {
  for (const detail of DISPLAY.spriteDetails) {
    bake(scene, textureKey(TEXTURES.ground, detail), (g) => paintGround(g, detail));
    bake(scene, textureKey(TEXTURES.gem, detail), (g) => paintGem(g, detail));
    for (const orb of ['electron', 'shot', 'coin'] as const) {
      bake(scene, textureKey(TEXTURES[orb], detail), (g) =>
        paintOrb(g, WORLD_SPRITES[orb], detail),
      );
    }
    for (const [key, id] of MOLECULE_SPRITES) {
      const def = MOLECULES[id];
      if (def) bake(scene, textureKey(key, detail), (g) => paintMolecule(g, def, detail));
    }
  }
  for (const [group, icons] of Object.entries(ICONS)) {
    for (const [id, grid] of Object.entries(icons)) {
      bake(scene, `icon-${group}-${id}`, (g) => paintGrid(g, grid));
    }
  }
  bake(scene, MISSING_ICON, (g) => paintGrid(g, UI_SPRITES.missingIcon));
  bake(scene, LOCKED_ICON, (g) => paintGrid(g, UI_SPRITES.lockedIcon));
}

/** Pinta com um Graphics fora da tela e guarda como textura. */
function bake(scene: Phaser.Scene, key: string, paint: (g: Painter) => Size): void {
  const g = scene.make.graphics({}, false);
  const { width, height } = paint(g);
  g.generateTexture(key, width, height);
  g.destroy();
}
