import {
  FRAMES,
  ICON_SIZE,
  ICONS,
  MAP_SPRITES,
  MOLECULES,
  UI_SPRITES,
  WORLD_SPRITES,
  type FrameKind,
  type IconGroup,
} from '../../assets/sprites';
import { DISPLAY } from '../../config';
import {
  paintFrame,
  paintGem,
  paintGrid,
  paintGround,
  paintMolecule,
  paintOrb,
  paintTile,
  slotSize,
  type Painter,
  type Size,
} from './spriteArt';
import {
  logoHorizontal,
  logoSmall,
  logoStacked,
  paintAppIcon,
  paintFavicon,
  paintLogoGrid,
  paintMaskableIcon,
  paintStoreArt,
  type LogoVariant,
} from './logoArt';

/**
 * Todos os PNGs de sprite (decisão 0020): onde ficam em `public/sprites/`, com que chave o jogo
 * os carrega e como são pintados a partir dos dados de `src/assets/sprites/`. O gerador
 * (`npm run sprites:build`) e o carregamento no jogo leem esta mesma lista.
 *
 * - `icons/<px>/<grupo>/<id>.png`: ícones de 16×16 em cada tamanho de `iconSizesPx`.
 * - `frames/<px>/<tipo>.png`: molduras dos espaços de ícone, uma por escala.
 * - `world/<detail>x/...`: moléculas, chão, gema, elétron, disparo e moeda, um por detail, e o
 *   mapa (`map/tiles` e `map/objects`, fase 5.7).
 * - `logo/`: a logo em 1× (empilhada, horizontal e pequena), que o jogo carrega, e em 4× em cada
 *   variante, para quem precisar da imagem (docs/logo.md).
 * - `pwa/` e `store/`: favicon, ícones do PWA e artes de loja; só publicados, o jogo não carrega.
 */
export interface SpriteFile {
  /** Caminho dentro de public/sprites. */
  path: string;
  /** Chave da textura no Phaser. */
  key: string;
  paint: (p: Painter) => Size;
  /** Ícones: tamanho em pixels, para carregar só os que a tela usa. */
  iconPx?: number;
  /** `false`: só arquivo publicado (ícones do PWA, artes de loja); o jogo não carrega. */
  preload?: false;
}

/**
 * Atlas em que o sprite também entra (PERF-2): uma imagem por tamanho de ícone, uma por detail do
 * mundo e uma das molduras. O jogo baixa os atlas e recorta cada sprite com a chave dele, em vez
 * de baixar centenas de PNGs. Logo, PWA e loja ficam soltos.
 */
export function atlasName(file: SpriteFile): string | undefined {
  if (file.preload === false) return undefined;
  const [top, sub] = file.path.split('/');
  if (top === 'icons') return `icons-${sub}`;
  if (top === 'world') return `world-${sub}`;
  if (top === 'frames') return 'frames';
  return undefined;
}

/** Ícone por grupo e id; `ui` guarda o ícone padrão (`missing`) e o cadeado (`locked`). */
export interface IconRef {
  group: IconGroup | 'ui';
  id: string;
}

const UI_ICONS: Record<string, readonly string[]> = {
  missing: UI_SPRITES.missingIcon,
  locked: UI_SPRITES.lockedIcon,
};

export function iconFileKey(ref: IconRef, px: number): string {
  return `icon-${ref.group}-${ref.id}@${px}`;
}

export function frameFileKey(kind: FrameKind, scale: number): string {
  return `frame-${kind}-${scale}`;
}

/** Chave da textura de um sprite do mundo com `detail` pixels de arte por unidade. */
export function textureKey(name: string, detail: number): string {
  return `${name}@${detail}`;
}

/** Tile de chão do mapa (fase 5.7) pelo id de map.json, como `blood_base`. */
export function mapTileName(id: string): string {
  return `tile-${id}`;
}

/** Objeto do mapa (obstáculo, destrutível, decoração) pelo id de map.json. */
export function mapObjectName(id: string): string {
  return `obj-${id}`;
}

/** Sprite de molécula (agente, inimigo ou projétil) pelo id de molecules.json. */
export function moleculeName(id: string): string {
  return `mol-${id}`;
}

/** Logo em 1× no jogo: `logo-stacked`, `logo-horizontal` e `logo-small`. */
export const LOGO_KEYS = {
  stacked: 'logo-stacked',
  horizontal: 'logo-horizontal',
  small: 'logo-small',
} as const;

export const WORLD_NAMES = {
  ground: 'ground',
  gem: 'gem',
  electron: 'electron',
  shot: 'shot',
  coin: 'coin',
  shotVitamin: 'shotVitamin',
  shotCaffeine: 'shotCaffeine',
  ally: 'ally',
} as const;

function grid(ref: IconRef): readonly string[] | undefined {
  return ref.group === 'ui' ? UI_ICONS[ref.id] : ICONS[ref.group][ref.id];
}

export function hasIcon(ref: IconRef): boolean {
  return grid(ref) !== undefined;
}

