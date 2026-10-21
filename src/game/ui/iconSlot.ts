import * as Phaser from 'phaser';
import { FRAMES, ICON_SIZE, type FrameKind } from '../../assets/sprites';
import { PASSIVES, WEAPONS, type PassiveId, type WeaponId } from '../../config';
import type { WeaponInstance } from '../../core/run/state';
import type { UpgradeChoice } from '../../core/run/upgrades';
import { weaponMaxLevel } from '../../core/run/weaponParams';
import { PALETTE_CSS, paletteColor } from '../render/palette';
import { iconTexture, LOCKED_ICON } from '../render/textures';
import { labelText } from './theme';

/** O que um espaço de ícone mostra: moldura, ícone e o rótulo do canto (nível, MAX, EVO). */
export interface SlotContent {
  frame: FrameKind;
  icon?: string;
  label?: string;
  /** Rótulo dourado (MAX, EVO). */
  gold?: boolean;
}

/** Espessura da borda e do filete da moldura em cada escala do ícone. */
function frameLine(scale: number): number {
  return scale >= 3 ? 3 : 2;
}

/** Lado do espaço com moldura para um ícone de 16×16 em `scale` (1 → 24, 2 → 40, 3 → 60). */
export function slotSize(scale: number): number {
  return ICON_SIZE * scale + frameLine(scale) * 4;
}

/**
 * Textura da moldura de um tipo e escala, desenhada uma vez e reaproveitada por todos os espaços.
 * Um Graphics por espaço era redesenhado a cada quadro e travava listas grandes (Arsenal).
 */
function frameTexture(scene: Phaser.Scene, kind: FrameKind, scale: number): string {
  const key = `frame-${kind}-${scale}`;
  if (!scene.textures.exists(key)) {
    const size = slotSize(scale);
    const g = scene.make.graphics({}, false);
    drawFrame(g, 0, 0, size, frameLine(scale), kind);
    g.generateTexture(key, size, size);
    g.destroy();
  }
  return key;
}

/**
 * Espaço de ícone com moldura do tipo (prancheta "Crônico: ícones, dano e paisagem"): arma,
 * pronta para evoluir, evoluída, reagente, efeito, efeito negativo, livre e bloqueado. Fica
 * pronto para ser atualizado a cada quadro: só troca as texturas quando o conteúdo muda.
 */
export class IconSlot {
  readonly size: number;
  readonly objects: Phaser.GameObjects.GameObject[];
  private readonly frame: Phaser.GameObjects.Image;
  private readonly image: Phaser.GameObjects.Image;
  /** Rótulo do canto; só existe em espaços que mostram nível (texto custa uma textura). */
  private readonly text?: Phaser.GameObjects.Text;
  private current = '';

  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    readonly scale: number,
    withLabel = true,
  ) {
    this.size = slotSize(scale);
    const inset = frameLine(scale) * 2;
    this.frame = scene.add.image(x, y, '__DEFAULT').setOrigin(0).setVisible(false);
    this.image = scene.add
      .image(x + inset, y + inset, '__DEFAULT')
      .setOrigin(0)
      .setScale(scale)
      .setVisible(false);
    this.objects = [this.frame, this.image];
    if (withLabel) {
      this.text = scene.add
        .text(x + this.size + 3, y + this.size + 4, '', {
          ...labelText(scale >= 2 ? 9 : 8),
          stroke: PALETTE_CSS.ink,
          strokeThickness: 2,
        })
        .setOrigin(1, 1);
      this.objects.push(this.text);
    }
  }

  set(content: SlotContent | undefined): this {
    const key = content ? JSON.stringify(content) : '';
    if (key === this.current) return this;
    this.current = key;
    this.frame.setVisible(false);
    this.image.setVisible(false);
    this.text?.setText('');
    if (!content) return this;

    this.frame.setTexture(frameTexture(this.scene, content.frame, this.scale)).setVisible(true);
    const icon = content.frame === 'locked' ? LOCKED_ICON : content.icon;
    if (icon) this.image.setTexture(icon).setVisible(true);
    this.text
      ?.setText(content.label ?? '')
      .setColor(content.gold ? PALETTE_CSS.goldIcon : PALETTE_CSS.white);
    return this;
  }

  setVisible(visible: boolean): this {
    for (const o of this.objects) (o as Phaser.GameObjects.Image).setVisible(visible);
    if (visible && !this.current) {
      this.frame.setVisible(false);
      this.image.setVisible(false);
    }
    return this;
  }
}

