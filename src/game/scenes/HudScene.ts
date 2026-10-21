import * as Phaser from 'phaser';
import { VirtualJoystick } from '../input/virtualJoystick';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { formatTime, hudLabelText, impactText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

const PIPS = 10;

/** Interface por cima da run: XP, nível, tempo, interações, decompostas, pausa e joystick. */
export class HudScene extends Phaser.Scene {
  joystick?: VirtualJoystick;
  private root?: Phaser.GameObjects.Container;
  private bars!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private interactionsText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private width = 0;

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.joystick = new VirtualJoystick(this);
    setupUiLayout(this, (w, h) => this.layout(w, h));
  }

  private layout(w: number, h: number): void {
    this.root?.destroy();
    this.width = w;
    const run = this.scene.get(SCENES.run) as RunScene;

    this.bars = this.add.graphics();
    this.levelText = this.add.text(6, 9, '', impactText(12, PALETTE_CSS.water));
    this.timeText = this.add.text(w / 2, 9, '', impactText(14)).setOrigin(0.5, 0);
    this.killsText = this.add
      .text(w - 6, 46, '', hudLabelText(8, PALETTE_CSS.cream))
      .setOrigin(1, 0);
    this.interactionsText = this.add.text(
      6 + PIPS * 9 + 4,
      27,
      '',
      hudLabelText(8, PALETTE_CSS.cream),
    );
    const pause = addButton(this, {
      x: w - 38,
      y: 8,
      width: 32,
      height: 32,
      label: 'II',
      fontSize: 12,
      variant: 'secondary',
      onClick: () => run.togglePause(),
    });

    const children: Phaser.GameObjects.GameObject[] = [
      this.bars,
      this.levelText,
      this.timeText,
      this.killsText,
      this.interactionsText,
      pause,
    ];
    this.fpsText = undefined;
    if (getSave(this).options.showFps) {
      this.fpsText = this.add.text(6, h - 14, '', hudLabelText(8, PALETTE_CSS.hydrogen));
      children.push(this.fpsText);
    }
    this.root = this.add.container(0, 0, children);
  }

  override update(): void {
    const run = (this.scene.get(SCENES.run) as RunScene).run;
    if (!run || !this.root) return;
    const w = this.width;
    const g = this.bars.clear();

    // Barra de XP no topo, de ponta a ponta.
    g.fillStyle(PALETTE.panelDark).fillRect(0, 0, w, 5);
    g.fillStyle(PALETTE.water).fillRect(0, 0, Math.floor((w * run.xp) / run.xpToNext), 5);
    g.fillStyle(PALETTE.outline).fillRect(0, 5, w, 1);

    // Interações: pips vermelhos numa moldura de madeira.
    const { interactions } = run.agent;
    const max = run.stats.maxInteractions;
    const filled = Math.ceil((interactions / max) * PIPS);
    const px = 6;
    const py = 27;
    g.fillStyle(PALETTE.outline).fillRect(px - 3, py - 3, PIPS * 9 + 5, 14);
    g.fillStyle(PALETTE.wood).fillRect(px - 2, py - 2, PIPS * 9 + 3, 12);
    for (let i = 0; i < PIPS; i++) {
      g.fillStyle(i < filled ? PALETTE.interaction : PALETTE.panelDark).fillRect(
        px + i * 9,
        py,
        7,
        8,
      );
    }

    this.levelText.setText(`NV ${run.level}`);
    this.timeText.setText(formatTime(run.time));
    this.killsText.setText(`DECOMPOSTAS ${run.kills}`);
    this.interactionsText.setText(`${Math.ceil(interactions)}/${Math.round(max)}`);
    this.fpsText?.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
  }
}
