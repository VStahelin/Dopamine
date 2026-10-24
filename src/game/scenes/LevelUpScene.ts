import * as Phaser from 'phaser';
import {
  PASSIVES,
  STATS,
  WEAPONS,
  type PassiveId,
  type RunStatKey,
  type WeaponId,
} from '../../config';
import type { RunState } from '../../core/run/state';
import { statDef } from '../../core/run/stats';
import { chooseSynapse } from '../../core/run/structures';
import {
  applyChoice,
  banishChoice,
  levelUpOffer,
  remaining,
  rerollOffer,
  skipLevelUp,
  type UpgradeChoice,
} from '../../core/run/upgrades';
import { weaponMaxLevel } from '../../core/run/weaponParams';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIcon, iconTexture } from '../render/textures';
import {
  addIconSlot,
  choiceSlot,
  passiveSlot,
  rowSlots,
  weaponSlot,
  type SlotContent,
} from '../ui/iconSlot';
import { slotCounts, STAT_GROUPS } from '../ui/pauseContent';
import { safeAreaUi } from '../ui/safeArea';
import { statTrend } from '../ui/statText';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { choicePreview, describeChoice, statShown, type ChoicePreview } from '../ui/upgradeText';
import { SCENES } from './keys';

interface LevelUpData {
  run: RunState;
  onDone: () => void;
  /** Sinapse cheia (fase 5.11): os mesmos cartões, sem Rerrolar, Pular e Banir. */
  synapse?: boolean;
}

type Action = 'rerolls' | 'skips' | 'banishes';

const KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
/** Ignora toques logo que a tela abre, para um dedo no joystick não escolher sem querer. */
const INPUT_DELAY_MS = 350;
/** Largura lógica a partir da qual vale a prancheta do PC (três colunas). */
const WIDE_MIN_W = 960;
/** Colunas da prancheta do PC: atributos, cartões e arsenal. */
const SIDE_W = 300;
const GUTTER = 32;

/** Cores da prancheta que não estão na paleta geral. */
const COLOR = {
  heal: 0x6cd43f,
  focus: 0xffffff,
  banishBg: 0x3a1420,
  changedBg: 0x1e3a2a,
  changed: 0x8cf06a,
  rowLine: PALETTE.panel,
};

const ACTIONS: Record<Action, { icon: PassiveId; label: string; key: string; hint: string }> = {
  rerolls: { icon: 'reroll', label: 'REROLAR', key: 'R', hint: 'Sorteia outras opções' },
  skips: { icon: 'skip', label: 'PULAR', key: 'S', hint: 'Recusa este level up' },
  banishes: { icon: 'banish', label: 'BANIR', key: 'B', hint: 'Tira uma opção da run' },
};

const hex = (color: string) => parseInt(color.slice(1), 16);

/** Cor da moldura do cartão: a raridade; arma sem raridade em ciano, cura em verde. */
function ringColor(choice: UpgradeChoice, rarity?: { color: string }): number {
  if (rarity) return hex(rarity.color);
  return choice.kind === 'heal' || choice.kind === 'phosphocreatine' ? COLOR.heal : PALETTE.water;
}

/** Só armas e receptores podem ser banidos. */
const banishable = (c: UpgradeChoice) =>
  c.kind === 'weapon' || c.kind === 'evolve' || c.kind === 'passive';

/**
 * Tela de level up (pranchetas "Crônico: level up" e "Crônico: level up no PC"). No celular, uma
 * coluna: título, os espaços de arma e receptor, os cartões com a prévia do que muda, e
 * Rerrolar, Pular e Banir embaixo. No PC, a mesma coluna no meio, com os atributos à esquerda e
 * o arsenal à direita; passar o mouse num cartão mostra nos dois o que ele muda. Teclas 1 a 5
 * escolhem; R, S e B são as ações.
 */
