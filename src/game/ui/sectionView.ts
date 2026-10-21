import type * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { drawPanel } from './button';
import { drawLock } from './icons';
import type { SectionDef } from './menuContent';
import { bodyText, hudLabelText, impactText, labelText } from './theme';

const ROW_H = 18;

/**
 * Formato comum de placeholder (docs/menu.md): título, uma frase do que vai ter ali, o selo
 * "EM BREVE · FASE N" e, quando houver, itens de exemplo (liberados ou com cadeado).
 * Desenha dentro do retângulo dado e devolve os objetos criados.
 */
export function renderSection(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  def: SectionDef,
): Phaser.GameObjects.GameObject[] {
  const cx = x + w / 2;
  const width = Math.min(w - 16, 320);
  const left = Math.floor(cx - width / 2);
  const out: Phaser.GameObjects.GameObject[] = [];

  out.push(scene.add.text(cx, y, def.title, impactText(20)).setOrigin(0.5, 0));
  const text = scene.add
    .text(cx, y + 28, def.text, {
      ...bodyText(10, PALETTE_CSS.cream),
      align: 'center',
      wordWrap: { width },
    })
    .setOrigin(0.5, 0);
  out.push(text);
  let cursor = y + 32 + text.height;
  const tag = def.phase ? `EM BREVE · ${def.phase}` : 'EM BREVE';
  out.push(scene.add.text(cx, cursor, tag, hudLabelText(8, PALETTE_CSS.gold)).setOrigin(0.5, 0));
  cursor += 18;

  for (const group of def.examples ?? []) {
    const room = Math.floor((y + h - cursor - 34) / ROW_H);
    if (room < 1) break;
    const shown = group.items.slice(0, room);
    const panelH = 26 + shown.length * ROW_H;
    const g = drawPanel(scene.add.graphics(), left, cursor, width, panelH);
    out.push(g);
    out.push(scene.add.text(left + 12, cursor + 9, group.label, labelText(7, PALETTE_CSS.water)));
    shown.forEach((item, i) => {
      const ry = cursor + 22 + i * ROW_H;
      const color = item.unlocked ? PALETTE_CSS.hydrogen : '#8A8FB8';
      if (!item.unlocked) drawLock(g, left + 12, ry + 2);
      out.push(scene.add.text(left + 24, ry, item.name, bodyText(10, color)));
      if (item.note) {
        out.push(
          scene.add
            .text(
              left + width - 12,
              ry + 2,
              item.note,
              labelText(7, item.unlocked ? PALETTE_CSS.gold : '#8A8FB8'),
            )
            .setOrigin(1, 0),
        );
      }
    });
    if (shown.length < group.items.length) {
      g.fillStyle(PALETTE.panelLight).fillRect(left + 8, cursor + panelH - 4, width - 16, 1);
    }
    cursor += panelH + 8;
  }
  return out;
}
