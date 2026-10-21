/**
 * Toda a pixel art do jogo, como dados (decisão 0019). Esta pasta só tem desenhos e o índice
 * que os liga aos ids da configuração; quem transforma tudo em texturas é
 * `src/game/render/textures.ts`.
 *
 * - `palette.json`: letras das grades de ícone, as mesmas do canvas de identidade visual.
 * - `icons.json`: ícones de 16×16 do canvas (prancheta "Ícones de armas e habilidades"), por
 *   arma, modificador e especial.
 * - `frames.json`: molduras dos ícones (prancheta "Crônico: ícones, dano e paisagem").
 * - `molecules.json`: moléculas como átomos e ligações, em unidades do mundo.
 * - `ui.json`: ícones de 8×8 do menu, organismo, cadeado e formas (moeda, estrela, escudo).
 * - `world.json`: chão, gema e elétron, que o gerador desenha a partir destes números.
 */
import framesJson from './frames.json';
import iconsJson from './icons.json';
import moleculesJson from './molecules.json';
import paletteJson from './palette.json';
import uiJson from './ui.json';
import worldJson from './world.json';

/** Grade de pixels: uma string por linha, um caractere por pixel; '.' é transparente. */
export type PixelGrid = readonly string[];

export type IconGroup = 'weapons' | 'passives' | 'specials';

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

export type Element = 'C' | 'H' | 'O' | 'N' | 'S';

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

export const ELEMENTS: Readonly<Record<Element, { color: PaletteName; size: number }>> =
  moleculesJson.elements;

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

export const WORLD_SPRITES = worldJson;
