import * as Phaser from 'phaser';
import changelogText from '../../../CHANGELOG.md?raw';
import { parseChangelog } from '../../core/changelog';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addButton } from '../ui/button';
import { drawGrid, drawInkBox } from '../ui/icons';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { addZone, drawFramedPanel, isWideMenu, menuMinSize } from '../ui/wide/wideLayout';
import { updates } from '../update/updateManager';
import { SCENES } from './keys';
import { music } from '../audio/music';

const VERSIONS = parseChangelog(changelogText);

/** Cor do título de cada seção do CHANGELOG.md. */
const SECTION_COLORS: Record<string, string> = {
  Novidades: PALETTE_CSS.cyan,
  Ajustes: PALETTE_CSS.gold,
  Correções: PALETTE_CSS.interaction,
};

/** Novidades: o CHANGELOG.md do repositório, versão por versão, aberto pelas Opções. */
export class ChangelogScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private scroll?: ScrollArea;
  private size = { w: 0, h: 0 };
  /** Versão aberta no PC. */
  private selected = 0;

  constructor() {
    super(SCENES.changelog);
  }

  create(): void {
    music.setMain('hub');
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    // No PC, ↑ e ↓ trocam a versão aberta.
    this.input.keyboard?.on('keydown-UP', () => this.step(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.step(1));
    setupUiLayout(
      this,
      (w, h) => {
        this.size = { w, h };
        this.build();
      },
      menuMinSize({ width: 390, height: 700 }),
    );
  }

  private get wide(): boolean {
    return isWideMenu(this.size.w, this.size.h);
  }

  private step(d: number): void {
    if (!this.wide) return;
    this.selected = Math.max(0, Math.min(VERSIONS.length - 1, this.selected + d));
    this.build();
  }

  private back(): void {
    this.scene.start(SCENES.options, { fromRun: false });
  }

  private build(): void {
    this.root?.destroy();
    const offset = this.scroll?.offset() ?? 0;
    this.scroll?.destroy();
    this.scroll = undefined;
    if (this.wide) {
      this.buildWide();
      return;
    }
    const { w, h } = this.size;
    const bg = this.add.graphics();
    drawGrid(bg, 0, 0, w, h);
    const width = Math.min(w - 24, 360);
    const left = Math.floor((w - width) / 2);
    const g = this.add.graphics();
    const body: Phaser.GameObjects.GameObject[] = [g];
    const wrap = { wordWrap: { width: width - 28 } };
    let y = 64;
    for (const v of VERSIONS) {
      const top = y;
      const texts: Phaser.GameObjects.Text[] = [];
      const add = (t: Phaser.GameObjects.Text, gap: number) => {
        texts.push(t);
        y += t.height + gap;
      };
      y += 10;
      add(
        this.add.text(
          left + 12,
          y,
          v.title.toUpperCase(),
          withShadow(impactText(15, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
        ),
        6,
      );
      for (const line of v.intro) {
        add(
          this.add.text(left + 12, y, line, { ...bodyText(10, PALETTE_CSS.textSoft), ...wrap }),
          4,
        );
      }
      for (const s of v.sections) {
        y += 4;
        add(
          this.add.text(
            left + 12,
            y,
            s.name.toUpperCase(),
            labelText(8, SECTION_COLORS[s.name] ?? PALETTE_CSS.cyan),
          ),
          4,
        );
        for (const item of s.items) {
          add(
            this.add.text(left + 12, y, `·  ${item}`, {
              ...bodyText(10, PALETTE_CSS.text),
              ...wrap,
            }),
            3,
          );
        }
      }
      y += 8;
      drawInkBox(g, left, top, width, y - top, PALETTE.panel);
      body.push(...texts);
      y += 8;
    }
    this.scroll = addScrollArea(this, body, { x: 0, y: 60, width: w, height: h - 132 }, offset);
    const bw = Math.min(w - 32, 220);
    this.root = this.add.container(0, 0, [
      bg,
      this.add
        .text(
          w / 2,
          18,
          'NOVIDADES',
          withShadow(impactText(24, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
        )
        .setOrigin(0.5, 0),
      addButton(this, {
        x: Math.floor((w - bw) / 2),
        y: h - 62,
        width: bw,
        height: 48,
        label: 'VOLTAR',
        variant: 'secondary',
        onClick: () => this.back(),
      }),
    ]);
    this.scroll.isolate();
  }

  /**
   * Novidades no PC (prancheta "Novidades no PC"): as versões numa coluna à esquerda e a
   * versão aberta num painel à direita, que rola quando é longa.
   */
  private buildWide(): void {
    const { w, h } = this.size;
    const bg = this.add.graphics();
    drawGrid(bg, 0, 0, w, h);
    const g = this.add.graphics();
    const out: Phaser.GameObjects.GameObject[] = [bg, g];
    const left = 48;
    const right = w - 48;
    out.push(
      this.add
        .text(
          w / 2,
          32,
          'NOVIDADES',
          withShadow(impactText(40, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 3),
        )
        .setOrigin(0.5, 0),
      this.add
        .text(
          w / 2,
          82,
          'O QUE MUDOU EM CADA VERSÃO · ABERTA PELAS OPÇÕES',
          labelText(10, PALETTE_CSS.textSoft),
        )
        .setOrigin(0.5, 0),
    );
    const top = 112;
    const footH = 52;
    const bottom = h - 32 - footH - 20;

    // Versões: as que couberem, cada uma com a data e a contagem por seção.
    const navW = 300;
    drawInkBox(g, left, top, navW, bottom - top, PALETTE.panelDeep);
    out.push(this.add.text(left + 14, top + 12, 'VERSÕES', labelText(10, PALETTE_CSS.cyan)));
    const rowH = 52;
    const fits = Math.max(1, Math.floor((bottom - top - 40) / (rowH + 6)));
    const first = Math.max(0, Math.min(this.selected - fits + 1, VERSIONS.length - fits));
    const words: Record<string, [string, string]> = {
      Novidades: ['novidade', 'novidades'],
      Ajustes: ['ajuste', 'ajustes'],
      Correções: ['correção', 'correções'],
    };
    VERSIONS.slice(first, first + fits).forEach((v, k) => {
      const i = first + k;
      const on = i === this.selected;
      const x = left + 10;
      const y = top + 32 + k * (rowH + 6);
      const rw = navW - 20;
      if (on) {
        g.fillStyle(PALETTE.outline).fillRect(x, y, rw, rowH);
        g.fillStyle(PALETTE.wood).fillRect(x + 3, y + 3, rw - 6, rowH - 6);
        g.fillStyle(PALETTE.woodHi).fillRect(x + 3, y + 3, rw - 6, 3);
        g.fillStyle(PALETTE.woodShade).fillRect(x + 3, y + rowH - 7, rw - 6, 4);
      } else {
        drawInkBox(g, x, y, rw, rowH, PALETTE.panel);
      }
      const [name, date] = v.title.split('·').map((t) => t.trim());
      const counts = v.sections
        .map((sec) => {
          const word = words[sec.name] ?? [sec.name, sec.name];
          return `${sec.items.length} ${word[sec.items.length === 1 ? 0 : 1]}`;
        })
        .join(' · ');
      out.push(
        this.add.text(
          x + 12,
          y + 8,
          name ?? v.title,
          on
            ? withShadow(
                { ...bodyText(16, '#FFFFFF'), fontStyle: '700' },
                PALETTE_CSS.woodOutline,
                2,
              )
            : { ...bodyText(16, PALETTE_CSS.text), fontStyle: '700' },
        ),
        this.add
          .text(
            x + rw - 12,
            y + 12,
            date ?? 'PRÓXIMA',
            labelText(8, on ? '#FFF2DC' : PALETTE_CSS.muted),
          )
          .setOrigin(1, 0),
        this.add.text(x + 12, y + 30, counts, bodyText(11, on ? '#FFF2DC' : PALETTE_CSS.textMuted)),
        addZone(this, x, y, rw, rowH, () => {
          this.selected = i;
          this.build();
        }),
      );
    });

    // A versão aberta.
    const ax = left + navW + 24;
    const aw = right - ax;
    drawFramedPanel(g, ax, top, aw, bottom - top);
    const v = VERSIONS[this.selected]!;
    const [name, date] = v.title.split('·').map((t) => t.trim());
    const tx = ax + 30;
    const textW = Math.min(760, aw - 60);
    const body: Phaser.GameObjects.GameObject[] = [];
    let y = top + 24;
    const title = this.add.text(
      tx,
      y,
      name ?? v.title,
      withShadow(impactText(28, '#FFFFFF'), PALETTE_CSS.outline, 3),
    );
    body.push(
      title,
      this.add.text(
        tx + title.width + 14,
        y + 12,
        date ?? 'PRÓXIMA',
        labelText(10, PALETTE_CSS.gold),
      ),
    );
    y += title.height + 12;
    const intro = v.intro.join(' ');
    if (intro) {
      const t = this.add.text(tx, y, intro, {
        ...bodyText(14, PALETTE_CSS.textSoft),
        wordWrap: { width: textW },
      });
      body.push(t);
      y += t.height + 14;
    }
    const lines = this.add.graphics();
    body.push(lines);
    for (const sec of v.sections) {
      const head = this.add.text(
        tx,
        y,
        sec.name.toUpperCase(),
        labelText(10, SECTION_COLORS[sec.name] ?? PALETTE_CSS.cyan),
      );
      body.push(head);
      lines.fillStyle(PALETTE.panel).fillRect(tx, y + head.height + 3, textW, 2);
      y += head.height + 12;
      for (const item of sec.items) {
        lines.fillStyle(PALETTE.wood).fillRect(tx, y + 7, 6, 6);
        const t = this.add.text(tx + 16, y, item, {
          ...bodyText(15, PALETTE_CSS.text),
          wordWrap: { width: textW - 16 },
        });
        body.push(t);
        y += t.height + 7;
      }
      y += 10;
    }
    this.scroll = addScrollArea(this, body, {
      x: ax + 8,
      y: top + 8,
      width: aw - 16,
      height: bottom - top - 16,
    });

    // Pé: versão, VOLTAR e as teclas.
    const fy = h - 32 - footH;
    const s = updates.state;
    out.push(
      this.add
        .text(
          left,
          fy + footH / 2,
          `VERSÃO ${s.currentVersion} · BUILD ${s.currentBuild}`,
          labelText(8, PALETTE_CSS.textMuted),
        )
        .setOrigin(0, 0.5),
      this.add
        .text(
          right,
          fy + footH / 2,
          '↑ ↓ TROCAM A VERSÃO · ESC VOLTA',
          labelText(8, PALETTE_CSS.textMuted),
        )
        .setOrigin(1, 0.5),
      addButton(this, {
        x: Math.floor(w / 2 - 140),
        y: fy,
        width: 280,
        height: footH,
        label: 'VOLTAR',
        fontSize: 20,
        variant: 'secondary',
        onClick: () => this.back(),
      }),
    );
    this.root = this.add.container(0, 0, out);
    this.scroll.isolate();
  }
}
