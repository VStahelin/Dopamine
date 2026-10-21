import * as Phaser from 'phaser';
import { PASSIVES, type PassiveId } from '../../config';
import { waveAt } from '../../core/run/progression';
import { specialReadiness } from '../../core/run/specials';
import type { RunState } from '../../core/run/state';
import { VirtualJoystick } from '../input/virtualJoystick';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { iconTexture } from '../render/textures';
import { getSave } from '../storage/saveStore';
import {
  IconSlot,
  passiveSlot,
  rowSlots,
  slotSize,
  weaponSlot,
  type SlotContent,
} from '../ui/iconSlot';
import { safeAreaUi, type Insets } from '../ui/safeArea';
import { formatTime, hudLabelText, impactText, labelText, withShadow } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

/** Espaços por linha de ícones (aba Parâmetros: até 6 armas e 6 modificadores). */
const ROW_SLOTS = 6;
const SLOT = slotSize(1);
const SLOT_GAP = 2;
const ROW_GAP = 3;
/** Botão do especial no canto de baixo à direita, onde fica o polegar direito. */
const SPECIAL_SIZE = 76;
const PAUSE_SIZE = 44;
/** Abaixo desta fração das interações, a borda da tela pulsa em vermelho. */
const LOW_INTERACTIONS = 0.25;

/**
 * HUD da run (docs/ui-cronico.md, prancheta "Crônico: HUD de batalha"): banda no topo com XP,
 * armas e reagentes em ícones, tempo e onda, decompostas; abaixo da banda, efeitos, chefe e
 * pausa; embaixo, o botão do especial e o joystick.
 */
