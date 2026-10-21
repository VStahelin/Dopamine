import * as Phaser from 'phaser';
import type { RunState } from '../../core/run/state';
import { applyChoice, levelUpOffer, type UpgradeChoice } from '../../core/run/upgrades';
import { PALETTE_CSS } from '../render/palette';
import { drawPanel } from '../ui/button';
import { bodyText, impactText, labelText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { describeChoice } from '../ui/upgradeText';
import { SCENES } from './keys';

interface LevelUpData {
  run: RunState;
  onDone: () => void;
}

const KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;

/** Tela de level up: 3 opções em cartões; teclas 1 a 3 também escolhem. */
export class LevelUpScene extends Phaser.Scene {
  private data_!: LevelUpData;
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };

  constructor() {
    super(SCENES.levelUp);
  }

  create(data: LevelUpData): void {
    this.data_ = data;
    KEYS.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => {
        const choice = levelUpOffer(this.data_.run)[i];
        if (choice) this.pick(choice);
      });
    });
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const run = this.data_.run;
    const offer = levelUpOffer(run);

    const cardW = Math.min(w - 24, 300);
    const cardH = 54;
    const gap = 8;
    const total = 44 + offer.length * (cardH + gap);
    const top = Math.max(12, Math.floor((h - total) / 2));
    const left = Math.floor((w - cardW) / 2);

    const children: Phaser.GameObjects.GameObject[] = [
      addDim(this, w, h),
      this.add
        .text(w / 2, top, `NÍVEL ${run.level}!`, impactText(22, PALETTE_CSS.water))
        .setOrigin(0.5, 0),
      this.add
        .text(w / 2, top + 28, 'ESCOLHA UM MODIFICADOR', labelText(8, PALETTE_CSS.cream))
        .setOrigin(0.5, 0),
    ];

    offer.forEach((choice, i) => {
      const y = top + 44 + i * (cardH + gap);
      const text = describeChoice(choice);
      const g = drawPanel(this.add.graphics(), left, y, cardW, cardH);
      children.push(
        g,
        this.add.text(left + 12, y + 9, text.title, impactText(13)),
        this.add
          .text(left + cardW - 12, y + 11, text.level, labelText(8, PALETTE_CSS.gold))
          .setOrigin(1, 0),
        this.add.text(left + 12, y + 29, text.description, bodyText(10, PALETTE_CSS.cream)),
        this.add
          .text(left + cardW - 12, y + cardH - 18, String(i + 1), labelText(8, PALETTE_CSS.water))
          .setOrigin(1, 0),
      );
      const zone = this.add
        .zone(left + cardW / 2, y + cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.pick(choice));
      children.push(zone);
    });

    this.root = this.add.container(0, 0, children);
  }

  private pick(choice: UpgradeChoice): void {
    const run = this.data_.run;
    applyChoice(run, choice);
    if (run.pendingLevelUps > 0) {
      this.build();
      return;
    }
    this.data_.onDone();
    this.scene.stop();
  }
}
