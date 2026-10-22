import * as Phaser from 'phaser';
import { closeCapsule } from '../../core/run/items';
import type { CapsuleItem, RunState } from '../../core/run/state';
import type { UpgradeChoice } from '../../core/run/upgrades';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIcon, iconTexture } from '../render/textures';
import { addButton } from '../ui/button';
import { addIconSlot, choiceSlot } from '../ui/iconSlot';
import { bodyText, hudLabelText, impactText, labelText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { describeChoice } from '../ui/upgradeText';
import { SCENES } from './keys';

interface CapsuleData {
  run: RunState;
  onDone: () => void;
}

/** Ignora toques logo que a tela abre, como no level up. */
const INPUT_DELAY_MS = 350;
const ROW_H = 40;

const hex = (color: string) => parseInt(color.slice(1), 16);

/** A Fosfocreatina vira a opção de mesmo nome do level up, para o texto e o ícone. */
function asChoice(item: CapsuleItem): UpgradeChoice {
  return item.kind === 'phosphocreatine' ? { kind: 'phosphocreatine', coins: 0 } : item;
}

/**
 * Cápsula do chefe aberta (fase 5.5, docs/itens.md): o que subiu, a evolução na de prata e o
 * ATP. A run fica parada até o jogador continuar.
 */
export class CapsuleScene extends Phaser.Scene {
  private data_!: CapsuleData;
  private root?: Phaser.GameObjects.Container;
  private openedAt = 0;

  constructor() {
    super(SCENES.capsule);
  }

  create(data: CapsuleData): void {
    this.data_ = data;
    this.openedAt = this.time.now;
    this.input.keyboard?.on('keydown-ENTER', () => this.done());
    this.input.keyboard?.on('keydown-SPACE', () => this.done());
    setupUiLayout(this, (w, h) => this.build(w, h));
  }

  private build(w: number, h: number): void {
    this.root?.destroy();
    const capsule = this.data_.run.capsule;
    if (!capsule) return;
    const cardW = Math.min(w - 24, 320);
    const left = Math.floor((w - cardW) / 2);
    const total = 92 + capsule.items.length * (ROW_H + 6) + 30 + 48;
    const top = Math.max(12, Math.floor((h - total) / 2));
    const children: Phaser.GameObjects.GameObject[] = [
      addDim(this, w, h),
      addIcon(
        this,
        w / 2 - 24,
        top,
        iconTexture('items', capsule.silver ? 'capsuleSilver' : 'capsuleBronze'),
        48,
      ),
      this.add
        .text(
          w / 2,
          top + 52,
          capsule.silver ? 'CÁPSULA DE PRATA' : 'CÁPSULA DE BRONZE',
          impactText(20, capsule.silver ? PALETTE_CSS.cream : PALETTE_CSS.logoOrange),
        )
        .setOrigin(0.5, 0),
      this.add
        .text(w / 2, top + 76, 'O CHEFE DEIXOU', labelText(8, PALETTE_CSS.cream))
        .setOrigin(0.5, 0),
    ];

    capsule.items.forEach((item, i) => {
      const y = top + 92 + i * (ROW_H + 6);
      const choice = asChoice(item);
      const text = describeChoice(choice);
      const frame = text.rarity ? hex(text.rarity.color) : PALETTE.water;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.outline).fillRect(left, y, cardW, ROW_H);
      g.fillStyle(frame).fillRect(left + 2, y + 2, cardW - 4, ROW_H - 4);
      g.fillStyle(PALETTE.panel).fillRect(left + 5, y + 5, cardW - 10, ROW_H - 10);
      children.push(g, ...addIconSlot(this, left + 10, y + 6, 1, choiceSlot(choice)).objects);
      const textX = left + 44;
      children.push(this.add.text(textX, y + 7, text.title, impactText(12)));
      const tag =
        item.kind === 'phosphocreatine'
          ? `+${Math.floor(item.atp)} ATP`
          : [text.rarity?.name.toUpperCase(), text.level].filter(Boolean).join(' · ');
      children.push(
        this.add
          .text(
            left + cardW - 10,
            y + 9,
            tag,
            hudLabelText(8, text.rarity?.color ?? PALETTE_CSS.water),
          )
          .setOrigin(1, 0),
        this.add.text(textX, y + 23, text.description, {
          ...bodyText(9, PALETTE_CSS.cream),
          wordWrap: { width: left + cardW - 12 - textX },
          maxLines: 1,
        }),
      );
    });

    const by = top + 92 + capsule.items.length * (ROW_H + 6);
    children.push(
      this.add
        .text(w / 2, by + 4, `+${Math.floor(capsule.atp)} ATP`, impactText(16, PALETTE_CSS.gold))
        .setOrigin(0.5, 0),
      addButton(this, {
        x: left,
        y: by + 30,
        width: cardW,
        height: 44,
        label: 'CONTINUAR',
        fontSize: 16,
        onClick: () => this.done(),
      }),
    );
    this.root = this.add.container(0, 0, children);
  }

  private done(): void {
    if (this.time.now - this.openedAt < INPUT_DELAY_MS) return;
    closeCapsule(this.data_.run);
    this.data_.onDone();
    this.scene.stop();
  }
}
