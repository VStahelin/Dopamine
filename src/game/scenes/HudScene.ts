import * as Phaser from 'phaser';
import { specialReadiness } from '../../core/run/specials';
import { VirtualJoystick } from '../input/virtualJoystick';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { formatTime, hudLabelText, impactText, labelText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

const PIPS = 10;
/** Botão do especial, no canto de baixo à direita (onde fica o polegar direito). */
const SPECIAL_SIZE = 64;

/**
 * Interface por cima da run: XP, nível, tempo, interações, decompostas, armas, chefe, pausa,
 * botão do especial e joystick.
 */
export class HudScene extends Phaser.Scene {
  joystick?: VirtualJoystick;
  private root?: Phaser.GameObjects.Container;
  private bars!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private interactionsText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private weaponsText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private specialText!: Phaser.GameObjects.Text;
  private width = 0;
  private height = 0;

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
    this.height = h;
    const run = this.scene.get(SCENES.run) as RunScene;
    this.weaponsText = this.add.text(6, 44, '', hudLabelText(7, PALETTE_CSS.cream));
    this.bossText = this.add
      .text(w / 2, 62, '', hudLabelText(8, PALETTE_CSS.alert))
      .setOrigin(0.5, 0);
    const sx = w - SPECIAL_SIZE - 12;
    const sy = h - SPECIAL_SIZE - 20;
    this.specialText = this.add
      .text(sx + SPECIAL_SIZE / 2, sy + SPECIAL_SIZE + 3, '', labelText(7, PALETTE_CSS.text))
      .setOrigin(0.5, 0);
    const specialZone = this.add
      .zone(sx + SPECIAL_SIZE / 2, sy + SPECIAL_SIZE / 2, SPECIAL_SIZE, SPECIAL_SIZE)
      .setInteractive({ useHandCursor: true });
    specialZone.on('pointerdown', () => run.queueSpecial());

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
      this.weaponsText,
      this.bossText,
      this.specialText,
      specialZone,
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

    // Chefe: nome e barra de vida no topo enquanto estiver vivo.
    const boss = run.enemies.find((e) => e.boss && e.hp > 0);
    if (boss) {
      const bw = Math.min(200, w - 140);
      const bx = Math.floor(w / 2 - bw / 2);
      g.fillStyle(PALETTE.ink).fillRect(bx, 74, bw, 9);
      g.fillStyle(PALETTE.panelDeep).fillRect(bx + 2, 76, bw - 4, 5);
      g.fillStyle(PALETTE.interaction).fillRect(
        bx + 2,
        76,
        Math.round((bw - 4) * (boss.hp / boss.maxHp)),
        5,
      );
      this.bossText.setText(run.rules.enemies[boss.kind].name.toUpperCase());
    } else {
      this.bossText.setText('');
    }

    // Especial: caixa que enche conforme a recarga; dourada quando está pronto.
    const ready = specialReadiness(run);
    const s = SPECIAL_SIZE;
    const sx = w - s - 12;
    const sy = this.height - s - 20;
    g.fillStyle(PALETTE.ink).fillRect(sx, sy, s, s);
    g.fillStyle(PALETTE.panel).fillRect(sx + 4, sy + 4, s - 8, s - 8);
    const fill = Math.round((s - 8) * ready);
    g.fillStyle(ready >= 1 ? PALETTE.wood : PALETTE.woodShade).fillRect(
      sx + 4,
      sy + 4 + (s - 8 - fill),
      s - 8,
      fill,
    );
    if (ready >= 1) g.fillStyle(PALETTE.woodHi).fillRect(sx + 4, sy + 4, s - 8, 3);
    if (run.special.active > 0)
      g.lineStyle(2, PALETTE.gold).strokeRect(sx - 2, sy - 2, s + 4, s + 4);
    const special = run.rules.agents[run.agentId].special;
    this.specialText.setText(
      ready >= 1 ? special.name.toUpperCase() : `${Math.ceil(run.special.cooldown)} s`,
    );

    this.weaponsText.setText(
      run.weapons
        .map((wpn) => `${run.rules.weapons[wpn.id].name.split(' ')[0]!.toUpperCase()} ${wpn.level}`)
        .join(' · '),
    );
    this.levelText.setText(`NV ${run.level}`);
    this.timeText.setText(formatTime(run.time));
    this.killsText.setText(`DECOMPOSTAS ${run.kills}`);
    this.interactionsText.setText(`${Math.ceil(interactions)}/${Math.round(max)}`);
    this.fpsText?.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
  }
}