export class HudScene extends Phaser.Scene {
  joystick?: VirtualJoystick;
  private root?: Phaser.GameObjects.Container;
  private g!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private specialText!: Phaser.GameObjects.Text;
  private specialCount!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private weaponSlots: IconSlot[] = [];
  private passiveSlots: IconSlot[] = [];
  private effectSlots: IconSlot[] = [];
  private specialIcon!: Phaser.GameObjects.Image;
  private box = { w: 0, h: 0, band: 0, xpX: 0, xpW: 0, xpY: 0, below: 0 };
  private safe: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  private specialAt = { x: 0, y: 0 };

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.joystick = new VirtualJoystick(this);
    setupUiLayout(this, (w, h) => this.layout(w, h));
  }

  private get runScene(): RunScene {
    return this.scene.get(SCENES.run) as RunScene;
  }

  private layout(w: number, h: number): void {
    this.root?.destroy();
    const safe = (this.safe = safeAreaUi(this.cameras.main.zoom));
    const left = safe.left + 8;
    const right = w - safe.right - 8;
    const xpY = safe.top + 6;
    const rowsY = xpY + 24;
    const band = rowsY + SLOT * 2 + ROW_GAP + 8;
    this.box = {
      w,
      h,
      band,
      xpX: safe.left + 6,
      xpW: w - safe.left - safe.right - 12,
      xpY,
      below: band + 3 + 8,
    };

    const children: Phaser.GameObjects.GameObject[] = [];
    this.g = this.add.graphics();
    children.push(this.g);

    // Ícones: armas em cima, reagentes embaixo.
    const row = (y: number) =>
      Array.from(
        { length: ROW_SLOTS },
        (_, i) => new IconSlot(this, left + i * (SLOT + SLOT_GAP), y, 1),
      );
    this.weaponSlots = row(rowsY);
    this.passiveSlots = row(rowsY + SLOT + ROW_GAP);
    for (const s of [...this.weaponSlots, ...this.passiveSlots]) children.push(...s.objects);

    this.levelText = this.add
      .text(this.box.xpX + this.box.xpW - 8, xpY + 4, '', {
        ...labelText(9, PALETTE_CSS.white),
        stroke: PALETTE_CSS.ink,
        strokeThickness: 2,
      })
      .setOrigin(1, 0);

    // Decompostas à direita, número antes do ícone.
    this.killsText = this.add
      .text(
        right - 19,
        rowsY + 2,
        '',
        withShadow(impactText(16, PALETTE_CSS.white), PALETTE_CSS.ink, 2),
      )
      .setOrigin(1, 0)
      .setStroke(PALETTE_CSS.ink, 0);

    // Tempo e onda no centro do espaço entre os ícones e os contadores.
    const iconsRight = left + ROW_SLOTS * (SLOT + SLOT_GAP);
    const timeX = Math.round((iconsRight + right - 60) / 2);
    this.timeText = this.add
      .text(timeX, rowsY - 2, '', { ...impactText(24, PALETTE_CSS.white), stroke: PALETTE_CSS.ink })
      .setOrigin(0.5, 0);
    this.waveText = this.add
      .text(timeX, rowsY + 30, '', labelText(8, PALETTE_CSS.textSoft))
      .setOrigin(0.5, 0);

    // Abaixo da banda: efeitos à esquerda, chefe no centro, pausa à direita.
    this.effectSlots = [0, 1, 2].map(
      (i) => new IconSlot(this, left + i * (SLOT + 6), this.box.below, 1),
    );
    for (const s of this.effectSlots) children.push(...s.objects);
    this.bossText = this.add
      .text(w / 2, this.box.below, '', {
        ...labelText(9, PALETTE_CSS.tagText),
        stroke: PALETTE_CSS.outline,
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0);
    const pause = this.add
      .zone(right - PAUSE_SIZE / 2, this.box.below + PAUSE_SIZE / 2, PAUSE_SIZE, PAUSE_SIZE)
      .setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => this.runScene.togglePause());

    // Especial: madeira de 76 px com o ícone do especial e a recarga.
    const sx = w - safe.right - 18 - SPECIAL_SIZE;
    const sy = h - safe.bottom - 44 - SPECIAL_SIZE;
    this.specialAt = { x: sx, y: sy };
    const run = this.runScene.run;
    const kind = run ? run.rules.agents[run.agentId].special.kind : 'frenzy';
    this.specialIcon = this.add
      .image(sx + SPECIAL_SIZE / 2, sy + 14, iconTexture('specials', kind))
      .setOrigin(0.5, 0)
      .setScale(2);
    this.specialCount = this.add
      .text(sx + SPECIAL_SIZE / 2, sy + 22, '', {
        ...impactText(20, PALETTE_CSS.white),
        stroke: PALETTE_CSS.ink,
      })
      .setOrigin(0.5, 0);
    this.specialText = this.add
      .text(sx + SPECIAL_SIZE / 2, sy + SPECIAL_SIZE + 4, '', {
        ...labelText(9, PALETTE_CSS.woodText),
        stroke: PALETTE_CSS.outline,
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0);
    const special = this.add
      .zone(sx + SPECIAL_SIZE / 2, sy + SPECIAL_SIZE / 2, SPECIAL_SIZE, SPECIAL_SIZE)
      .setInteractive({ useHandCursor: true });
    special.on('pointerdown', () => this.runScene.queueSpecial());

    children.push(
      this.levelText,
      this.killsText,
      this.timeText,
      this.waveText,
      this.bossText,
      pause,
      this.specialIcon,
      this.specialCount,
      this.specialText,
      special,
    );
    this.fpsText = undefined;
    if (getSave(this).options.showFps) {
      this.fpsText = this.add.text(
        left,
        h - safe.bottom - 14,
        '',
        hudLabelText(8, PALETTE_CSS.hydrogen),
      );
      children.push(this.fpsText);
    }
    this.root = this.add.container(0, 0, children);
  }

  override update(time: number): void {
    const run = this.runScene.run;
    if (!run || !this.root) return;
    const { w, h, band, xpX, xpW, xpY, below } = this.box;
    const g = this.g.clear();

    // Interações baixas: borda vermelha pulsando.
    const ratio = run.agent.interactions / run.stats.maxInteractions;
    if (ratio < LOW_INTERACTIONS && run.agent.interactions > 0) {
      const a = 0.25 + 0.2 * Math.sin(time / 180);
      g.lineStyle(10, PALETTE.interaction, a).strokeRect(0, 0, w, h);
    }

    // Banda translúcida com borda escura embaixo.
    g.fillStyle(PALETTE.night, 0.86).fillRect(0, 0, w, band);
    g.fillStyle(PALETTE.ink).fillRect(0, band, w, 3);

    // XP: moldura de madeira fina e recheio ciano, com o nível dentro.
    g.fillStyle(PALETTE.outline).fillRect(xpX, xpY, xpW, 16);
    g.fillStyle(PALETTE.woodDark).fillRect(xpX + 2, xpY + 2, xpW - 4, 12);
    g.fillStyle(PALETTE.scanBg).fillRect(xpX + 4, xpY + 4, xpW - 8, 8);
    g.fillStyle(PALETTE.water).fillRect(
      xpX + 4,
      xpY + 4,
      Math.floor(((xpW - 8) * run.xp) / run.xpToNext),
      8,
    );
    this.levelText.setText(`NV ${run.level}`);

    this.updateRows(run);
    this.drawKillsIcon(g, run);

    const wave = waveAt(run.time, run.rules.economy.difficulty);
    this.timeText
      .setText(formatTime(run.time))
      .setColor(wave.peak ? PALETTE_CSS.logoOrange : PALETTE_CSS.white);
    this.waveText
      .setText(wave.peak ? 'PICO DE ONDA' : `ONDA ${wave.wave}`)
      .setColor(wave.peak ? PALETTE_CSS.logoOrange : PALETTE_CSS.textSoft);

    this.updateEffects(g, run);
    this.drawBoss(g, run, below);
    this.drawPause(g, below);
    this.drawSpecial(g, run, time);
    this.fpsText?.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
  }

  private updateRows(run: RunState): void {
    const weapons = run.weapons.map((wpn) => weaponSlot(wpn));
    rowSlots(weapons, Math.floor(run.stats.weaponSlots), ROW_SLOTS).forEach((c, i) =>
      this.weaponSlots[i]?.set(c),
    );
    const held = (Object.keys(run.passives) as PassiveId[]).filter(
      (id) => (run.passives[id]?.level ?? 0) > 0,
    );
    const free = held.filter((id) => PASSIVES[id].freeSlot).length;
    const passives = held.map((id) => passiveSlot(id, run.passives[id]!.level));
    rowSlots(passives, Math.floor(run.stats.modifierSlots) + free, ROW_SLOTS).forEach((c, i) =>
      this.passiveSlots[i]?.set(c),
    );
  }

  /** Molécula pequena ao lado do número de decompostas. */
  private drawKillsIcon(g: Phaser.GameObjects.Graphics, run: RunState): void {
    const x = this.box.w - this.safe.right - 8 - 14;
    const y = this.weaponSlots[0]!.y + 4;
    g.fillStyle(PALETTE.ink).fillRect(x, y + 4, 8, 8);
    g.fillStyle(PALETTE.carbon).fillRect(x + 1, y + 5, 6, 6);
    g.fillStyle(PALETTE.textLight)
      .fillRect(x + 7, y + 2, 2, 3)
      .fillRect(x + 7, y + 9, 2, 3);
    g.fillStyle(PALETTE.ink).fillRect(x + 9, y + 3, 6, 6);
    g.fillStyle(PALETTE.oxygen).fillRect(x + 10, y + 4, 4, 4);
    this.killsText.setText(run.kills.toLocaleString('pt-BR'));
  }

  /** Efeitos temporários do especial: ativo (verde) e a queda depois dele (vermelho). */
  private updateEffects(g: Phaser.GameObjects.Graphics, run: RunState): void {
    const def = run.rules.agents[run.agentId].special;
    const icon = iconTexture('specials', def.kind);
    const effects: { content: SlotContent; left: number }[] = [];
    if (run.special.active > 0 && def.durationSeconds) {
      effects.push({
        content: { frame: 'buff', icon },
        left: run.special.active / def.durationSeconds,
      });
    }
    if (run.special.crash > 0 && def.crashSeconds) {
      effects.push({
        content: { frame: 'debuff', icon },
        left: run.special.crash / def.crashSeconds,
      });
    }
    this.effectSlots.forEach((slot, i) => {
      const e = effects[i];
      slot.set(e?.content);
      if (!e) return;
      const y = slot.y + slot.size + 2;
      g.fillStyle(PALETTE.ink).fillRect(slot.x, y, slot.size, 4);
      g.fillStyle(e.content.frame === 'buff' ? PALETTE.buff : PALETTE.interaction).fillRect(
        slot.x + 1,
        y + 1,
        Math.round((slot.size - 2) * Math.min(1, e.left)),
        2,
      );
    });
  }

  /** Chefe: nome e vida em vermelho abaixo da banda, só enquanto estiver vivo. */
  private drawBoss(g: Phaser.GameObjects.Graphics, run: RunState, y: number): void {
    const boss = run.enemies.find((e) => e.boss && e.hp > 0);
    if (!boss) {
      this.bossText.setText('');
      return;
    }
    const side = 8 + 3 * (SLOT + 6) + 6;
    const bw = Math.min(200, this.box.w - side - PAUSE_SIZE - 24);
    const bx = Math.floor(this.box.w / 2 - bw / 2);
    this.bossText.setText(`CHEFE · ${run.rules.enemies[boss.kind].name.toUpperCase()}`);
    const by = y + 14;
    g.fillStyle(PALETTE.outline).fillRect(bx, by, bw, 10);
    g.fillStyle(PALETTE.scanBg).fillRect(bx + 2, by + 2, bw - 4, 6);
    g.fillStyle(PALETTE.interaction).fillRect(
      bx + 2,
      by + 2,
      Math.round((bw - 4) * (boss.hp / boss.maxHp)),
      6,
    );
  }

  private drawPause(g: Phaser.GameObjects.Graphics, y: number): void {
    const x = this.box.w - this.safe.right - 8 - PAUSE_SIZE;
    g.fillStyle(PALETTE.ink).fillRect(x, y, PAUSE_SIZE, PAUSE_SIZE);
    g.fillStyle(PALETTE.panel).fillRect(x + 3, y + 3, PAUSE_SIZE - 6, PAUSE_SIZE - 6);
    g.fillStyle(PALETTE.textLight)
      .fillRect(x + 14, y + 14, 6, 16)
      .fillRect(x + 25, y + 14, 6, 16);
  }

  /** Botão do especial: escurece de cima para baixo com a recarga e mostra os segundos. */
  private drawSpecial(g: Phaser.GameObjects.Graphics, run: RunState, time: number): void {
    const { x, y } = this.specialAt;
    const s = SPECIAL_SIZE;
    const ready = specialReadiness(run);
    const def = run.rules.agents[run.agentId].special;
    g.fillStyle(PALETTE.outline).fillRect(x, y, s, s);
    g.fillStyle(PALETTE.wood).fillRect(x + 4, y + 4, s - 8, s - 8);
    g.fillStyle(PALETTE.woodHi).fillRect(x + 4, y + 4, s - 8, 4);
    g.fillStyle(PALETTE.woodShade).fillRect(x + 4, y + s - 9, s - 8, 5);
    if (ready < 1) {
      g.fillStyle(PALETTE.ink, 0.6).fillRect(
        x + 4,
        y + 4,
        s - 8,
        Math.round((s - 8) * (1 - ready)),
      );
    }
    if (run.special.active > 0) {
      const a = 0.6 + 0.4 * Math.sin(time / 90);
      g.lineStyle(3, PALETTE.gold, a).strokeRect(x - 3, y - 3, s + 6, s + 6);
    }
    this.specialIcon.setAlpha(ready >= 1 ? 1 : 0.55);
    this.specialCount.setText(ready >= 1 ? '' : String(Math.ceil(run.special.cooldown)));
    this.specialText.setText(def.name.toUpperCase());
    // Nome longo não sai da tela: encosta na borda direita.
    const maxX = this.box.w - this.safe.right - 4 - this.specialText.width / 2;
    this.specialText.setX(Math.min(x + s / 2, maxX));
  }
}
