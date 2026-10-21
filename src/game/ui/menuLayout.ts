import type * as Phaser from 'phaser';
import { addButton, type ButtonVariant } from './button';

export interface MenuItem {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

/** Coluna de botões centralizada, começando em `top`. Devolve os botões e onde a coluna acaba. */
export function addButtonColumn(
  scene: Phaser.Scene,
  width: number,
  top: number,
  items: MenuItem[],
): { buttons: Phaser.GameObjects.Container[]; bottom: number } {
  const bw = Math.min(width - 32, 220);
  const bh = 40;
  const gap = 10;
  const buttons = items.map((item, i) =>
    addButton(scene, {
      x: Math.floor((width - bw) / 2),
      y: top + i * (bh + gap),
      width: bw,
      height: bh,
      label: item.label,
      onClick: item.onClick,
      variant: item.variant ?? (i === 0 ? 'primary' : 'secondary'),
    }),
  );
  return { buttons, bottom: top + items.length * (bh + gap) - gap };
}