export class LevelUpScene extends Phaser.Scene {
  private data_!: LevelUpData;
  private root?: Phaser.GameObjects.Container;
  private sides?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };
  private banishing = false;
  private openedAt = 0;
  private focus = 0;
  private focusRings: Phaser.GameObjects.Graphics[] = [];
  private previews: ChoicePreview[] = [];

  constructor() {
    super(SCENES.levelUp);
  }

  create(data: LevelUpData): void {
    this.data_ = data;
    this.banishing = false;
    this.focus = 0;
    this.openedAt = this.time.now;
    KEYS.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => {
        const choice = this.offer()[i];
        if (choice) this.pick(choice);
      });
    });
    this.input.keyboard?.on('keydown-R', () => this.reroll());
    this.input.keyboard?.on('keydown-S', () => this.skip());
    this.input.keyboard?.on('keydown-B', () => this.toggleBanish());
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
  }

  private ready(): boolean {
    return this.time.now - this.openedAt >= INPUT_DELAY_MS;
  }

  private wide(): boolean {
    const { w, h } = this.size;
    return w >= WIDE_MIN_W && w > h;
  }

  private build(): void {
    this.root?.destroy();
    this.sides?.destroy();
    this.sides = undefined;
    const { w, h } = this.size;
    const safe = safeAreaUi(this.cameras.main.zoom);
    const wide = this.wide();
    const top = safe.top + (wide ? GUTTER : 40);
    const bottom = h - safe.bottom - (wide ? GUTTER : 24);
    const colW = wide
      ? Math.min(560, w - 2 * (GUTTER + SIDE_W + GUTTER))
      : Math.min(440, w - safe.left - safe.right - 24);
    const left = Math.floor((w - colW) / 2);
    this.previews = this.offer().map((c) => choicePreview(this.data_.run, c));
    this.focus = Math.min(this.focus, Math.max(0, this.previews.length - 1));

    // Tenta a prancheta inteira; se não couber (celular deitado), tira os espaços de ícone e
    // depois a prévia dos cartões.
    const tries = wide
      ? [
          { slots: false, compact: false },
          { slots: false, compact: true },
        ]
      : [
          { slots: true, compact: false },
          { slots: false, compact: false },
          { slots: false, compact: true },
        ];
    for (const [i, t] of tries.entries()) {
      this.root?.destroy();
      const fits = this.buildColumn(left, top, colW, bottom, wide, t.slots, t.compact);
      if (fits || i === tries.length - 1) break;
    }
    if (wide) this.buildSides(top, bottom);
  }

  /** Coluna dos cartões; devolve se coube entre `top` e `bottom`. */
  private buildColumn(
    left: number,
    top: number,
    width: number,
    bottom: number,
    wide: boolean,
    slots: boolean,
    compact: boolean,
  ): boolean {
    const { w, h } = this.size;
    const run = this.data_.run;
    const synapse = this.data_.synapse === true;
    const offer = this.offer();
    const children: Phaser.GameObjects.GameObject[] = [addDim(this, w, h, 0.8)];
    this.focusRings = [];
    let y = top;

    const title = synapse ? 'SINAPSE' : this.banishing ? 'BANIR' : `NÍVEL ${run.level}!`;
    const subtitle = synapse
      ? 'BÔNUS ATÉ O FIM DA RUN · NÃO OCUPA ESPAÇO'
      : this.banishing
        ? 'TOQUE NA OPÇÃO QUE SAI DA RUN'
        : 'ESCOLHA UMA ARMA OU RECEPTOR';
    const titleText = this.add
      .text(
        w / 2,
        y,
        title,
        impactText(
          compact ? 26 : wide ? 44 : 34,
          this.banishing ? PALETTE_CSS.numberHurt : PALETTE_CSS.cyan,
        ),
      )
      .setOrigin(0.5, 0);
    y += titleText.height + 2;
    const sub = this.add
      .text(
        w / 2,
        y,
        subtitle,
        labelText(10, this.banishing ? PALETTE_CSS.alert : PALETTE_CSS.cream),
      )
      .setOrigin(0.5, 0);
    y += sub.height + 14;
    children.push(titleText, sub);

    if (slots) {
      const { weaponOpen, held, passiveOpen } = slotCounts(run);
      const rows = [
        rowSlots(
          run.weapons.map((wp) => weaponSlot(wp)),
          weaponOpen,
        ),
        rowSlots(
          held.map((id) => passiveSlot(id, run.passives[id]!.level)),
          passiveOpen,
        ),
      ];
      for (const row of rows) {
        const rowW = row.length * 24 + (row.length - 1) * 4;
        row.forEach((content, i) => {
          children.push(
            ...addIconSlot(this, Math.floor((w - rowW) / 2) + i * 28, y, 1, content).objects,
          );
        });
        y += 28;
      }
      y += 10;
    }

    offer.forEach((choice, i) => {
      const card = this.card(choice, i, left, y, width, wide, compact);
      children.push(...card.objects);
      y += card.height + (compact ? 6 : 10);
    });

    // Rodapé de baixo para cima: dica do teclado, ações, banidos.
    let foot = bottom;
    if (wide) {
      const hint = this.add
        .text(
          w / 2,
          foot,
          `1 A ${offer.length} ESCOLHEM · PASSE O MOUSE PARA VER O EFEITO NOS ATRIBUTOS`,
          labelText(9, PALETTE_CSS.muted),
        )
        .setOrigin(0.5, 1);
      children.push(hint);
      foot -= hint.height + 8;
    }
    if (!synapse) {
      const buttonH = compact ? 44 : 56;
      const hintH = wide ? 14 : 0;
      foot -= buttonH + hintH;
      children.push(...this.actions(left, foot, width, buttonH, wide));
      foot -= 10;
      const banished = this.banishedNames();
      if (banished.length > 0) {
        const line = this.add
          .text(w / 2, foot, `BANIDOS NESTA RUN: ${banished.join(', ')}`, {
            ...labelText(9, PALETTE_CSS.alert),
            align: 'center',
            wordWrap: { width },
          })
          .setOrigin(0.5, 1);
        children.push(line);
        foot -= line.height + 8;
      }
    }

    this.root = this.add.container(0, 0, children);
    return y - (compact ? 6 : 10) <= foot;
  }

  /** Um cartão: faixa e moldura da raridade, ícone, nome, etiqueta, efeito, prévia e evolução. */
  private card(
    choice: UpgradeChoice,
    index: number,
    x: number,
    y: number,
    width: number,
    wide: boolean,
    compact: boolean,
  ): { objects: Phaser.GameObjects.GameObject[]; height: number } {
    const text = describeChoice(choice);
    const preview = this.previews[index] ?? {};
    const blocked = this.banishing && !banishable(choice);
    const ring = this.banishing ? PALETTE.interaction : ringColor(choice, text.rarity);
    const tagColor =
      text.rarity?.color ?? (ringColor(choice) === COLOR.heal ? '#6CD43F' : PALETTE_CSS.water);
    const textX = x + 16 + 40 + 10;
    const textW = x + width - 12 - textX;

    const parts: Phaser.GameObjects.GameObject[] = [];
    let ty = y + 10;
    const name = this.add.text(
      textX,
      ty,
      text.title,
      withShadow(
        { ...bodyText(wide ? 18 : 16, PALETTE_CSS.text), fontStyle: '700' },
        PALETTE_CSS.ink,
        2,
      ),
    );
    const tag = this.add
      .text(
        x + width - 12,
        ty + 4,
        [text.rarity?.name.toUpperCase(), text.level].filter(Boolean).join(' · '),
        labelText(8, tagColor),
      )
      .setOrigin(1, 0);
    // A etiqueta cede espaço ao nome: em cartão estreito, desce para a linha de baixo.
    if (name.width + tag.width + 8 > width - 12 - (textX - x)) tag.setY(ty + name.height);
    parts.push(name, tag);
    ty = Math.max(ty + name.height, tag.y + tag.height) + 3;
    const desc = this.add.text(textX, ty, text.description, {
      ...bodyText(wide ? 14 : 12, PALETTE_CSS.text),
      fontStyle: '400',
      wordWrap: { width: textW },
      lineSpacing: 2,
      maxLines: compact ? 1 : 3,
    });
    parts.push(desc);
    ty += desc.height + 3;
    if (!compact && preview.line) {
      const line = this.add.text(textX, ty, preview.line, {
        ...bodyText(wide ? 13 : 12, PALETTE_CSS.numberHeal),
        fontStyle: '700',
        wordWrap: { width: textW },
      });
      parts.push(line);
      ty += line.height + 3;
    }
    if (!compact && preview.evo) {
      const evo = this.add.text(textX, ty, preview.evo, {
        ...labelText(8, PALETTE_CSS.goldIcon),
        wordWrap: { width: textW },
      });
      parts.push(evo);
      ty += evo.height + 3;
    }
    const height = Math.max(compact ? 52 : 60, ty - 3 - y + 10);

    const focus = this.add.graphics();
    focus.fillStyle(COLOR.focus).fillRect(x - 3, y - 3, width + 6, height + 6);
    focus.setVisible(wide && !this.banishing && index === this.focus);
    this.focusRings.push(focus);
    const g = this.add.graphics();
    g.fillStyle(this.banishing ? PALETTE.outline : PALETTE.ink).fillRect(x, y, width, height);
    g.fillStyle(ring).fillRect(x + 3, y + 3, width - 6, height - 6);
    g.fillStyle(this.banishing ? COLOR.banishBg : PALETTE.panel).fillRect(
      x + 6,
      y + 6,
      width - 12,
      height - 12,
    );
    g.fillStyle(ring).fillRect(x + 5, y + 5, 4, height - 10);

    const objects: Phaser.GameObjects.GameObject[] = [focus, g];
    objects.push(...addIconSlot(this, x + 16, y + 10, 2, choiceSlot(choice)).objects);
    objects.push(...parts);
    if (wide) {
      objects.push(
        this.add
          .text(x + width - 8, y + height - 6, String(index + 1), labelText(10, PALETTE_CSS.cyan))
          .setOrigin(1, 1),
      );
    }
    if (this.banishing && !blocked) {
      const label = this.add
        .text(x + width - 14, y - 7, 'BANIR', labelText(9, PALETTE_CSS.white))
        .setOrigin(1, 0);
      const bg = this.add.graphics();
      bg.fillStyle(PALETTE.outline).fillRect(
        label.x - label.width - 8,
        y - 9,
        label.width + 12,
        label.height + 4,
      );
      bg.fillStyle(PALETTE.interaction).fillRect(
        label.x - label.width - 6,
        y - 7,
        label.width + 8,
        label.height,
      );
      label.setX(label.x - 2);
      objects.push(bg, label);
    }
    if (blocked) for (const o of objects) (o as Phaser.GameObjects.Image).setAlpha(0.4);

    const zone = this.add
      .zone(x + width / 2, y + height / 2, width, height)
      .setInteractive({ useHandCursor: !blocked });
    // Só escolhe se o toque começou na carta: o dedo que movia o agente já estava na tela
    // quando o level up abriu, e soltá-lo em cima de uma carta escolhia sem querer.
    let armed = false;
    zone.on('pointerdown', () => (armed = true));
    zone.on('pointerout', () => (armed = false));
    zone.on('pointerover', () => this.setFocus(index));
    zone.on('pointerup', () => {
      if (armed) this.pick(choice);
      armed = false;
    });
    objects.push(zone);
    return { objects, height };
  }

  /** Rerrolar, Pular e Banir: ícone, nome e os usos; apagados sem usos. */
  private actions(
    x: number,
    y: number,
    width: number,
    height: number,
    wide: boolean,
  ): Phaser.GameObjects.GameObject[] {
    const run = this.data_.run;
    const gap = 8;
    const bw = Math.floor((width - gap * 2) / 3);
    const out: Phaser.GameObjects.GameObject[] = [];
    (Object.keys(ACTIONS) as Action[]).forEach((action, i) => {
      const def = ACTIONS[action];
      const left = x + i * (bw + gap);
      const uses = remaining(run, action);
      const on = uses > 0;
      const active = action === 'banishes' && this.banishing;
      const face = active
        ? { fill: PALETTE.darkRed, hi: PALETTE.interaction, shade: PALETTE.wine }
        : on
          ? { fill: PALETTE.panel, hi: PALETTE.panelHi, shade: PALETTE.panelShade }
          : { fill: PALETTE.night, hi: PALETTE.night, shade: PALETTE.night };
      const g = this.add.graphics();
      g.fillStyle(PALETTE.ink).fillRect(left, y, bw, height);
      g.fillStyle(face.fill).fillRect(left + 3, y + 3, bw - 6, height - 6);
      g.fillStyle(face.hi).fillRect(left + 3, y + 3, bw - 6, 3);
      g.fillStyle(face.shade).fillRect(left + 3, y + height - 6, bw - 6, 3);
      out.push(g);

      const label = this.add
        .text(0, y + height / 2, active ? 'CANCELAR' : def.label, {
          ...labelText(11, active ? PALETTE_CSS.white : on ? PALETTE_CSS.text : '#5C6090'),
        })
        .setOrigin(0, 0.5);
      // Sem largura para o ícone (celular estreito), fica só o nome.
      const iconPx = bw - 16 >= 32 + 8 + label.width ? 32 : 0;
      const content = iconPx + (iconPx ? 8 : 0) + label.width;
      const cx = left + Math.floor((bw - content) / 2);
      if (iconPx) {
        out.push(
          addIcon(
            this,
            cx,
            y + Math.floor((height - 32) / 2),
            iconTexture('passives', def.icon),
            32,
          ).setAlpha(on ? 1 : 0.35),
        );
      }
      label.setX(cx + content - label.width);
      out.push(label);

      const count = this.add
        .text(
          0,
          0,
          on ? `×${uses}` : '0',
          labelText(10, on ? PALETTE_CSS.sectionOrange : '#5C6090'),
        )
        .setOrigin(0.5, 0.5);
      const cw = Math.max(22, count.width + 10);
      const ch = count.height + 4;
      const bx = left + bw + 6 - cw;
      const by = y - 9;
      const badge = this.add.graphics();
      badge.fillStyle(PALETTE.ink).fillRect(bx, by, cw, ch);
      badge.fillStyle(PALETTE.night).fillRect(bx + 2, by + 2, cw - 4, ch - 4);
      count.setPosition(bx + cw / 2, by + ch / 2);
      out.push(badge, count);

      if (wide) {
        out.push(
          this.add
            .text(
              left + bw / 2,
              y + height + 4,
              `${def.key} · ${def.hint}`,
              labelText(8, PALETTE_CSS.muted),
            )
            .setOrigin(0.5, 0),
        );
      }
      if (!on) return;
      const zone = this.add
        .zone(left + bw / 2, y + height / 2, bw, height)
        .setInteractive({ useHandCursor: true });
      let armed = false;
      zone.on('pointerdown', () => (armed = true));
      zone.on('pointerout', () => (armed = false));
      zone.on('pointerup', () => {
        if (armed) this.act(action);
        armed = false;
      });
      out.push(zone);
    });
    return out;
  }

  /** Painéis do PC: atributos à esquerda e arsenal à direita, com o efeito do cartão em foco. */
  private buildSides(top: number, bottom: number): void {
    this.sides?.destroy();
    const { w } = this.size;
    const height = bottom - top;
    const choice = this.banishing ? undefined : this.offer()[this.focus];
    const preview = this.banishing ? undefined : this.previews[this.focus];
    const children = [
      ...this.statsPanel(GUTTER, top, SIDE_W, height, preview),
      ...this.arsenalPanel(w - GUTTER - SIDE_W, top, SIDE_W, height, choice),
    ];
    this.sides = this.add.container(0, 0, children);
  }

  private panel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(x, y, width, height);
    g.fillStyle(PALETTE.wood).fillRect(x + 3, y + 3, width - 6, height - 6);
    g.fillStyle(PALETTE.ink).fillRect(x + 6, y + 6, width - 12, height - 12);
    g.fillStyle(PALETTE.night).fillRect(x + 8, y + 8, width - 16, height - 16);
    return g;
  }

  private statsPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    preview?: ChoicePreview,
  ): Phaser.GameObjects.GameObject[] {
    const run = this.data_.run;
    const after = preview?.after;
    const inner = width - 32;
    const left = x + 16;
    const out: Phaser.GameObjects.GameObject[] = [this.panel(x, y, width, height)];
    out.push(this.add.text(left, y + 16, 'ATRIBUTOS', labelText(12, PALETTE_CSS.sectionOrange)));
    out.push(
      this.add
        .text(left + inner, y + 19, 'COMO NA PAUSA', labelText(8, PALETTE_CSS.muted))
        .setOrigin(1, 0),
    );
    const changes = (key: RunStatKey) =>
      after !== undefined && Math.abs(after[key] - run.stats[key]) > 1e-9;
    const groups = STAT_GROUPS.map(([ids, title]) => ({
      title,
      keys: ids.flatMap((g) => Object.keys(STATS[g])) as RunStatKey[],
    }));
    const headerH = 18;
    const room = height - 16 - 30 - 16;
    const all = groups.reduce((n, g) => n + g.keys.length, 0);
    let rowH = Math.min(17, Math.floor((room - groups.length * (headerH + 4)) / all));
    // Não cabe tudo (tela baixa): só os atributos que mudaram na run ou mudam com o cartão.
    if (rowH < 14) {
      for (const g of groups) {
        g.keys = g.keys.filter(
          (k) => changes(k) || statTrend(k, run.stats[k], statDef(run.rules, k).base) !== 'same',
        );
      }
      rowH = 17;
    }
    let cy = y + 40;
    for (const group of groups) {
      if (group.keys.length === 0) continue;
      if (cy + headerH + rowH > y + height - 14) break;
      const line = this.add.graphics();
      line.fillStyle(COLOR.rowLine).fillRect(left, cy + headerH - 4, inner, 2);
      out.push(line, this.add.text(left, cy, group.title, labelText(9, PALETTE_CSS.cyan)));
      cy += headerH;
      for (const key of group.keys) {
        if (cy + rowH > y + height - 14) break;
        const changed = changes(key);
        const trend = statTrend(key, run.stats[key], statDef(run.rules, key).base);
        const color = changed
          ? PALETTE_CSS.numberHeal
          : trend === 'better'
            ? PALETTE_CSS.numberHeal
            : trend === 'worse'
              ? PALETTE_CSS.alert
              : PALETTE_CSS.text;
        if (changed) {
          const bg = this.add.graphics();
          bg.fillStyle(COLOR.changedBg).fillRect(left, cy, inner, rowH);
          bg.fillStyle(COLOR.changed).fillRect(left, cy, 3, rowH);
          out.push(bg);
        }
        const value = changed
          ? `${statShown(run, key, run.stats)} → ${statShown(run, key, after!)}`
          : statShown(run, key, run.stats);
        out.push(
          this.add.text(
            left + 4,
            cy + 1,
            statDef(run.rules, key).name,
            bodyText(13, PALETTE_CSS.text),
          ),
          this.add
            .text(left + inner - 4, cy + 1, value, { ...bodyText(13, color), fontStyle: '700' })
            .setOrigin(1, 0),
        );
        cy += rowH;
      }
      cy += 6;
    }
    return out;
  }

  private arsenalPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    choice?: UpgradeChoice,
  ): Phaser.GameObjects.GameObject[] {
    const run = this.data_.run;
    const { weaponOpen, held, passiveOpen } = slotCounts(run);
    const left = x + 16;
    const inner = width - 32;
    const out: Phaser.GameObjects.GameObject[] = [this.panel(x, y, width, height)];
    const rowH = Math.min(32, Math.floor((height - 32 - 2 * 24 - 12 * 6) / 12));

    type Row = {
      slot: SlotContent;
      name: string;
      level: string;
      gold?: boolean;
      changed?: boolean;
    };
    const empty = (open: boolean): Row =>
      open
        ? { slot: { frame: 'empty' }, name: 'Espaço livre', level: '' }
        : { slot: { frame: 'locked' }, name: 'Bloqueado', level: '' };

    const weapons: Row[] = run.weapons.map((wp) => {
      const def = WEAPONS[wp.id];
      const max = weaponMaxLevel(def);
      const level = def.source === 'evolution' ? 'EVO' : wp.level >= max ? 'MAX' : `NV ${wp.level}`;
      const slot = { ...weaponSlot(wp), label: undefined };
      if (choice?.kind === 'weapon' && choice.id === wp.id) {
        const to = choice.level >= max ? 'MAX' : `NV ${choice.level}`;
        return { slot, name: def.name, level: `NV ${wp.level} → ${to}`, changed: true };
      }
      if (choice?.kind === 'evolve' && choice.id === wp.id) {
        const into = WEAPONS[choice.into];
        return {
          slot: { frame: 'evolved', icon: iconTexture('weapons', choice.into) },
          name: into.name,
          level: 'EVO',
          changed: true,
        };
      }
      return { slot, name: def.name, level, gold: level === 'MAX' || level === 'EVO' };
    });
    if (choice?.kind === 'weapon' && choice.level === 1 && weapons.length < weaponOpen) {
      weapons.push({
        slot: { frame: 'weapon', icon: iconTexture('weapons', choice.id as WeaponId) },
        name: WEAPONS[choice.id].name,
        level: 'NOVA',
        changed: true,
      });
    }
    const passives: Row[] = held.map((id) => {
      const def = PASSIVES[id];
      const level = run.passives[id]!.level;
      const slot = { ...passiveSlot(id, level), label: undefined };
      if (choice?.kind === 'passive' && choice.id === id) {
        const to = level + 1 >= def.maxLevel ? 'MAX' : `NV ${level + 1}`;
        return { slot, name: def.name, level: `NV ${level} → ${to}`, changed: true };
      }
      const max = level >= def.maxLevel;
      return { slot, name: def.name, level: max ? 'MAX' : `NV ${level}`, gold: max };
    });
    if (
      choice?.kind === 'passive' &&
      !run.passives[choice.id]?.level &&
      passives.length < passiveOpen
    ) {
      passives.push({
        slot: { ...passiveSlot(choice.id, 0), label: undefined },
        name: PASSIVES[choice.id].name,
        level: 'NOVO',
        changed: true,
      });
    }

    let cy = y + 16;
    const section = (title: string, color: string, count: string, rows: Row[], open: number) => {
      out.push(
        this.add.text(left, cy, title, labelText(12, color)),
        this.add.text(left + inner, cy + 2, count, labelText(10, color)).setOrigin(1, 0),
      );
      cy += 24;
      for (let i = 0; i < 6; i++) {
        const row = rows[i] ?? empty(i < open);
        const g = this.add.graphics();
        g.fillStyle(PALETTE.ink).fillRect(left, cy, inner, rowH);
        g.fillStyle(row.changed ? COLOR.changedBg : PALETTE.panelDeep).fillRect(
          left + 2,
          cy + 2,
          inner - 4,
          rowH - 4,
        );
        if (row.changed) g.fillStyle(COLOR.changed).fillRect(left + 2, cy + 2, 3, rowH - 4);
        out.push(g);
        out.push(
          ...addIconSlot(this, left + 8, cy + Math.floor((rowH - 24) / 2), 1, row.slot).objects,
        );
        const dim = row.slot.frame === 'empty' || row.slot.frame === 'locked';
        out.push(
          this.add
            .text(
              left + 40,
              cy + rowH / 2,
              row.name,
              bodyText(13, dim ? PALETTE_CSS.muted : PALETTE_CSS.text),
            )
            .setOrigin(0, 0.5),
          this.add
            .text(
              left + inner - 8,
              cy + rowH / 2,
              row.level,
              labelText(
                9,
                row.changed
                  ? PALETTE_CSS.numberHeal
                  : row.gold
                    ? PALETTE_CSS.goldIcon
                    : PALETTE_CSS.textSoft,
              ),
            )
            .setOrigin(1, 0.5),
        );
        cy += rowH + 6;
      }
      cy += 6;
    };
    section(
      'ARMAS',
      PALETTE_CSS.sectionOrange,
      `${run.weapons.length}/${weaponOpen}`,
      weapons,
      weaponOpen,
    );
    section('RECEPTORES', PALETTE_CSS.cyan, `${held.length}/${passiveOpen}`, passives, passiveOpen);
    return out;
  }

  /** PC: o cartão sob o mouse ganha o contorno branco e mostra o efeito nos painéis. */
  private setFocus(index: number): void {
    if (!this.wide() || index === this.focus) return;
    this.focus = index;
    this.focusRings.forEach((g, i) => g.setVisible(!this.banishing && i === index));
    const safe = safeAreaUi(this.cameras.main.zoom);
    this.buildSides(safe.top + GUTTER, this.size.h - safe.bottom - GUTTER);
  }

  private banishedNames(): string[] {
    return this.data_.run.banished.map((key) => {
      const [kind, id] = key.split(':') as [string, string];
      if (kind === 'passive') return PASSIVES[id as PassiveId]?.name ?? id;
      return WEAPONS[id as WeaponId]?.name ?? id;
    });
  }

  private act(action: Action): void {
    if (action === 'rerolls') this.reroll();
    else if (action === 'skips') this.skip();
    else this.toggleBanish();
  }

  private pick(choice: UpgradeChoice): void {
    if (!this.ready()) return;
    const run = this.data_.run;
    if (this.banishing) {
      if (!banishable(choice)) return;
      this.banishing = false;
      banishChoice(run, choice);
      this.build();
      return;
    }
    if (this.data_.synapse) {
      chooseSynapse(run, choice);
      this.data_.onDone();
      this.scene.stop();
      return;
    }
    applyChoice(run, choice);
    this.next();
  }

  /** Cartões em jogo: os do level up ou os da sinapse. */
  private offer(): UpgradeChoice[] {
    const run = this.data_.run;
    return this.data_.synapse ? (run.synapseOffer ?? []) : levelUpOffer(run);
  }

  private reroll(): void {
    if (this.data_.synapse || !this.ready()) return;
    if (rerollOffer(this.data_.run)) {
      this.banishing = false;
      this.focus = 0;
      this.build();
    }
  }

  private skip(): void {
    if (this.data_.synapse || !this.ready()) return;
    if (skipLevelUp(this.data_.run)) this.next();
  }

  private toggleBanish(): void {
    if (this.data_.synapse || !this.ready()) return;
    if (!this.banishing && remaining(this.data_.run, 'banishes') === 0) return;
    this.banishing = !this.banishing;
    this.build();
  }

  /** Próximo level up pendente, ou volta para a run. */
  private next(): void {
    this.banishing = false;
    this.focus = 0;
    if (this.data_.run.pendingLevelUps > 0) {
      this.openedAt = this.time.now;
      this.build();
      return;
    }
    this.data_.onDone();
    this.scene.stop();
  }
}
