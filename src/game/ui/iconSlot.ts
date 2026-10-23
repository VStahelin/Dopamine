import * as Phaser from 'phaser';
import { ICON_SIZE, type FrameKind } from '../../assets/sprites';
import { PASSIVES, WEAPONS, type PassiveId, type WeaponId } from '../../config';
import type { WeaponInstance } from '../../core/run/state';
import type { UpgradeChoice } from '../../core/run/upgrades';
import { weaponMaxLevel } from '../../core/run/weaponParams';
import { PALETTE_CSS } from '../render/palette';
import { frameLine, slotSize } from '../render/spriteArt';
import { frameKey, iconKey, iconTexture, LOCKED_ICON, type IconRef } from '../render/textures';
import { labelText } from './theme';

/** O que um espaço de ícone mostra: moldura, ícone e o rótulo do canto (nível, MAX, EVO). */
export interface SlotContent {
  frame: FrameKind;
  icon?: IconRef;
  label?: string;
  /** Rótulo dourado (MAX, EVO). */
  gold?: boolean;
  /** Ícone apagado (ainda não disponível, como um nó bloqueado do Laboratório). */
  dim?: boolean;
}

export { slotSize };

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

    this.frame.setTexture(frameKey(content.frame, this.scale)).setVisible(true);
    const icon = content.frame === 'locked' ? LOCKED_ICON : content.icon;
    if (icon) {
      const px = ICON_SIZE * this.scale;
      this.image
        .setTexture(iconKey(this.scene, icon, px))
        .setDisplaySize(px, px)
        .setAlpha(content.dim ? 0.35 : 1)
        .setVisible(true);
    }
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

/** Ícone de um suplemento (fase 5.9), com o número de cópias quando passa de uma. */
export function supplementSlot(id: string, copies = 0): SlotContent {
  return {
    frame: 'passive',
    icon: iconTexture('supplements', id),
    label: copies > 1 ? `×${copies}` : undefined,
  };
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
    case 'phosphocreatine':
      return { frame: 'buff', icon: iconTexture('items', 'phosphocreatine') };
    case 'boost':
      return { ...passiveSlot(choice.id, 0), label: undefined };
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
