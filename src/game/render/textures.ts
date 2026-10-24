import type * as Phaser from 'phaser';
import { ICONS, type FrameKind, type IconGroup } from '../../assets/sprites';
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
import { integerZoom } from './pixelScale';
import {
  atlasName,
  frameFileKey,
  iconFileKey,
  moleculeName,
  spriteFiles,
  WORLD_NAMES,
  type IconRef,
  type SpriteFile,
} from './spriteFiles';

export { textureKey } from './spriteFiles';
export type { IconRef } from './spriteFiles';

/**
 * Texturas do jogo a partir dos PNGs de `public/sprites/` (decisão 0020). Sprites do mundo vêm
 * em cada detail (decisão 0009); ícones vêm em vários tamanhos e o jogo usa o que bate com o
 * zoom da tela, carregando só esses.
 */
export const TEXTURES = WORLD_NAMES;

/** Sprite de cada inimigo. */
export const ENEMY_TEXTURES = Object.fromEntries(
  Object.keys(ENEMIES).map((id) => [id, moleculeName(id)]),
) as Record<EnemyKind, string>;

/** Sprite de cada agente jogável. */
export const AGENT_TEXTURES = Object.fromEntries(
  Object.keys(AGENTS).map((id) => [id, moleculeName(id)]),
) as Record<AgentId, string>;

/** Sprite do projétil de cada arma que dispara; as outras desenham efeitos (cone, feixe...). */
export const PROJECTILE_TEXTURES: Partial<Record<WeaponId, string>> = {
  radical: WORLD_NAMES.shot,
  fenton: WORLD_NAMES.shot,
  chainReaction: moleculeName('superoxide'),
  fission: moleculeName('superoxide'),
  ascorbicShot: WORLD_NAMES.shotVitamin,
  caffeineBurst: WORLD_NAMES.shotCaffeine,
};

const MISSING: IconRef = { group: 'ui', id: 'missing' };
/** Cadeado dos espaços bloqueados. */
export const LOCKED_ICON: IconRef = { group: 'ui', id: 'locked' };

/** Ícone (16×16) de uma arma, modificador ou especial; sem desenho, o ícone padrão. */
export function iconTexture(group: 'weapons', id: WeaponId): IconRef;
export function iconTexture(group: 'passives', id: PassiveId): IconRef;
export function iconTexture(group: 'specials', id: SpecialKind): IconRef;
/** Itens do mapa: os de ItemId e os extras da prancheta (gemas, cápsulas, vesícula, Fosfocreatina). */
export function iconTexture(group: 'items', id: string): IconRef;
/** Suplementos: um ícone por id de supplements.json (prancheta "Suplementos e ampolas"). */
export function iconTexture(group: 'supplements', id: string): IconRef;
/** Estruturas do mapa e a seta da borda (prancheta "Estruturas de interação"). */
export function iconTexture(group: 'structures', id: string): IconRef;
/** Conquistas: o grupo vem da config (`icon` em meta.json), novo ou reaproveitado. */
export function iconTexture(group: IconGroup, id: string): IconRef;
export function iconTexture(group: IconGroup, id: string): IconRef {
  return ICONS[group][id] ? { group, id } : MISSING;
}

const FILES = spriteFiles();
const SIZES = [...DISPLAY.iconSizesPx].sort((a, b) => a - b);

/** Tamanhos de ícone que uma tela com zoom `zoom` usa: ícones de 1× e 2×, e o 16 de reserva. */
function iconSizesFor(zoom: number): Set<number> {
  const want = [16, 16 * zoom, 32 * zoom].map(
    (px) => SIZES.find((s) => s >= px) ?? SIZES[SIZES.length - 1]!,
  );
  return new Set(want);
}

function url(file: SpriteFile): string {
  return `${import.meta.env.BASE_URL}sprites/${file.path}`;
}

/** Chave do atlas inteiro (imagem e mapa), antes de recortar. */
function atlasKey(name: string): string {
  return `atlas-${name}`;
}

function atlasUrl(name: string, ext: 'png' | 'json'): string {
  return `${import.meta.env.BASE_URL}sprites/atlas/${name}.${ext}`;
}

/** Arquivos de cada atlas (PERF-2), na ordem de `spriteFiles`. */
const ATLASES = new Map<string, SpriteFile[]>();
for (const file of FILES) {
  const name = atlasName(file);
  if (!name) continue;
  const list = ATLASES.get(name) ?? [];
  list.push(file);
  ATLASES.set(name, list);
}

