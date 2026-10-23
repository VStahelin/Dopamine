import * as Phaser from 'phaser';
import { IDLE } from '../../config';
import { drainIdleEvents, slotX, waveProgress } from '../../core/idle/field';
import {
  buyIdleAgent,
  buyLevel,
  buyUpgrade,
  collect,
  levelCost,
  maxSlots,
  openSlots,
  placeAgent,
  upgradeCost,
  type IdleProgress,
  type IdleUpgradeKey,
} from '../../core/idle/progress';
import { earn } from '../../core/organism/organism';
import { idleRunner } from '../idle/idleRunner';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { ENEMY_TEXTURES, TEXTURES, textureKey } from '../render/textures';
import { moleculeName } from '../render/spriteFiles';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { drawCreamSlot, drawLock } from '../ui/icons';
import { safeAreaUi } from '../ui/safeArea';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import { music } from '../audio/music';

type Obj = Phaser.GameObjects.GameObject;

const TOP_H = 104;
const POOL_H = 120;
const BOTTOM_H = 64;
const WALL = 26;
const BASE_STRIP = 22;
const SLOT = 62;
/** Largura sobre altura do campo na tela: limites para o campo esticado. */
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 1.4;
/** Detail das texturas de molécula usadas no campo (decisão 0009). */
const DETAIL = 3;
const UPGRADES: IdleUpgradeKey[] = ['fireRate', 'baseSlots', 'offlineCapHours'];

type Panel = { kind: 'slot'; pos: number } | { kind: 'upgrades' } | undefined;

/**
 * Campo longo (fase 4), seguindo a prancheta "Tela de batalha (mockup)" do canvas: topo com a
 * BASE em pips, ATP e a onda; o campo vertical com paredes e a faixa BASE; o pool de agentes
 * embaixo; e a barra do progresso da onda com o botão x2. A simulação roda no idleRunner,
 * mesmo com esta tela fechada; aqui só desenha e faz as compras.
 */