export function spriteFiles(): SpriteFile[] {
  const out: SpriteFile[] = [];
  const refs: IconRef[] = [
    ...Object.entries(ICONS).flatMap(([group, icons]) =>
      Object.keys(icons).map((id) => ({ group: group as IconGroup, id })),
    ),
    ...Object.keys(UI_ICONS).map((id) => ({ group: 'ui' as const, id })),
  ];
  for (const px of DISPLAY.iconSizesPx) {
    for (const ref of refs) {
      const rows = grid(ref)!;
      out.push({
        path: `icons/${px}/${ref.group}/${ref.id}.png`,
        key: iconFileKey(ref, px),
        paint: (p) => paintGrid(p, rows, px / ICON_SIZE),
        iconPx: px,
      });
    }
  }
  for (const scale of DISPLAY.frameScales) {
    for (const kind of Object.keys(FRAMES) as FrameKind[]) {
      out.push({
        path: `frames/${slotSize(scale)}/${kind}.png`,
        key: frameFileKey(kind, scale),
        paint: (p) => paintFrame(p, kind, scale),
      });
    }
  }
  for (const detail of DISPLAY.spriteDetails) {
    const dir = `world/${detail}x`;
    for (const [id, def] of Object.entries(MOLECULES)) {
      out.push({
        path: `${dir}/molecules/${id}.png`,
        key: textureKey(moleculeName(id), detail),
        paint: (p) => paintMolecule(p, def, detail),
      });
    }
    out.push(
      {
        path: `${dir}/ground.png`,
        key: textureKey(WORLD_NAMES.ground, detail),
        paint: (p) => paintGround(p, detail),
      },
      {
        path: `${dir}/gem.png`,
        key: textureKey(WORLD_NAMES.gem, detail),
        paint: (p) => paintGem(p, detail),
      },
    );
    // Mapa (fase 5.7): tiles e objetos de 16×16 em 2×, ou seja, 32 unidades do mundo.
    for (const [id, rows] of Object.entries(MAP_SPRITES.tiles)) {
      const colors = MAP_SPRITES.floor[id.split('_')[0]!]!;
      out.push({
        path: `${dir}/map/tiles/${id}.png`,
        key: textureKey(mapTileName(id), detail),
        paint: (p) => paintTile(p, rows, colors, 2 * detail),
      });
    }
    for (const [id, rows] of Object.entries(MAP_SPRITES.objects)) {
      out.push({
        path: `${dir}/map/objects/${id}.png`,
        key: textureKey(mapObjectName(id), detail),
        paint: (p) => paintGrid(p, rows, 2 * detail),
      });
    }
    for (const orb of [
      'electron',
      'shot',
      'coin',
      'shotVitamin',
      'shotCaffeine',
      'ally',
    ] as const) {
      out.push({
        path: `${dir}/${orb}.png`,
        key: textureKey(WORLD_NAMES[orb], detail),
        paint: (p) => paintOrb(p, WORLD_SPRITES[orb], detail),
      });
    }
  }
  out.push(...logoFiles());
  return out;
}

function logoFiles(): SpriteFile[] {
  const out: SpriteFile[] = [];
  const logos = { stacked: logoStacked(), horizontal: logoHorizontal(), small: logoSmall() };
  const variants: Record<LogoVariant, string> = {
    color: '',
    monoCream: '-mono-creme',
    monoNight: '-mono-noite',
  };
  for (const [name, rows] of Object.entries(logos) as [keyof typeof logos, string[]][]) {
    out.push({
      path: `logo/${name}.png`,
      key: LOGO_KEYS[name],
      paint: (p) => paintLogoGrid(p, rows, 1),
    });
    for (const [variant, suffix] of Object.entries(variants) as [LogoVariant, string][]) {
      out.push({
        path: `logo/4x/${name}${suffix}.png`,
        key: `${LOGO_KEYS[name]}${suffix}@4`,
        paint: (p) => paintLogoGrid(p, rows, 4, variant),
        preload: false,
      });
    }
  }
  const only = (path: string, paint: SpriteFile['paint']): SpriteFile => ({
    path,
    key: path,
    paint,
    preload: false,
  });
  out.push(
    only('pwa/favicon-16.png', (p) => paintFavicon(p, 16)),
    only('pwa/favicon-32.png', (p) => paintFavicon(p, 32)),
    only('pwa/icon-192.png', (p) => paintAppIcon(p, 192)),
    only('pwa/icon-512.png', (p) => paintAppIcon(p, 512)),
    only('pwa/maskable-192.png', (p) => paintMaskableIcon(p, 192)),
    only('pwa/maskable-512.png', (p) => paintMaskableIcon(p, 512)),
    only('pwa/apple-touch-icon.png', (p) => paintMaskableIcon(p, 180)),
    only('store/banner-1024x500.png', (p) => paintStoreArt(p, 1024, 500)),
    only('store/splash-1080x1920.png', (p) => paintStoreArt(p, 1080, 1920)),
  );
  return out;
}