/** Desenha a moldura de um espaço de ícone. */
export function drawFrame(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  line: number,
  kind: FrameKind,
): void {
  const f = FRAMES[kind];
  const border = paletteColor(f.border);
  if (f.dashed) {
    g.fillStyle(paletteColor(f.fill)).fillRect(x, y, size, size);
    g.fillStyle(border);
    const dash = line * 2;
    for (let i = 0; i < size; i += dash * 2) {
      const len = Math.min(dash, size - i);
      g.fillRect(x + i, y, len, line).fillRect(x + i, y + size - line, len, line);
      g.fillRect(x, y + i, line, len).fillRect(x + size - line, y + i, line, len);
    }
    return;
  }
  g.fillStyle(border).fillRect(x, y, size, size);
  let inner = line;
  if (f.inset) {
    g.fillStyle(paletteColor(f.inset)).fillRect(
      x + line,
      y + line,
      size - line * 2,
      size - line * 2,
    );
    inner += line;
  }
  g.fillStyle(paletteColor(f.fill)).fillRect(
    x + inner,
    y + inner,
    size - inner * 2,
    size - inner * 2,
  );
}

/** Ícone de uma arma da run: nível, MAX (pronta para evoluir) ou EVO. */
export function weaponSlot(w: WeaponInstance): SlotContent {
  const def = WEAPONS[w.id];
  const icon = iconTexture('weapons', w.id);
  if (def.source === 'evolution') return { frame: 'evolved', icon, label: 'EVO', gold: true };
  if (w.level >= weaponMaxLevel(def)) {
    const reagent = def.evolution?.reagent as PassiveId | undefined;
    // Pronta para evoluir: a arma pede um reagente (ele pode ainda faltar).
    const ready = reagent !== undefined;
    return { frame: ready ? 'ready' : 'weapon', icon, label: 'MAX', gold: ready };
  }
  return { frame: 'weapon', icon, label: String(w.level) };
}

/** Ícone de um modificador com o nível; Estresse aparece como efeito negativo. */
export function passiveSlot(id: PassiveId, level: number): SlotContent {
  const def = PASSIVES[id];
  return {
    frame: def.stat === 'curse' ? 'debuff' : 'passive',
    icon: iconTexture('passives', id),
    label: level >= def.maxLevel ? 'MAX' : String(level),
    gold: level >= def.maxLevel,
  };
}

/** Ícone de uma arma fora da run (menu, level up), sem nível. */
export function weaponIcon(id: WeaponId): SlotContent {
  const evolved = WEAPONS[id].source === 'evolution';
  return { frame: evolved ? 'evolved' : 'weapon', icon: iconTexture('weapons', id) };
}

/** Ícone de uma opção de level up. */
export function choiceSlot(choice: UpgradeChoice): SlotContent {
  switch (choice.kind) {
    case 'weapon':
      return weaponIcon(choice.id);
    case 'evolve':
      return {
        frame: 'evolved',
        icon: iconTexture('weapons', choice.into),
        label: 'EVO',
        gold: true,
      };
    case 'passive':
      return { ...passiveSlot(choice.id, 0), label: undefined };
    case 'heal':
      return { frame: 'buff', icon: iconTexture('passives', 'homeostasis') };
  }
}

/** Espaços de uma linha da HUD ou da pausa: os itens, os livres e os bloqueados até 6. */
export function rowSlots(items: SlotContent[], open: number, total = 6): SlotContent[] {
  const out = items.slice(0, total);
  while (out.length < total) out.push({ frame: out.length < open ? 'empty' : 'locked' });
  return out;
}

/** Atalho para um espaço estático (menu, level up): cria e já mostra. */
export function addIconSlot(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number,
  content: SlotContent,
): IconSlot {
  return new IconSlot(scene, x, y, scale, Boolean(content.label)).set(content);
}
