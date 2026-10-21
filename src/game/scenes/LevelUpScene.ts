import * as Phaser from 'phaser';
import type { RunState } from '../../core/run/state';
import {
  applyChoice,
  banishChoice,
  levelUpOffer,
  remaining,
  rerollOffer,
  skipLevelUp,
  type UpgradeChoice,
} from '../../core/run/upgrades';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addButton } from '../ui/button';
import { addIconSlot, choiceSlot, slotSize } from '../ui/iconSlot';
import { bodyText, hudLabelText, impactText, labelText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { describeChoice } from '../ui/upgradeText';
import { SCENES } from './keys';

interface LevelUpData {
  run: RunState;
  onDone: () => void;
}

const KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
/** Ignora toques logo que a tela abre, para um dedo no joystick não escolher sem querer. */
const INPUT_DELAY_MS = 350;

const hex = (color: string) => parseInt(color.slice(1), 16);

/**
 * Tela de level up: cartões com a cor da raridade; Rerrolar, Pular e Banir quando houver usos.
 * Teclas 1 a 5 escolhem, R rerrola.
 */
export class LevelUpScene extends Phaser.Scene {
  private data_!: LevelUpData;
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };
  private banishing = false;
  private openedAt = 0;

  constructor() {
    super(SCENES.levelUp);
  }

  create(data: LevelUpData): void {
    this.data_ = data;
    this.banishing = false;
    this.openedAt = this.time.now;
    KEYS.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => {
        const choice = levelUpOffer(this.data_.run)[i];
        if (choice) this.pick(choice);
      });
    });
    this.input.keyboard?.on('keydown-R', () => this.reroll());
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
  }

  private ready(): boolean {
    return this.time.now - this.openedAt >= INPUT_DELAY_MS;
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const run = this.data_.run;
    const offer = levelUpOffer(run);
    const actions = (['rerolls', 'skips', 'banishes'] as const).filter(
      (a) => remaining(run, a) > 0,
    );

    const cardW = Math.min(w - 24, 320);
    const gap = 6;
    const header = 44;
    const footer = actions.length > 0 ? 44 : 0;
    const cardH = Math.max(
      40,
      Math.min(60, Math.floor((h - 24 - header - footer) / offer.length) - gap),
    );
    const total = header + offer.length * (cardH + gap) + footer;
    const top = Math.max(12, Math.floor((h - total) / 2));
    const left = Math.floor((w - cardW) / 2);

    const title = this.banishing ? 'BANIR' : `NÍVEL ${run.level}!`;
    const subtitle = this.banishing ? 'TOQUE NA OPÇÃO QUE QUER BANIR' : 'ESCOLHA UM MODIFICADOR';
    const children: Phaser.GameObjects.GameObject[] = [
      addDim(this, w, h),
      this.add
        .text(
          w / 2,
          top,
          title,
          impactText(22, this.banishing ? PALETTE_CSS.interaction : PALETTE_CSS.water),
        )
        .setOrigin(0.5, 0),
      this.add.text(w / 2, top + 28, subtitle, labelText(8, PALETTE_CSS.cream)).setOrigin(0.5, 0),
    ];

    offer.forEach((choice, i) => {
      const y = top + header + i * (cardH + gap);
      const text = describeChoice(choice);
      // A arma e a cura não têm raridade: moldura ciano, que não se confunde com nenhuma.
      const frame = text.rarity ? hex(text.rarity.color) : PALETTE.water;
      // Cartões baixos (muitas opções) aproximam título e descrição.
      const extra = Math.floor((cardH - 40) / 4);
      const titleY = y + 7 + extra;

      const g = this.add.graphics();
      g.fillStyle(PALETTE.outline).fillRect(left, y, cardW, cardH);
      g.fillStyle(frame).fillRect(left + 2, y + 2, cardW - 4, cardH - 4);
      g.fillStyle(PALETTE.panel).fillRect(left + 5, y + 5, cardW - 10, cardH - 10);
      // Faixa da raridade à esquerda.
      g.fillStyle(frame).fillRect(left + 5, y + 5, 4, cardH - 10);
      children.push(g);

      // Ícone na moldura do tipo (arma, evolução, modificador), do tamanho que o cartão comporta.
      const scale = cardH - 14 >= slotSize(2) ? 2 : 1;
      const icon = slotSize(scale);
      children.push(
        ...addIconSlot(
          this,
          left + 14,
          y + Math.floor((cardH - icon) / 2),
          scale,
          choiceSlot(choice),
        ).objects,
      );
      const textX = left + 14 + icon + 8;

      children.push(this.add.text(textX, titleY, text.title, impactText(13)));
      const tag = [text.rarity?.name.toUpperCase(), text.level].filter(Boolean).join(' · ');
      children.push(
        this.add
          .text(
            left + cardW - 12,
            titleY + 2,
            tag,
            hudLabelText(8, text.rarity?.color ?? PALETTE_CSS.water),
          )
          .setOrigin(1, 0),
      );
      children.push(
        this.add.text(textX, titleY + 16 + extra, text.description, {
          ...bodyText(10, PALETTE_CSS.cream),
          wordWrap: { width: left + cardW - 28 - textX },
        }),
      );
      children.push(
        this.add
          .text(left + cardW - 12, y + cardH - 15, String(i + 1), labelText(8, PALETTE_CSS.water))
          .setOrigin(1, 0),
      );

      const zone = this.add
        .zone(left + cardW / 2, y + cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.pick(choice));
      children.push(zone);
    });

    if (actions.length > 0) {
      const y = top + header + offer.length * (cardH + gap) + 4;
      const bw = Math.floor((cardW - gap * (actions.length - 1)) / actions.length);
      const labels = { rerolls: 'REROLAR', skips: 'PULAR', banishes: 'BANIR' } as const;
      const handlers = {
        rerolls: () => this.reroll(),
        skips: () => this.skip(),
        banishes: () => this.toggleBanish(),
      };
      actions.forEach((action, i) => {
        children.push(
          addButton(this, {
            x: left + i * (bw + gap),
            y,
            width: bw,
            height: 34,
            label: `${labels[action]} ${remaining(run, action)}`,
            fontSize: 11,
            variant: action === 'banishes' && this.banishing ? 'primary' : 'secondary',
            onClick: handlers[action],
          }),
        );
      });
    }

    this.root = this.add.container(0, 0, children);
  }

  private pick(choice: UpgradeChoice): void {
    if (!this.ready()) return;
    const run = this.data_.run;
    if (this.banishing) {
      this.banishing = false;
      banishChoice(run, choice);
      this.build();
      return;
    }
    applyChoice(run, choice);
    this.next();
  }

  private reroll(): void {
    if (this.ready() && rerollOffer(this.data_.run)) {
      this.banishing = false;
      this.build();
    }
  }

  private skip(): void {
    if (this.ready() && skipLevelUp(this.data_.run)) this.next();
  }

  private toggleBanish(): void {
    if (!this.ready()) return;
    this.banishing = !this.banishing;
    this.build();
  }

  /** Próximo level up pendente, ou volta para a run. */
  private next(): void {
    this.banishing = false;
    if (this.data_.run.pendingLevelUps > 0) {
      this.openedAt = this.time.now;
      this.build();
      return;
    }
    this.data_.onDone();
    this.scene.stop();
  }
}
