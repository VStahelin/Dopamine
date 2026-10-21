import type * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { impactText } from './theme';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  fontSize?: number;
}

/**
 * Cores dos botões do guia de estilo (canvas de identidade visual): madeira para o principal,
 * azul-painel para o secundário. Cada um tem contorno, faixa de brilho em cima, faixa de sombra
 * embaixo e uma sombra dura por baixo do botão.
 */
const STYLE = {
  primary: {
    border: PALETTE.outline,
    fill: PALETTE.wood,
    hi: PALETTE.woodHi,
    shade: PALETTE.woodShade,
    drop: PALETTE.outline,
    text: '#FFFFFF',
    textOutline: PALETTE_CSS.woodOutline,
  },
  secondary: {
    border: PALETTE.ink,
    fill: PALETTE.panel,
    hi: PALETTE.panelHi,
    shade: PALETTE.panelShade,
    drop: PALETTE.ink,
    text: PALETTE_CSS.text,
    textOutline: PALETTE_CSS.ink,
  },
} as const;

/** Desenha a face de um botão; `pressed` afunda o botão sobre a própria sombra. */
export function drawButtonFace(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  variant: ButtonVariant,
  pressed: boolean,
): void {
  const s = STYLE[variant];
  const drop = variant === 'primary' ? 5 : 4;
  const top = pressed ? drop : 0;
  const face = h - drop;
  g.clear();
  if (!pressed) g.fillStyle(s.drop).fillRect(0, drop, w, face);
  g.fillStyle(s.border).fillRect(0, top, w, face);
  g.fillStyle(s.fill).fillRect(4, top + 4, w - 8, face - 8);
  if (!pressed) g.fillStyle(s.hi).fillRect(4, top + 4, w - 8, 3);
  g.fillStyle(s.shade).fillRect(4, top + face - 4 - (pressed ? 2 : 5), w - 8, pressed ? 2 : 5);
}

/** Botão do guia de estilo. Dispara ao soltar o dedo ou o clique em cima dele. */
export function addButton(scene: Phaser.Scene, opts: ButtonOptions): Phaser.GameObjects.Container {
  const { x, y, width: w, height: h, variant = 'primary' } = opts;
  const s = STYLE[variant];
  const drop = variant === 'primary' ? 5 : 4;
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const text = scene.add
    .text(w / 2, (h - drop) / 2, opts.label, {
      ...impactText(opts.fontSize ?? 14, s.text),
      stroke: s.textOutline,
    })
    .setOrigin(0.5);

  const draw = (pressed: boolean) => {
    drawButtonFace(g, w, h, variant, pressed);
    text.setY((h - drop) / 2 + (pressed ? drop : 0) - 1);
  };
  draw(false);

  const zone = scene.add.zone(w / 2, h / 2, w, h).setInteractive({ useHandCursor: true });
  let armed = false;
  zone.on('pointerdown', () => {
    armed = true;
    draw(true);
  });
  zone.on('pointerout', () => {
    armed = false;
    draw(false);
  });
  zone.on('pointerup', () => {
    draw(false);
    if (armed) opts.onClick();
    armed = false;
  });

  container.add([g, text, zone]);
  container.setSize(w, h);
  return container;
}

/** Painel azul-noite com moldura de madeira, para cartões e caixas. */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.Graphics {
  g.fillStyle(PALETTE.outline).fillRect(x, y, w, h);
  g.fillStyle(PALETTE.woodDark).fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle(PALETTE.woodLight).fillRect(x + 4, y + 4, w - 8, h - 8);
  g.fillStyle(PALETTE.woodDark).fillRect(x + 5, y + 5, w - 10, h - 10);
  g.fillStyle(PALETTE.panel).fillRect(x + 7, y + 7, w - 14, h - 14);
  return g;
}
