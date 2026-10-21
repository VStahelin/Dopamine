import type * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { drawIcon, drawInkBox, drawLock, drawWoodFrame } from './icons';
import type { SectionDef } from './menuContent';
import { bodyText, impactText, labelText, withShadow } from './theme';

const ROW_H = 18;

/**
 * Formato comum de placeholder, como no artboard "Menu principal (protótipo)": ícone grande numa
 * moldura de madeira, título, uma frase do que vai ter ali e o selo vermelho "EM BREVE · FASE N".
 * Embaixo, quando houver, itens de exemplo (liberados ou com cadeado). Centralizado na área dada.
 */
export function renderSection(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  def: SectionDef,
): Phaser.GameObjects.GameObject[] {
  const cx = Math.floor(x + w / 2);
  const out: Phaser.GameObjects.GameObject[] = [];
  const g = scene.add.graphics();
  out.push(g);

  const title = scene.add
    .text(
      cx,
      0,
      def.title,
      withShadow(impactText(30, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
    )
    .setOrigin(0.5, 0);
  const text = scene.add
    .text(cx, 0, def.text, {
      ...bodyText(15, PALETTE_CSS.textSoft),
      align: 'center',
      wordWrap: { width: Math.min(w - 64, 340) },
      lineSpacing: 4,
    })
    .setOrigin(0.5, 0);
  const tag = scene.add
    .text(
      cx,
      0,
      def.phase ? `EM BREVE · ${def.phase}` : 'EM BREVE',
      labelText(12, PALETTE_CSS.tagText),
    )
    .setOrigin(0.5, 0);
  out.push(title, text, tag);

  const examples = def.examples ?? [];
  const listH =
    examples.length > 0 ? Math.min(h * 0.45, 24 + examples[0]!.items.length * ROW_H) : 0;
  const block = 96 + 16 + title.height + 12 + text.height + 16 + 30 + (listH ? 20 + listH : 0);
  let cursor = Math.floor(y + Math.max(8, (h - block) / 2));

  // Ícone grande numa moldura de madeira.
  drawWoodFrame(g, cx - 48, cursor, 96, 96);
  g.fillStyle(PALETTE.panel).fillRect(cx - 41, cursor + 7, 82, 82);
  if (def.icon) drawIcon(g, def.icon, cx - 28, cursor + 20, PALETTE.textLight, 7);
  cursor += 96 + 16;

  title.setY(cursor);
  cursor += title.height + 12;
  text.setY(cursor);
  cursor += text.height + 16;

  // Selo vermelho.
  const tw = tag.width + 24;
  g.fillStyle(PALETTE.outline).fillRect(cx - tw / 2, cursor, tw, 26);
  g.fillStyle(PALETTE.darkRed).fillRect(cx - tw / 2 + 3, cursor + 3, tw - 6, 20);
  tag.setY(cursor + 7);
  cursor += 30 + 20;

  // Itens de exemplo, cada grupo numa caixa.
  const width = Math.min(w - 32, 340);
  const left = Math.floor(cx - width / 2);
  for (const group of examples) {
    const room = Math.floor((y + h - cursor - 30) / ROW_H);
    if (room < 1) break;
    const shown = group.items.slice(0, room);
    const boxH = 26 + shown.length * ROW_H;
    drawInkBox(g, left, cursor, width, boxH);
    out.push(scene.add.text(left + 12, cursor + 8, group.label, labelText(8, PALETTE_CSS.water)));
    shown.forEach((item, i) => {
      const ry = cursor + 22 + i * ROW_H;
      const color = item.unlocked ? PALETTE_CSS.text : PALETTE_CSS.textMuted;
      if (!item.unlocked) drawLock(g, left + 12, ry + 3);
      out.push(scene.add.text(left + 24, ry, item.name, bodyText(11, color)));
      if (item.note) {
        out.push(
          scene.add
            .text(
              left + width - 12,
              ry + 2,
              item.note,
              labelText(8, item.unlocked ? PALETTE_CSS.gold : PALETTE_CSS.textMuted),
            )
            .setOrigin(1, 0),
        );
      }
    });
    cursor += boxH + 10;
  }
  return out;
}
