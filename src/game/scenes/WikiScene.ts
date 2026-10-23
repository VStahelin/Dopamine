import * as Phaser from 'phaser';
import wikiText from '../../../docs/wiki.md?raw';
import { parseWiki } from '../../core/wiki';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addButton } from '../ui/button';
import { drawGrid, drawInkBox } from '../ui/icons';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import { music } from '../audio/music';

export const WIKI = parseWiki(wikiText);

/** Toque que não virou arrasto da rolagem. */
const TAP_PX = 8;

/**
 * Wiki no Compêndio (fase 6, prancheta "Wiki no Compêndio"): o docs/wiki.md dentro do jogo. Sem
 * `page`, a lista das páginas; com `page`, os verbetes daquela página.
 */
export class WikiScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private scroll?: ScrollArea;
  private size = { w: 0, h: 0 };
  private page: number | null = null;

  constructor() {
    super(SCENES.wiki);
  }

  create(data: { page?: number }): void {
    music.setMain('hub');
    this.page = data.page ?? null;
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
    if (this.page === null) this.scene.start(SCENES.catalog, { view: 'compendium' });
    else this.scene.start(SCENES.wiki, {});
  }

  private build(): void {
    this.root?.destroy();
    const offset = this.scroll?.offset() ?? 0;
    this.scroll?.destroy();
    const { w, h } = this.size;
    const bg = this.add.graphics();
    drawGrid(bg, 0, 0, w, h);
    const width = Math.min(w - 24, 380);
    const left = Math.floor((w - width) / 2);
    const page = this.page === null ? undefined : WIKI[this.page];
    const body = page ? this.pageBody(page, left, width) : this.indexBody(left, width);
    this.scroll = addScrollArea(this, body, { x: 0, y: 60, width: w, height: h - 132 }, offset);
    const bw = Math.min(w - 32, 220);
    this.root = this.add.container(0, 0, [
      bg,
      this.add
        .text(
          w / 2,
          18,
          page ? page.title.toUpperCase() : 'WIKI',
          withShadow(impactText(page ? 20 : 24, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
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

  /** Lista das páginas; tocar abre a página. */
  private indexBody(left: number, width: number): Phaser.GameObjects.GameObject[] {
    const g = this.add.graphics();
    const out: Phaser.GameObjects.GameObject[] = [
      g,
      this.add
        .text(left + width / 2, 64, 'UMA PÁGINA POR ASSUNTO', labelText(8, PALETTE_CSS.textSoft))
        .setOrigin(0.5, 0),
    ];
    let y = 82;
    WIKI.forEach((p, i) => {
      const rowH = 38;
      drawInkBox(g, left, y, width, rowH, PALETTE.panel);
      const zone = this.add
        .zone(left + width / 2, y + rowH / 2, width, rowH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', (ptr: Phaser.Input.Pointer) => {
        if (ptr.getDistance() < TAP_PX) this.scene.start(SCENES.wiki, { page: i });
      });
      out.push(
        this.add.text(left + 12, y + 10, p.title, bodyText(14, PALETTE_CSS.text)),
        this.add
          .text(
            left + width - 12,
            y + 14,
            `${p.entries.length} VERBETES ›`,
            labelText(8, PALETTE_CSS.cyan),
          )
          .setOrigin(1, 0),
        zone,
      );
      y += rowH + 4;
    });
    return out;
  }

  /** Verbetes da página: título em ciano e o texto embaixo. */
  private pageBody(
    page: (typeof WIKI)[number],
    left: number,
    width: number,
  ): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    const wrap = { wordWrap: { width } };
    let y = 66;
    const add = (t: Phaser.GameObjects.Text, gap: number) => {
      out.push(t);
      y += t.height + gap;
    };
    if (page.note) {
      add(this.add.text(left, y, page.note, { ...bodyText(10, PALETTE_CSS.textSoft), ...wrap }), 8);
    }
    for (const line of page.intro) {
      add(this.add.text(left, y, line, { ...bodyText(11, PALETTE_CSS.text), ...wrap }), 6);
    }
    for (const e of page.entries) {
      y += 6;
      add(this.add.text(left, y, e.title.toUpperCase(), labelText(9, PALETTE_CSS.cyan)), 4);
      for (const line of e.lines) {
        add(this.add.text(left, y, line, { ...bodyText(11, PALETTE_CSS.text), ...wrap }), 4);
      }
    }
    return out;
  }
}
