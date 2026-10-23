/**
 * Toda a pixel art do jogo, como dados (decisão 0019). Esta pasta só tem desenhos e o índice
 * que os liga aos ids da configuração; quem transforma tudo em texturas é
 * `src/game/render/textures.ts`.
 *
 * - `palette.json`: letras das grades de ícone, as mesmas do canvas de identidade visual.
 * - `icons.json`: ícones de 16×16 do canvas (prancheta "Ícones de armas e habilidades"), por
 *   arma, modificador e especial, e os itens do mapa (prancheta "Itens do mapa (drops)").
 * - `frames.json`: molduras dos ícones (prancheta "Crônico: ícones, dano e paisagem").
 * - `molecules.json`: moléculas como átomos e ligações, em unidades do mundo, e o estilo de cada
 *   elemento.
 * - `ui.json`: ícones de 8×8 do menu, organismo, cadeado e formas (moeda, estrela, escudo).
 * - `world.json`: chão, gema, elétron, disparo e moeda, que o gerador desenha a partir destes
 *   números.
 * - `map.json`: tiles de chão e objetos de 16×16 dos ambientes da fase 5.7 (prancheta "Mapas:
 *   objetos e chão", docs/mapas.md). Os tiles usam as letras 1 a 4 com as
 *   cores de `floor` de cada ambiente; os objetos usam `palette.json`.
 */
import framesJson from './frames.json';
import iconsJson from './icons.json';
import mapJson from './map.json';
import moleculesJson from './molecules.json';
import paletteJson from './palette.json';
import uiJson from './ui.json';
import worldJson from './world.json';

/** Grade de pixels: uma string por linha, um caractere por pixel; '.' é transparente. */
export type PixelGrid = readonly string[];

/**
 * `stats`: atributos sem modificador no level up (só no Laboratório), desenhados no jogo.
 * `items`: itens do mapa da fase 5.5 (prancheta "Itens do mapa (drops)"), ainda sem uso no jogo.
 */
export type IconGroup =
  'weapons' | 'passives' | 'specials' | 'stats' | 'items' | 'supplements' | 'structures';

/** Cor em `#RRGGBB` para cada letra das grades de ícone. */
export const ICON_PALETTE: Readonly<Record<string, string>> = paletteJson;

export const ICON_SIZE = 16;

export const ICONS: Readonly<Record<IconGroup, Readonly<Record<string, PixelGrid>>>> = iconsJson;

export type FrameKind =
  'weapon' | 'ready' | 'evolved' | 'passive' | 'buff' | 'debuff' | 'empty' | 'locked';

export interface FrameStyle {
  border: string;
  inset?: string;
  fill: string;
  dashed?: boolean;
  lock?: boolean;
}

export const FRAMES: Readonly<Record<FrameKind, FrameStyle>> = framesJson;

export type Element = 'C' | 'H' | 'O' | 'N' | 'S' | 'Cl' | 'Mg';

/** Átomo: elemento e posição em unidades do mundo, com o centro da molécula em (0, 0). */
export type AtomDef = readonly [Element, number, number];
/** Ligação entre dois átomos; o terceiro valor 2 é ligação dupla. */
export type BondDef = readonly [number, number] | readonly [number, number, 2];

export interface MoleculeDef {
  atoms: readonly AtomDef[];
  bonds: readonly BondDef[];
}

/** Nome de uma cor de `PALETTE` (src/game/render/palette.ts). */
export type PaletteName = string;

/** Átomo da prancheta "Sprites de moléculas": miolo, borda escura e brilho, em #RRGGBB. */
export interface ElementStyle {
  fill: string;
  dark: string;
  light: string;
  /** Diâmetro em unidades do mundo. */
  size: number;
}

export const ELEMENTS: Readonly<Record<Element, ElementStyle>> = moleculesJson.elements;

/** Cor das ligações entre os átomos. */
export const BOND_COLOR: string = moleculesJson.bond;

export const MOLECULES = moleculesJson.molecules as unknown as Readonly<
  Record<string, MoleculeDef>
>;

export interface ColoredGrid {
  colors: Readonly<Record<string, PaletteName>>;
  rows: PixelGrid;
}

export const UI_SPRITES: {
  icons: Readonly<Record<string, PixelGrid>>;
  body: ColoredGrid;
  lock: ColoredGrid;
  shapes: Readonly<Record<'octagon' | 'star' | 'shield', readonly (readonly number[])[]>>;
  /** Ícone de 16×16 para o que ainda não tem desenho. */
  missingIcon: PixelGrid;
  /** Cadeado de 16×16 dos espaços bloqueados. */
  lockedIcon: PixelGrid;
} = uiJson;

/** Bolinha octogonal do campo (gema, elétron, disparo, moeda): borda, miolo e brilho. */
export interface OrbStyle {
  /** Lado em unidades do mundo. */
  size: number;
  border: string;
  fill: string;
  light: string;
}

/**
 * Mapas (fase 5.7): `floor` dá as cores 1 a 4 de cada ambiente; `tiles` são grades de 16×16 com
 * essas letras; `objects` são grades de 16×16 com a paleta dos ícones.
 */
export const MAP_SPRITES: {
  floor: Readonly<Record<string, Readonly<Record<string, string>>>>;
  tiles: Readonly<Record<string, PixelGrid>>;
  objects: Readonly<Record<string, PixelGrid>>;
} = mapJson;

export const WORLD_SPRITES: {
  ground: { fill: string; line: string; lineWidth: number };
  gem: OrbStyle;
  electron: OrbStyle;
  shot: OrbStyle;
  coin: OrbStyle;
} = worldJson;