/**
 * Põe na fila do carregador os sprites que a tela atual usa: o mundo, as molduras e os ícones
 * nos tamanhos do zoom. Chame no `preload` da cena de abertura.
 */
export function preloadSprites(scene: Phaser.Scene): void {
  const zoom = integerZoom(scene.scale.width, scene.scale.height, DISPLAY.uiMinShortSidePx);
  queueIcons(scene, zoom, true);
  scene.load.once('complete', () => unpackAtlases(scene));
}

/**
 * Carrega, em segundo plano, os ícones de um zoom novo (tela girada ou redimensionada).
 * Devolve `true` se algo entrou na fila; `onDone` roda quando terminar.
 */
export function loadIconsForZoom(scene: Phaser.Scene, zoom: number, onDone: () => void): boolean {
  if (!queueIcons(scene, zoom, false)) return false;
  scene.load.once('complete', () => {
    unpackAtlases(scene);
    onDone();
  });
  scene.load.start();
  return true;
}

/**
 * Os sprites vêm em atlas, um arquivo por tamanho de ícone e por detail do mundo, em vez de um
 * PNG por sprite: centenas de pedidos viravam poucos (PERF-2). Só a logo vem solta.
 */
function queueIcons(scene: Phaser.Scene, zoom: number, everything: boolean): boolean {
  const sizes = iconSizesFor(zoom);
  let queued = false;
  for (const [name, files] of ATLASES) {
    const px = files[0]!.iconPx;
    if (px !== undefined ? !sizes.has(px) : !everything) continue;
    if (files.every((f) => scene.textures.exists(f.key))) continue;
    if (scene.textures.exists(atlasKey(name))) continue;
    scene.load.image(atlasKey(name), atlasUrl(name, 'png'));
    scene.load.json(atlasKey(name), atlasUrl(name, 'json'));
    queued = true;
  }
  if (!everything) return queued;
  for (const file of FILES) {
    if (file.preload === false || atlasName(file) || scene.textures.exists(file.key)) continue;
    scene.load.image(file.key, url(file));
    queued = true;
  }
  return queued;
}

/**
 * Recorta os atlas carregados: cada sprite vira uma textura com a chave dele, como se tivesse
 * vindo do PNG solto, e o atlas inteiro sai da memória.
 */
function unpackAtlases(scene: Phaser.Scene): void {
  for (const name of ATLASES.keys()) {
    const key = atlasKey(name);
    if (!scene.textures.exists(key) || !scene.cache.json.exists(key)) continue;
    const image = scene.textures.get(key).getSourceImage() as HTMLImageElement;
    const { frames } = scene.cache.json.get(key) as {
      frames: Record<string, [number, number, number, number]>;
    };
    for (const [frame, [x, y, w, h]] of Object.entries(frames)) {
      if (scene.textures.exists(frame)) continue;
      const texture = scene.textures.createCanvas(frame, w, h);
      if (!texture) continue;
      texture.context.drawImage(image, x, y, w, h, 0, 0, w, h);
      texture.refresh();
    }
    scene.textures.remove(key);
    scene.cache.json.remove(key);
  }
}

/**
 * Chave da textura de um ícone mostrado com `logicalPx` unidades numa cena com zoom inteiro:
 * o PNG do tamanho exato, ou o maior já carregado abaixo dele (pixel art amplia sem borrar).
 */
export function iconKey(scene: Phaser.Scene, ref: IconRef, logicalPx: number): string {
  const target = logicalPx * scene.cameras.main.zoom;
  const loaded = SIZES.filter((px) => scene.textures.exists(iconFileKey(ref, px)));
  const exact = loaded.find((px) => px === target);
  const below = loaded.filter((px) => px <= target).pop();
  const px = exact ?? below ?? loaded[0];
  return px === undefined ? '__MISSING' : iconFileKey(ref, px);
}

/** Imagem de um ícone com `logicalPx` unidades de lado, canto de cima à esquerda em (x, y). */
export function addIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  ref: IconRef,
  logicalPx = 16,
): Phaser.GameObjects.Image {
  return scene.add
    .image(x, y, iconKey(scene, ref, logicalPx))
    .setOrigin(0)
    .setDisplaySize(logicalPx, logicalPx);
}

/** Textura da moldura de um espaço de ícone. */
export function frameKey(kind: FrameKind, scale: number): string {
  return frameFileKey(kind, scale);
}
