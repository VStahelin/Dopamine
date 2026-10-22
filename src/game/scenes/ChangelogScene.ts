import * as Phaser from 'phaser';
import changelogText from '../../../CHANGELOG.md?raw';
import { parseChangelog } from '../../core/changelog';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addButton } from '../ui/button';
import { drawGrid, drawInkBox } from '../ui/icons';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

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

  constructor() {
    super(SCENES.changelog);
  }

  create(): void {
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    setupUiLayout(
      this,
      (w, h) => {
        this.size = { w, h };
        this.build();
      },
      { width: 390, height: 700 },
    );
  }

  private back(): void {
    this.scene.start(SCENES.options);
  }

  private build(): void {
    this.root?.destroy();
    const offset = this.scroll?.offset() ?? 0;
    this.scroll?.destroy();
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
}
