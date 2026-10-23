import * as Phaser from 'phaser';
import { DROPS, PASSIVES, type PassiveId, type WeaponId } from '../../config';
import { waveAt } from '../../core/run/progression';
import { specialReadiness } from '../../core/run/specials';
import { tutorialCard } from '../../core/run/tutorial';
import { nativeLevel } from '../../core/run/upgrades';
import type { RunState } from '../../core/run/state';
import { VirtualJoystick } from '../input/virtualJoystick';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIcon, AGENT_TEXTURES, iconTexture, TEXTURES, textureKey } from '../render/textures';
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
import { bodyText, formatTime, hudLabelText, impactText, labelText, withShadow } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { drawCreamSlot, drawIcon, drawInkBox } from '../ui/icons';
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
/** Altura da pausa dentro da banda, no celular deitado. */
const PAUSE_WIDE_H = 40;
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
  private atpText!: Phaser.GameObjects.Text;
  private chargesText!: Phaser.GameObjects.Text;
  private countersAt = { x: 0, y: 0 };
  private bossText!: Phaser.GameObjects.Text;
  private specialText!: Phaser.GameObjects.Text;
  private specialCount!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private weaponSlots: IconSlot[] = [];
  private passiveSlots: IconSlot[] = [];
  private effectSlots: IconSlot[] = [];
  private specialIcon!: Phaser.GameObjects.Image;
  /** Aviso grande abaixo da banda: formação chegando, crise, Superdosagem (fase 5.6). */
  private banner?: Phaser.GameObjects.Text;
  /** Cartão da primeira run guiada e o passo que ele mostra ("" = escondido). */
  private tutorialBox?: Phaser.GameObjects.Container;
  private tutorialKey = '';
  /** Painel do modo debug, embaixo à esquerda. */
  private debugText?: Phaser.GameObjects.Text;
  private box = {
    w: 0,
    h: 0,
    band: 0,
    xpX: 0,
    xpW: 0,
    xpY: 0,
    below: 0,
    pause: { x: 0, y: 0, w: 0, h: 0 },
  };
  private safe: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  private specialAt = { x: 0, y: 0 };

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.joystick = new VirtualJoystick(this);
    setupUiLayout(this, (w, h) => this.layout(w, h));
  }

  /** Painel do modo debug (Opções); `null` esconde. */
  setDebugText(text: string | null): void {
    if (text === null) {
      this.debugText?.setVisible(false);
      return;
    }
    if (!this.debugText || !this.debugText.active) {
      this.debugText = this.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#7EF0FF',
          backgroundColor: '#07080FCC',
          padding: { x: 4, y: 3 },
        })
        .setOrigin(0, 1)
        .setDepth(50);
    }
    this.debugText
      .setVisible(true)
      .setText(text)
      .setPosition(this.safe.left + 6, this.box.h - this.safe.bottom - 70);
  }

  /** Mostra um aviso grande abaixo da banda por alguns segundos. */
  showBanner(text: string, color: string, seconds = 2.5): void {
    this.banner?.destroy();
    const { w, below } = this.box;
    const t = this.add
      .text(w / 2, below + 40, text, withShadow(impactText(20, color), PALETTE_CSS.outline, 3))
      .setOrigin(0.5, 0);
    this.banner = t;
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: seconds * 1000,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }

  private get runScene(): RunScene {
    return this.scene.get(SCENES.run) as RunScene;
  }

  private layout(w: number, h: number): void {
    this.root?.destroy();
    const safe = (this.safe = safeAreaUi(this.cameras.main.zoom));
    // Deitado: banda baixa, armas e reagentes numa linha só e a pausa dentro da banda.
    const wide = w > h;
    const left = safe.left + 8;
    const right = w - safe.right - 8;
    const xpY = safe.top + 6;
    const rowsY = xpY + 24;
    const band = wide ? rowsY + PAUSE_WIDE_H + 6 : rowsY + SLOT * 2 + ROW_GAP + 8;
    const below = band + 3 + 8;
    const pause = wide
      ? { x: right - PAUSE_SIZE, y: rowsY - 2, w: PAUSE_SIZE, h: PAUSE_WIDE_H }
      : { x: right - PAUSE_SIZE, y: below, w: PAUSE_SIZE, h: PAUSE_SIZE };
    this.box = {
      w,
      h,
      band,
      xpX: safe.left + 6,
      xpW: w - safe.left - safe.right - 12,
      xpY,
      below,
      pause,
    };

    const children: Phaser.GameObjects.GameObject[] = [];
    this.g = this.add.graphics();
    children.push(this.g);

    // Ícones: em pé, armas em cima e reagentes embaixo; deitado, lado a lado.
    const cell = SLOT + SLOT_GAP;
    const row = (x: number, y: number) =>
      Array.from({ length: ROW_SLOTS }, (_, i) => new IconSlot(this, x + i * cell, y, 1));
    this.weaponSlots = row(left, rowsY);
    this.passiveSlots = wide
      ? row(left + ROW_SLOTS * cell + 6, rowsY)
      : row(left, rowsY + SLOT + ROW_GAP);
    for (const sl of [...this.weaponSlots, ...this.passiveSlots]) children.push(...sl.objects);
    const iconsRight = (wide ? left + ROW_SLOTS * cell * 2 + 6 : left + ROW_SLOTS * cell) + 4;

    this.levelText = this.add
      .text(this.box.xpX + this.box.xpW - 8, xpY + 4, '', {
        ...labelText(9, PALETTE_CSS.white),
        stroke: PALETTE_CSS.ink,
        strokeThickness: 2,
      })
      .setOrigin(1, 0);

    // ATP e decompostas à direita, número antes do ícone (deitado, antes da pausa).
    const countersRight = wide ? pause.x - 8 : right;
    const counter = (y: number) =>
      this.add
        .text(
          countersRight - 19,
          y,
          '',
          withShadow(impactText(16, PALETTE_CSS.white), PALETTE_CSS.ink, 2),
        )
        .setOrigin(1, 0)
        .setStroke(PALETTE_CSS.ink, 0);
    this.atpText = counter(rowsY);
    this.killsText = counter(rowsY + 22);
    this.countersAt = { x: countersRight - 14, y: rowsY };

    // Tempo e onda no centro do espaço entre os ícones e os contadores.
    const timeX = Math.round((iconsRight + countersRight - 70) / 2);
    this.timeText = this.add
      .text(timeX, rowsY - 2, '', { ...impactText(24, PALETTE_CSS.white), stroke: PALETTE_CSS.ink })
      .setOrigin(0.5, 0);
    this.waveText = this.add
      .text(timeX, rowsY + 30, '', labelText(8, PALETTE_CSS.textSoft))
      .setOrigin(0.5, 0);

    // Abaixo da banda: efeitos à esquerda, chefe no centro, pausa à direita.
    this.effectSlots = [0, 1, 2].map((i) => new IconSlot(this, left + i * (SLOT + 6), below, 1));
    for (const s of this.effectSlots) children.push(...s.objects);
    this.bossText = this.add
      .text(w / 2, below, '', {
        ...labelText(9, PALETTE_CSS.tagText),
        stroke: PALETTE_CSS.outline,
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0);
    const pauseZone = this.add
      .zone(pause.x + pause.w / 2, pause.y + pause.h / 2, pause.w, pause.h)
      .setInteractive({ useHandCursor: true });
    pauseZone.on('pointerdown', () => this.runScene.togglePause());

    // Especial: madeira de 76 px com o ícone do especial e a recarga.
    const sx = w - safe.right - 18 - SPECIAL_SIZE;
    const sy = h - safe.bottom - 44 - SPECIAL_SIZE;
    this.specialAt = { x: sx, y: sy };
    const run = this.runScene.run;
    const kind = run ? run.rules.agents[run.agentId].special.kind : 'frenzy';
    this.specialIcon = addIcon(
      this,
      sx + SPECIAL_SIZE / 2 - 16,
      sy + 14,
      iconTexture('specials', kind),
      32,
    );
    this.specialCount = this.add
      .text(sx + SPECIAL_SIZE / 2, sy + 22, '', {
        ...impactText(20, PALETTE_CSS.white),
        stroke: PALETTE_CSS.ink,
      })
      .setOrigin(0.5, 0);
    this.chargesText = this.add
      .text(sx + SPECIAL_SIZE - 6, sy + 6, '', {
        ...labelText(9, PALETTE_CSS.white),
        stroke: PALETTE_CSS.outline,
        strokeThickness: 2,
      })
      .setOrigin(1, 0);
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
      pauseZone,
      this.atpText,
      this.chargesText,
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
    // O cartão do tutorial se refaz no próximo quadro com o tamanho novo.
    this.tutorialKey = '';
  }

  /**
   * Primeira run guiada (prancheta "Primeira run guiada"): cartão no terço de baixo, com o passo,
   * o texto e um ícone; no passo do especial, uma seta piscando em cima do botão.
   */
  private updateTutorial(run: RunState, time: number): void {
    const t = this.runScene.tutorial;
    const card = t ? tutorialCard(t, run) : null;
    const key = card ? `${card.number}` : '';
    if (key !== this.tutorialKey) {
      this.tutorialKey = key;
      this.tutorialBox?.destroy();
      this.tutorialBox = card ? this.buildTutorial(run, card) : undefined;
    }
    if (card?.def.id === 'special') {
      const { x, y } = this.specialAt;
      const bob = Math.round(Math.sin(time / 150) * 3);
      this.g
        .fillStyle(PALETTE.gold)
        .fillTriangle(
          x + SPECIAL_SIZE / 2 - 10,
          y - 26 + bob,
          x + SPECIAL_SIZE / 2 + 10,
          y - 26 + bob,
          x + SPECIAL_SIZE / 2,
          y - 12 + bob,
        );
      this.g.lineStyle(3, PALETTE.gold, 0.6 + 0.4 * Math.sin(time / 150));
      this.g.strokeRect(x - 4, y - 4, SPECIAL_SIZE + 8, SPECIAL_SIZE + 8);
    }
  }

  private buildTutorial(
    run: RunState,
    card: NonNullable<ReturnType<typeof tutorialCard>>,
  ): Phaser.GameObjects.Container {
    const { w, h } = this.box;
    const width = Math.min(330, w - 32);
    const left = Math.floor((w - width) / 2);
    const top = Math.floor(h * 0.62);
    const g = this.add.graphics();
    const text = this.add.text(left + 60, top + 26, card.def.text, {
      ...bodyText(12, PALETTE_CSS.text),
      wordWrap: { width: width - 72 },
    });
    const height = Math.max(58, Math.ceil(text.height) + 36);
    g.fillStyle(PALETTE.gold).fillRect(left - 3, top - 3, width + 6, height + 6);
    drawInkBox(g, left, top, width, height, PALETTE.panel);
    drawCreamSlot(g, left + 10, top + 10, 40, 40);
    const objects: Phaser.GameObjects.GameObject[] = [
      g,
      text,
      this.add.text(left + 60, top + 10, card.def.title, labelText(9, PALETTE_CSS.sectionOrange)),
      this.add
        .text(
          left + width - 10,
          top + 10,
          `${card.number}/${card.total}`,
          labelText(8, PALETTE_CSS.cyan),
        )
        .setOrigin(1, 0),
    ];
    const def = run.rules.agents[run.agentId];
    const cx = left + 30;
    const cy = top + 30;
    switch (card.def.icon) {
      case 'move':
        objects.push(
          this.add.image(cx, cy, textureKey(AGENT_TEXTURES[run.agentId], 2)).setScale(0.32),
        );
        break;
      case 'weapon':
        objects.push(
          addIcon(this, cx - 16, cy - 16, iconTexture('weapons', def.action as WeaponId), 32),
        );
        break;
      case 'gem':
        objects.push(this.add.image(cx, cy, textureKey(TEXTURES.gem, 2)).setScale(1.5));
        break;
      case 'special':
        objects.push(
          addIcon(this, cx - 16, cy - 16, iconTexture('specials', def.special.kind), 32),
        );
        break;
      case 'time':
        drawIcon(g, 'trophy', cx - 12, cy - 12, PALETTE.gold);
        break;
    }
    // Pular: some com o tutorial inteiro nesta run.
    const skip = this.add
      .text(left + width + 3, top + height + 6, 'PULAR TUTORIAL ›', {
        ...labelText(8, PALETTE_CSS.text),
        backgroundColor: PALETTE_CSS.ink,
        padding: { x: 6, y: 5 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this.runScene.skipTutorial());
    objects.push(skip);
    return this.add.container(0, 0, objects).setDepth(20);
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
    this.drawCounters(g, run);
    this.updateTutorial(run, time);

    const wave = waveAt(run.time, run.rules.economy.difficulty);
    this.timeText
      .setText(formatTime(run.time))
      .setColor(wave.peak ? PALETTE_CSS.logoOrange : PALETTE_CSS.white);
    this.waveText
      .setText(wave.peak ? 'PICO DE ONDA' : `ONDA ${wave.wave}`)
      .setColor(wave.peak ? PALETTE_CSS.logoOrange : PALETTE_CSS.textSoft);

    this.updateEffects(g, run);
    this.drawBoss(g, run, below);
    this.drawPause(g);
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
    // Receptor nativo na frente, com moldura dourada, quando já tem nível (fase 5.6).
    const native = run.rules.agents[run.agentId].nativeReceptor;
    const nl = nativeLevel(run);
    if (nl > 0) {
      passives.unshift({
        frame: 'evolved',
        icon: iconTexture('passives', native.icon as PassiveId),
        label: String(nl),
        gold: true,
      });
    }
    const open = Math.floor(run.stats.modifierSlots) + free + (nl > 0 ? 1 : 0);
    rowSlots(passives, open, ROW_SLOTS).forEach((c, i) => this.passiveSlots[i]?.set(c));
  }

  /** ATP com a moeda e decompostas com uma molécula pequena, como na prancheta. */
  private drawCounters(g: Phaser.GameObjects.Graphics, run: RunState): void {
    const { x, y } = this.countersAt;
    g.fillStyle(PALETTE.goldDark).fillRect(x, y + 3, 14, 14);
    g.fillStyle(PALETTE.gold).fillRect(x + 2, y + 5, 10, 10);
    g.fillStyle(PALETTE.goldHi).fillRect(x + 4, y + 7, 2, 4);
    const ky = y + 22;
    g.fillStyle(PALETTE.ink).fillRect(x, ky + 4, 8, 8);
    g.fillStyle(PALETTE.carbon).fillRect(x + 1, ky + 5, 6, 6);
    g.fillStyle(PALETTE.textLight)
      .fillRect(x + 7, ky + 2, 2, 3)
      .fillRect(x + 7, ky + 9, 2, 3);
    g.fillStyle(PALETTE.ink).fillRect(x + 9, ky + 3, 6, 6);
    g.fillStyle(PALETTE.oxygen).fillRect(x + 10, ky + 4, 4, 4);
    this.atpText.setText(Math.floor(run.atp).toLocaleString('pt-BR'));
    this.killsText.setText(run.kills.toLocaleString('pt-BR'));
    // Sinergia agente × local (fase 5.12): ✚ pequeno embaixo dos contadores.
    if (run.rules.local?.synergy) drawIcon(g, 'synergy', x, ky + 22, PALETTE.buff, 2);
  }

  /**
   * Efeitos temporários: o especial ativo (verde), a queda depois dele (vermelho) e os itens com
   * tempo (Gelo seco, Bico de Bunsen, Febre de ATP) e os efeitos de inimigo.
   */
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
    const items = [
      ['dryIce', run.effects.freeze],
      ['bunsen', run.effects.flame],
      ['glucagon', run.effects.fever],
    ] as const;
    if (run.challenge) {
      const total = run.rules.structures.focus.seconds;
      effects.push({
        content: { frame: 'debuff', icon: iconTexture('structures', 'focus') },
        left: (run.challenge.until - run.time) / total,
      });
    }
    for (const [id, left] of items) {
      if (left <= 0) continue;
      effects.push({
        content: { frame: 'buff', icon: iconTexture('items', id) },
        left: left / (DROPS.items[id].seconds ?? 1),
      });
    }
    // Efeitos de inimigo (fase 5.14): Lentidão na poça tóxica e Adrenalina ao decompor o estresse.
    const fx = run.rules.run.agentEffects;
    if (run.agentFx.slow > 0) {
      effects.push({
        content: { frame: 'debuff', icon: iconTexture('items', 'slow') },
        left: run.agentFx.slow / fx.slow.lingerSeconds,
      });
    }
    if (run.agentFx.rush > 0) {
      effects.push({
        content: { frame: 'buff', icon: iconTexture('items', 'adrenaline') },
        left: run.agentFx.rush / fx.adrenaline.seconds,
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

  private drawPause(g: Phaser.GameObjects.Graphics): void {
    const { x, y, w, h } = this.box.pause;
    const bar = h - 28;
    g.fillStyle(PALETTE.ink).fillRect(x, y, w, h);
    g.fillStyle(PALETTE.panel).fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle(PALETTE.textLight)
      .fillRect(x + 14, y + 14, 6, bar)
      .fillRect(x + 25, y + 14, 6, bar);
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
    this.chargesText.setText(`x${run.special.charges}`);
    this.specialText.setText(def.shortName);
    // Nome longo não sai da tela: encosta na borda direita.
    const maxX = this.box.w - this.safe.right - 4 - this.specialText.width / 2;
    this.specialText.setX(Math.min(x + s / 2, maxX));
  }
}
