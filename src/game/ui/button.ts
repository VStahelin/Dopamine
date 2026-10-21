import type * as Phaser from 'phaser';
import { PALETTE } from '../render/palette';
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

const COLORS = {
  primary: { fill: PALETTE.wood, light: PALETTE.woodLight, dark: PALETTE.woodDark },
  secondary: { fill: PALETTE.panel, light: PALETTE.panelLight, dark: PALETTE.panelDark },
} as const;

/**
 * Botão da aba Design: retângulo sem cantos arredondados, contorno escuro, faixa de brilho em
 * cima e de sombra embaixo. Dispara ao soltar o dedo ou o clique em cima dele.
 */
export function addButton(scene: Phaser.Scene, opts: ButtonOptions): Phaser.GameObjects.Container {
  const { x, y, width: w, height: h, variant = 'primary' } = opts;
  const c = COLORS[variant];
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const text = scene.add
    .text(w / 2, h / 2, opts.label, impactText(opts.fontSize ?? 14))
    .setOrigin(0.5);

  const draw = (pressed: boolean) => {
    const o = 3;
    g.clear();
    g.fillStyle(PALETTE.outline).fillRect(0, 0, w, h);
    g.fillStyle(c.fill).fillRect(o, o, w - o * 2, h - o * 2);
    if (pressed) {
      g.fillStyle(c.dark).fillRect(o, o, w - o * 2, 3);
    } else {
      g.fillStyle(c.light).fillRect(o, o, w - o * 2, 3);
      g.fillStyle(c.dark).fillRect(o, h - o - 4, w - o * 2, 4);
    }
    text.setY(h / 2 + (pressed ? 1 : -1));
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
  g.fillStyle(PALETTE.wood).fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle(PALETTE.panel).fillRect(x + 5, y + 5, w - 10, h - 10);
  return g;
}