export class IdleScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };
  /** Onde o campo da simulação aparece: `sx`/`sy` levam posições, `scale` o tamanho dos sprites. */
  private fieldBox = { x: 0, y: 0, w: 0, h: 0, sx: 1, sy: 1, scale: 1 };
  private dyn!: Phaser.GameObjects.Graphics;
  private enemyPool: Phaser.GameObjects.Image[] = [];
  private shotPool: Phaser.GameObjects.Image[] = [];
  private texts: {
    best: Phaser.GameObjects.Text;
    atp: Phaser.GameObjects.Text;
    base: Phaser.GameObjects.Text;
    wave: Phaser.GameObjects.Text;
  } = {} as never;
  private fx: { x: number; y: number; r: number; life: number; color: number }[] = [];
  private floaters: { text: Phaser.GameObjects.Text; life: number }[] = [];
  private panel: Panel;
  private fast = false;
  private collectTimer = 0;
  private bars = { pipsX: 0, pipsY: 0, pipsW: 0, progX: 0, progY: 0, progW: 0 };

  constructor() {
    super(SCENES.idle);
  }

  create(): void {
    music.setMain('idle');
    this.panel = undefined;
    this.fast = false;
    this.collectNow();
    this.input.keyboard?.on('keydown-ESC', () => (this.panel ? this.closePanel() : this.back()));
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => idleRunner.setSpeed(1));
  }

  private back(): void {
    this.collectNow();
    this.scene.start(SCENES.hub);
  }

  /** Coleta o ATP que o campo produziu (a tela aberta coleta sozinha). */
  private collectNow(): void {
    idleRunner.flush();
    const save = getSave(this);
    const c = collect(save.idle, save.atp);
    // O ATP coletado conta para os pontos herdados do indivíduo.
    if (c.atp !== save.atp) {
      setSave(this, {
        ...save,
        idle: c.idle,
        atp: c.atp,
        organism: earn(save.organism, c.atp - save.atp),
      });
    }
  }

  /** Aplica uma compra no save e recria o campo com o pool novo. */
  private apply(result: { idle: IdleProgress; atp: number } | null): void {
    if (!result) return;
    idleRunner.flush();
    const save = getSave(this);
    setSave(this, {
      ...save,
      idle: { ...result.idle, wave: save.idle.wave, pending: save.idle.pending },
      atp: result.atp,
    });
    idleRunner.rebuild();
    this.build();
  }

  private build(): void {
    this.root?.destroy();
    // Sprites do campo e números ficam fora do container: somem junto com a tela antiga.
    for (const img of [...this.enemyPool, ...this.shotPool]) img.destroy();
    for (const f of this.floaters) f.text.destroy();
    this.enemyPool = [];
    this.shotPool = [];
    this.floaters = [];
    const { w, h } = this.size;
    const safe = safeAreaUi(this.cameras.main.zoom);
    const save = getSave(this);
    const out: Obj[] = [];
    const bg = this.add.graphics();
    out.push(bg);
    bg.fillStyle(PALETTE.night).fillRect(0, 0, w, h);

    const top = safe.top;
    const bottom = h - safe.bottom;
    const fieldTop = top + TOP_H;
    const fieldBottom = bottom - BOTTOM_H - POOL_H;
    out.push(...this.topBar(bg, w, top, save.idle));

    // O campo ocupa o espaço entre as paredes, como na prancheta: as posições da simulação esticam
    // em cada eixo e os sprites ficam com a escala menor. A proporção fica entre MIN e MAX_ASPECT
    // para o campo não virar uma faixa na tela deitada.
    const availW = w - WALL * 2;
    const availH = fieldBottom - fieldTop - BASE_STRIP;
    const fw = Math.min(availW, availH * MAX_ASPECT);
    const fh = Math.min(availH, fw / MIN_ASPECT);
    const sx = fw / IDLE.field.width;
    const sy = fh / IDLE.field.height;
    const scale = Math.min(sx, sy);
    const fx = Math.round((w - fw) / 2);
    // A BASE encosta no pool; o que sobra fica no topo do campo, por onde as moléculas entram.
    const fy = Math.round(fieldBottom - BASE_STRIP - fh);
    this.fieldBox = { x: fx, y: fy, w: fw, h: fh, sx, sy, scale };
    this.drawField(bg, w, fieldTop, fieldBottom, fx, fy, fw, fh);
    out.push(
      this.add
        .text(w / 2, fy + fh + BASE_STRIP / 2, 'BASE', {
          ...labelText(11, PALETTE_CSS.tagText),
          letterSpacing: 2,
        })
        .setOrigin(0.5),
    );

    this.dyn = this.add.graphics();
    out.push(this.dyn);
    out.push(...this.poolBar(bg, w, fieldBottom, save.idle));
    out.push(...this.bottomBar(bg, w, bottom - BOTTOM_H));
    if (this.panel) out.push(...this.panelView(w, h, save.idle, save.atp));
    this.root = this.add.container(0, 0, out);
  }

  private topBar(
    g: Phaser.GameObjects.Graphics,
    w: number,
    top: number,
    idle: IdleProgress,
  ): Obj[] {
    g.fillStyle(PALETTE.night).fillRect(0, 0, w, top + TOP_H);
    g.fillStyle(PALETTE.ink).fillRect(0, top + TOP_H - 4, w, 4);
    const y = top + 14;
    this.texts.best = this.add
      .text(14 + 20, y + 2, String(idle.bestWave), {
        ...impactText(30, PALETTE_CSS.cyan),
        stroke: PALETTE_CSS.cyanOutline,
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0);
    // BASE em pips numa moldura de madeira, como a barra de interações da prancheta.
    const coinW = 96;
    const px = 14 + 40 + 8;
    const pw = w - px - 14 - coinW - 8;
    g.fillStyle(PALETTE.outline).fillRect(px, y + 4, pw, 28);
    g.fillStyle(PALETTE.woodDark).fillRect(px + 4, y + 8, pw - 8, 20);
    g.fillStyle(PALETTE.woodLight).fillRect(px + 4, y + 8, pw - 8, 2);
    g.fillStyle(PALETTE.panelDeep).fillRect(px + 7, y + 11, pw - 14, 14);
    this.bars.pipsX = px + 10;
    this.bars.pipsY = y + 14;
    this.bars.pipsW = pw - 20;
    // ATP: octógono dourado e o número.
    const cx = w - 14 - coinW;
    g.fillStyle(PALETTE.goldDark)
      .fillRect(cx + 4, y + 7, 14, 22)
      .fillRect(cx, y + 11, 22, 14);
    g.fillStyle(PALETTE.gold)
      .fillRect(cx + 7, y + 10, 8, 16)
      .fillRect(cx + 3, y + 14, 16, 8);
    g.fillStyle(PALETTE.goldHi).fillRect(cx + 9, y + 13, 4, 10);
    this.texts.atp = this.add.text(
      cx + 28,
      y + 6,
      '',
      withShadow({ ...bodyText(20, PALETTE_CSS.white), fontStyle: '700' }, PALETTE_CSS.ink, 3),
    );
    this.texts.base = this.add.text(14, y + 46, '', labelText(12, PALETTE_CSS.textSoft));
    this.texts.wave = this.add
      .text(
        w - 14,
        y + 40,
        '',
        withShadow(impactText(24, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 3),
      )
      .setOrigin(1, 0);
    return [this.texts.best, this.texts.atp, this.texts.base, this.texts.wave];
  }

  private drawField(
    g: Phaser.GameObjects.Graphics,
    w: number,
    top: number,
    bottom: number,
    fx: number,
    fy: number,
    fw: number,
    fh: number,
  ): void {
    // Paredes de pedra nas laterais.
    g.fillStyle(PALETTE.stone)
      .fillRect(0, top, fx, bottom - top)
      .fillRect(fx + fw, top, w - fx - fw, bottom - top);
    g.fillStyle(0x3e4c68);
    for (let y = top; y < bottom; y += 22) {
      g.fillRect(0, y, fx, 4).fillRect(fx + fw, y, w - fx - fw, 4);
      for (let x = (Math.floor((y - top) / 22) % 2) * 13; x < fx; x += 26) g.fillRect(x, y, 4, 22);
      for (let x = fx + fw + (Math.floor((y - top) / 22) % 2) * 13; x < w; x += 26)
        g.fillRect(x, y, 4, 22);
    }
    g.fillStyle(0x2a3349)
      .fillRect(fx - 4, top, 4, bottom - top)
      .fillRect(fx + fw, top, 4, bottom - top);
    // Areia com o rejunte a cada 40 unidades.
    g.fillStyle(PALETTE.sand).fillRect(fx, top, fw, bottom - top);
    g.fillStyle(PALETTE.sandGrout);
    const step = 40 * this.fieldBox.scale;
    for (let x = fx; x < fx + fw; x += step) g.fillRect(Math.round(x), top, 3, bottom - top);
    for (let y = fy + fh; y > top; y -= step) g.fillRect(fx, Math.round(y), fw, 3);
    // Faixa da BASE.
    g.fillStyle(PALETTE.outline).fillRect(fx, fy + fh, fw, 4);
    g.fillStyle(PALETTE.darkRed).fillRect(fx, fy + fh + 4, fw, BASE_STRIP - 4);
  }

  private poolBar(g: Phaser.GameObjects.Graphics, w: number, y: number, idle: IdleProgress): Obj[] {
    g.fillStyle(PALETTE.woodDark).fillRect(0, y, w, POOL_H);
    g.fillStyle(PALETTE.outline).fillRect(0, y, w, 4);
    g.fillStyle(PALETTE.woodLight).fillRect(0, y + 4, w, 3);
    const out: Obj[] = [
      this.add.text(
        14,
        y + 12,
        'POOL DE AGENTES',
        withShadow(labelText(11, PALETTE_CSS.woodText), PALETTE_CSS.outline, 2),
      ),
      addButton(this, {
        x: w - 14 - 104,
        y: y + 8,
        width: 104,
        height: 24,
        label: 'MELHORIAS',
        fontSize: 10,
        variant: 'secondary',
        onClick: () => this.openPanel({ kind: 'upgrades' }),
      }),
    ];
    const open = openSlots(idle);
    const total = maxSlots();
    for (let pos = 0; pos < total; pos++) {
      const cx = this.fieldBox.x + slotX(pos, total) * this.fieldBox.sx;
      const sx = Math.round(cx - SLOT / 2);
      const sy = y + 42;
      const agent = idle.pool[pos];
      if (pos >= open) {
        g.fillStyle(PALETTE.outline).fillRect(sx, sy, SLOT, SLOT);
        g.fillStyle(0x0e1024).fillRect(sx + 4, sy + 4, SLOT - 8, SLOT - 8);
        drawLock(g, sx + SLOT / 2 - 5, sy + SLOT / 2 - 10, 2);
      } else {
        g.fillStyle(PALETTE.outline).fillRect(sx, sy, SLOT, SLOT);
        drawCreamSlot(g, sx + 4, sy + 4, SLOT - 8, SLOT - 8);
        if (agent) {
          const img = this.add.image(cx, sy + SLOT / 2, textureKey(moleculeName(agent), DETAIL));
          img.setScale(Math.min((SLOT - 16) / img.width, (SLOT - 16) / img.height));
          out.push(img);
          const level = idle.levels[agent] ?? 1;
          if (level > 1) {
            out.push(
              this.add
                .text(sx + SLOT + 6, sy + SLOT + 8, `+${level - 1}`, {
                  ...impactText(14, PALETTE_CSS.white),
                  stroke: PALETTE_CSS.ink,
                  strokeThickness: 4,
                })
                .setOrigin(1, 1),
            );
          }
        } else {
          g.fillStyle(PALETTE.creamShade)
            .fillRect(cx - 2, sy + 20, 4, 22)
            .fillRect(cx - 11, sy + 29, 22, 4);
        }
      }
      const zone = this.add
        .zone(cx, sy + SLOT / 2, SLOT, SLOT)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () =>
        this.openPanel(pos >= open ? { kind: 'upgrades' } : { kind: 'slot', pos }),
      );
      out.push(zone);
    }
    return out;
  }

  private bottomBar(g: Phaser.GameObjects.Graphics, w: number, y: number): Obj[] {
    g.fillStyle(PALETTE.night).fillRect(0, y, w, BOTTOM_H + 40);
    const by = y + 10;
    // Pausa da prancheta: aqui volta para o menu (o campo continua rodando).
    g.fillStyle(PALETTE.ink).fillRect(14, by, 44, 44);
    g.fillStyle(PALETTE.panel).fillRect(18, by + 4, 36, 36);
    g.fillStyle(PALETTE.panelHi).fillRect(18, by + 4, 36, 3);
    g.fillStyle(PALETTE.textLight)
      .fillRect(27, by + 14, 6, 16)
      .fillRect(38, by + 14, 6, 16);
    const back = this.add.zone(36, by + 22, 44, 44).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.back());
    const px = 14 + 44 + 10;
    const xw = 56;
    const pw = w - px - 10 - xw - 14;
    this.bars.progX = px;
    this.bars.progY = by + 22;
    this.bars.progW = pw;
    return [
      back,
      this.add.text(px, by + 4, 'PROGRESSO DA ONDA', labelText(10, PALETTE_CSS.textSoft)),
      addButton(this, {
        x: w - 14 - xw,
        y: by,
        width: xw,
        height: 44,
        label: this.fast ? 'x1' : `x${IDLE.speedUp}`,
        fontSize: 18,
        variant: this.fast ? 'secondary' : 'primary',
        onClick: () => {
          this.fast = !this.fast;
          idleRunner.setSpeed(this.fast ? IDLE.speedUp : 1);
          this.build();
        },
      }),
    ];
  }

  private openPanel(panel: Panel): void {
    this.panel = panel;
    this.build();
  }

  private closePanel(): void {
    this.panel = undefined;
    this.build();
  }

  /** Painel por cima do campo: um espaço do pool (escolher, subir nível, desbloquear) ou as melhorias. */
  private panelView(w: number, h: number, idle: IdleProgress, atp: number): Obj[] {
    const out: Obj[] = [addDim(this, w, h, 0.75)];
    const pw = Math.min(w - 24, 380);
    const left = Math.floor((w - pw) / 2);
    const rows =
      this.panel?.kind === 'upgrades'
        ? UPGRADES.map((key) => this.upgradeRow(key, idle, atp))
        : Object.keys(IDLE.agents).map((id) => this.agentRow(id, idle, atp));
    const rowH = 58;
    const ph = 60 + rows.length * rowH + 56;
    const top = Math.max(12, Math.floor((h - ph) / 2));
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(left, top, pw, ph);
    g.fillStyle(PALETTE.woodDark).fillRect(left + 4, top + 4, pw - 8, ph - 8);
    g.fillStyle(PALETTE.panel).fillRect(left + 8, top + 8, pw - 16, ph - 16);
    const title =
      this.panel?.kind === 'upgrades'
        ? 'MELHORIAS DO CAMPO'
        : `ESPAÇO ${(this.panel?.pos ?? 0) + 1}`;
    out.push(
      g,
      this.add
        .text(w / 2, top + 18, title, impactText(18, PALETTE_CSS.logoOrange))
        .setOrigin(0.5, 0),
    );
    rows.forEach((row, i) => out.push(...row(left + 16, top + 56 + i * rowH, pw - 32)));
    out.push(
      addButton(this, {
        x: left + 16,
        y: top + ph - 50,
        width: pw - 32,
        height: 36,
        label: 'FECHAR',
        fontSize: 12,
        variant: 'secondary',
        onClick: () => this.closePanel(),
      }),
    );
    return out;
  }

  private agentRow(id: string, idle: IdleProgress, atp: number) {
    return (x: number, y: number, w: number): Obj[] => {
      const def = IDLE.agents[id]!;
      const pos = this.panel?.kind === 'slot' ? this.panel.pos : 0;
      const unlocked = idle.agents.includes(id);
      const here = idle.pool[pos] === id;
      const level = idle.levels[id] ?? 1;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.ink).fillRect(x, y, w, 52);
      g.fillStyle(here ? PALETTE.panelLight : PALETTE.panelDeep).fillRect(x + 2, y + 2, w - 4, 48);
      drawCreamSlot(g, x + 6, y + 6, 40, 40);
      const img = this.add.image(x + 26, y + 26, textureKey(moleculeName(id), DETAIL));
      img.setScale(Math.min(34 / img.width, 34 / img.height)).setAlpha(unlocked ? 1 : 0.4);
      const out: Obj[] = [
        g,
        img,
        this.add.text(
          x + 54,
          y + 6,
          unlocked ? `${def.name} · NV ${level}` : def.name,
          bodyText(12, PALETTE_CSS.text),
        ),
        this.add.text(x + 54, y + 24, def.description, {
          ...bodyText(8, PALETTE_CSS.textSoft),
          wordWrap: { width: w - 54 - 100 },
        }),
      ];
      const button = (
        label: string,
        can: boolean,
        onClick: () => void,
        variant: 'primary' | 'secondary' = 'primary',
      ) =>
        addButton(this, {
          x: x + w - 94,
          y: y + 12,
          width: 88,
          height: 28,
          label,
          fontSize: 9,
          variant: can ? variant : 'secondary',
          onClick: () => {
            if (can) onClick();
          },
        });
      if (!unlocked) {
        const cost = IDLE.unlockCost[id] ?? 0;
        out.push(button(`${cost} ATP`, atp >= cost, () => this.apply(buyIdleAgent(idle, atp, id))));
      } else if (here) {
        const cost = levelCost(level);
        out.push(button(`NV+ ${cost}`, atp >= cost, () => this.apply(buyLevel(idle, atp, id))));
      } else {
        out.push(
          button(
            'COLOCAR',
            true,
            () => this.apply({ idle: placeAgent(idle, pos, id), atp }),
            'secondary',
          ),
        );
      }
      return out;
    };
  }

  private upgradeRow(key: IdleUpgradeKey, idle: IdleProgress, atp: number) {
    return (x: number, y: number, w: number): Obj[] => {
      const def = IDLE.upgrades[key];
      const level = idle.upgrades[key];
      const maxed = level >= def.maxLevel;
      const cost = upgradeCost(key, level);
      const effect =
        key === 'fireRate'
          ? `+${Math.round(def.perLevel * 100)}% de ritmo por nível`
          : key === 'baseSlots'
            ? `+${def.perLevel} espaço no pool`
            : `+${def.perLevel} h de produção offline`;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.ink).fillRect(x, y, w, 52);
      g.fillStyle(PALETTE.panelDeep).fillRect(x + 2, y + 2, w - 4, 48);
      return [
        g,
        this.add.text(
          x + 10,
          y + 6,
          `${def.name} · ${level}/${def.maxLevel}`,
          bodyText(12, PALETTE_CSS.text),
        ),
        this.add.text(x + 10, y + 26, effect, bodyText(9, PALETTE_CSS.textSoft)),
        addButton(this, {
          x: x + w - 94,
          y: y + 12,
          width: 88,
          height: 28,
          label: maxed ? 'MÁXIMO' : `${cost} ATP`,
          fontSize: 9,
          variant: !maxed && atp >= cost ? 'primary' : 'secondary',
          onClick: () => {
            if (!maxed && atp >= cost) this.apply(buyUpgrade(idle, atp, key));
          },
        }),
      ];
    };
  }

  override update(_time: number, delta: number): void {
    const field = idleRunner.field;
    if (!field || !this.root) return;
    const dt = delta / 1000;
    this.collectTimer += dt;
    if (this.collectTimer >= 1) {
      this.collectTimer = 0;
      this.collectNow();
    }
    const save = getSave(this);
    const { x: fx, y: fy, sx, sy, scale } = this.fieldBox;
    const toX = (v: number) => fx + v * sx;
    const toY = (v: number) => fy + v * sy;

    this.texts.best.setText(String(save.idle.bestWave));
    this.texts.atp.setText(Math.floor(save.atp + field.atp).toLocaleString('pt-BR'));
    this.texts.base.setText(`INTERAÇÕES ${field.baseHp}/${IDLE.field.baseInteractions}`);
    this.texts.wave.setText(`ONDA ${field.wave}`);

    const g = this.dyn.clear();
    // BASE em pips.
    const n = IDLE.field.baseInteractions;
    const pip = (this.bars.pipsW - (n - 1) * 2) / n;
    for (let i = 0; i < n; i++) {
      const on = i < field.baseHp;
      g.fillStyle(on ? PALETTE.interaction : PALETTE.panel).fillRect(
        this.bars.pipsX + i * (pip + 2),
        this.bars.pipsY,
        pip,
        8,
      );
      g.fillStyle(on ? PALETTE.darkRed : PALETTE.panelDeep).fillRect(
        this.bars.pipsX + i * (pip + 2),
        this.bars.pipsY + 6,
        pip,
        2,
      );
    }
    // Progresso da onda.
    const { progX, progY, progW } = this.bars;
    g.fillStyle(PALETTE.ink).fillRect(progX, progY, progW, 18);
    g.fillStyle(PALETTE.panelDeep).fillRect(progX + 3, progY + 3, progW - 6, 12);
    const p = Math.round((progW - 6) * waveProgress(field));
    g.fillStyle(PALETTE.progress).fillRect(progX + 3, progY + 3, p, 12);
    g.fillStyle(PALETTE.progressShade).fillRect(progX + 3, progY + 12, p, 3);

    if (this.panel) return;

    // Aura do Magnésio perto da base.
    const aura = field.slots.find((s) => IDLE.agents[s.agent]?.kind === 'aura');
    if (aura) {
      const r = (IDLE.agents[aura.agent]!.radius ?? 120) * sy;
      g.fillStyle(PALETTE.uv, 0.12).fillRect(fx, fy + this.fieldBox.h - r, this.fieldBox.w, r);
    }

    // Moléculas e disparos.
    const pool = (list: Phaser.GameObjects.Image[], count: number) => {
      while (list.length < count) list.push(this.add.image(0, 0, '__DEFAULT'));
      list.forEach((img, i) => img.setVisible(i < count));
    };
    pool(this.enemyPool, field.enemies.length);
    field.enemies.forEach((e, i) => {
      const img = this.enemyPool[i]!;
      img
        .setTexture(textureKey(ENEMY_TEXTURES[e.kind], DETAIL))
        .setPosition(toX(e.x), toY(e.y))
        .setScale((scale / DETAIL) * (e.boss ? 1 : 0.8));
      if (e.hitFlash > 0) img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else img.clearTint();
      if (e.hp < e.maxHp) {
        const bw = e.radius * 2 * scale;
        g.fillStyle(PALETTE.ink).fillRect(
          toX(e.x) - bw / 2,
          toY(e.y) - e.radius * scale - 8,
          bw,
          4,
        );
        g.fillStyle(PALETTE.interaction).fillRect(
          toX(e.x) - bw / 2 + 1,
          toY(e.y) - e.radius * scale - 7,
          (bw - 2) * (e.hp / e.maxHp),
          2,
        );
      }
    });
    pool(this.shotPool, field.shots.length);
    field.shots.forEach((s, i) => {
      this.shotPool[i]!.setTexture(textureKey(TEXTURES.shot, DETAIL))
        .setPosition(toX(s.x), toY(s.y))
        .setScale((scale / DETAIL) * (s.radius > 0 ? 1.3 : 0.9));
    });

    for (const ev of drainIdleEvents(field)) {
      if (ev.type === 'splash')
        this.fx.push({
          x: toX(ev.x),
          y: toY(ev.y),
          r: ev.radius * scale,
          life: 0.25,
          color: PALETTE.uv,
        });
      if (ev.type === 'kill')
        this.fx.push({ x: toX(ev.x), y: toY(ev.y), r: 10 * scale, life: 0.2, color: 0xffffff });
      if (ev.type === 'base') {
        this.cameras.main.shake(80, 0.004);
        this.floater(
          this.size.w / 2,
          fy + this.fieldBox.h - 10,
          `-${ev.amount}`,
          PALETTE_CSS.numberHurt,
        );
      }
      if (ev.type === 'fallback')
        this.floater(
          this.size.w / 2,
          fy + this.fieldBox.h / 2,
          `ONDA ${ev.wave}`,
          PALETTE_CSS.alert,
        );
    }
    this.fx = this.fx.filter((f) => (f.life -= dt) > 0);
    for (const f of this.fx) {
      g.lineStyle(2, f.color, Math.min(1, f.life * 5)).strokeRect(
        f.x - f.r,
        f.y - f.r,
        f.r * 2,
        f.r * 2,
      );
    }
    this.floaters = this.floaters.filter((f) => {
      f.life -= dt;
      f.text.y -= 20 * dt;
      f.text.setAlpha(Math.max(0, f.life));
      if (f.life <= 0) f.text.destroy();
      return f.life > 0;
    });
  }

  private floater(x: number, y: number, label: string, color: string): void {
    const text = this.add
      .text(x, y, label, {
        ...impactText(18, color),
        stroke: PALETTE_CSS.outline,
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.floaters.push({ text, life: 1 });
  }
}
