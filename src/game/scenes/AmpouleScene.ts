import * as Phaser from 'phaser';
import { RARITIES, SUPPLEMENTS } from '../../config';
import type { RunState } from '../../core/run/state';
import { closeAmpoule, copies } from '../../core/run/supplements';
import { sfx } from '../audio/sfx';
import { revealCue } from '../audio/sfxLogic';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIcon, iconTexture } from '../render/textures';
import { addIconSlot, supplementSlot } from '../ui/iconSlot';
import { bodyText, hudLabelText, impactText, labelText } from '../ui/theme';
import { addDim, cardUiMinSize, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

interface AmpouleData {
  run: RunState;
  onDone: () => void;
}

/** Ignora toques logo que a tela abre, como no level up. */
const INPUT_DELAY_MS = 350;
/** No PC (sem toque), a tela fecha sozinha depois deste tempo. */
const AUTO_CLOSE_MS = 3000;
/** O suplemento soa logo depois do vidro quebrar. */
const REVEAL_DELAY_MS = 180;

const hex = (color: string) => parseInt(color.slice(1), 16);

/**
 * Ampola aberta (fase 5.9, decisão 0028): a ampola quebra e mostra o suplemento com a moldura
 * da raridade. Um toque volta à run; no PC ela fecha sozinha.
 */
export class AmpouleScene extends Phaser.Scene {
  private data_!: AmpouleData;
  private root?: Phaser.GameObjects.Container;
  private openedAt = 0;
  private closed = false;

  constructor() {
    super(SCENES.ampoule);
  }

  create(data: AmpouleData): void {
    this.data_ = data;
    this.openedAt = this.time.now;
    this.closed = false;
    this.input.keyboard?.on('keydown-ENTER', () => this.done());
    this.input.keyboard?.on('keydown-SPACE', () => this.done());
    // Só um toque que começou nesta tela fecha (o dedo do joystick já estava na tela).
    let armed = false;
    this.input.on('pointerdown', () => (armed = true));
    this.input.on('pointerup', () => {
      if (armed) this.done();
    });
    if (!this.sys.game.device.input.touch)
      this.time.delayedCall(AUTO_CLOSE_MS, () => this.done(true));
    setupUiLayout(this, (w, h) => this.build(w, h), cardUiMinSize);
    const ampoule = data.run.ampoule;
    const def = ampoule ? SUPPLEMENTS.items[ampoule.id] : undefined;
    if (def) {
      const tierId = SUPPLEMENTS.rarities[def.rarity].tier;
      sfx.play('ampouleBreak');
      this.time.delayedCall(REVEAL_DELAY_MS, () =>
        sfx.cue(revealCue(RARITIES.tiers.findIndex((t) => t.id === tierId)), false),
      );
    }
  }

  private build(w: number, h: number): void {
    this.root?.destroy();
    const ampoule = this.data_.run.ampoule;
    const def = ampoule ? SUPPLEMENTS.items[ampoule.id] : undefined;
    if (!ampoule || !def) return;
    const tierId = SUPPLEMENTS.rarities[def.rarity].tier;
    const tier = RARITIES.tiers.find((t) => t.id === tierId) ?? RARITIES.tiers[0]!;
    const cardW = Math.min(w - 24, 300);
    const left = Math.floor((w - cardW) / 2);
    const top = Math.max(12, Math.floor(h / 2 - 110));
    const n = copies(this.data_.run, ampoule.id);
    const g = this.add.graphics();
    const cy = top + 60;
    const cardH = 120;
    g.fillStyle(PALETTE.outline).fillRect(left, cy, cardW, cardH);
    g.fillStyle(hex(tier.color)).fillRect(left + 2, cy + 2, cardW - 4, cardH - 4);
    g.fillStyle(PALETTE.panel).fillRect(left + 5, cy + 5, cardW - 10, cardH - 10);
    const slot = addIconSlot(this, left + 14, cy + 14, 2, supplementSlot(ampoule.id, n));
    const tx = left + 14 + slot.size + 10;
    this.root = this.add.container(0, 0, [
      addDim(this, w, h),
      addIcon(this, w / 2 - 24, top, iconTexture('items', 'ampouleBroken'), 48),
      g,
      ...slot.objects,
      this.add.text(tx, cy + 16, def.name, impactText(15)),
      this.add.text(tx, cy + 38, tier.name.toUpperCase(), hudLabelText(8, tier.color)),
      this.add.text(left + 14, cy + 74, def.description, {
        ...bodyText(10, PALETTE_CSS.cream),
        wordWrap: { width: cardW - 28 },
      }),
      this.add
        .text(
          w / 2,
          cy + cardH + 14,
          'SUPLEMENTO · TOQUE PARA VOLTAR',
          labelText(8, PALETTE_CSS.textSoft),
        )
        .setOrigin(0.5, 0),
    ]);
  }

  private done(auto = false): void {
    if (this.closed || (!auto && this.time.now - this.openedAt < INPUT_DELAY_MS)) return;
    this.closed = true;
    closeAmpoule(this.data_.run);
    this.data_.onDone();
    this.scene.stop();
  }
}
