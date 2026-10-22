import * as Phaser from 'phaser';
import type { AgentId } from '../../config';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { buyUnlock } from '../../core/meta/progress';
import { renderAgents, renderCompendium } from '../ui/catalogViews';
import { drawGrid } from '../ui/icons';
import { impactText, withShadow } from '../ui/theme';
import { PALETTE_CSS } from '../render/palette';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

export type CatalogView = 'agents' | 'compendium';

const TITLES: Record<CatalogView, string> = {
  agents: 'ESCOLHA DO AGENTE',
  compendium: 'COMPÊNDIO',
};

/** Telas abertas pelo hub com conteúdo de verdade: escolha do agente e Compêndio. */
export class CatalogScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private view: CatalogView = 'agents';
  private size = { w: 0, h: 0 };
  /** Lista do Compêndio, maior que a tela. */
  private scroll?: ScrollArea;

  constructor() {
    super(SCENES.catalog);
  }

  create(data: { view: CatalogView }): void {
    this.view = data.view;
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
    this.scene.start(SCENES.hub);
  }

  private build(): void {
    this.root?.destroy();
    const offset = this.scroll?.offset() ?? 0;
    this.scroll?.destroy();
    this.scroll = undefined;
    const { w, h } = this.size;
    const bg = this.add.graphics();
    drawGrid(bg, 0, 0, w, h);
    const save = getSave(this);
    const title = this.add
      .text(
        w / 2,
        18,
        TITLES[this.view],
        withShadow(impactText(24, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
      )
      .setOrigin(0.5, 0);
    const body =
      this.view === 'agents'
        ? renderAgents(
            this,
            0,
            64,
            w,
            save.selectedAgent,
            (id: AgentId) => {
              setSave(this, { ...getSave(this), selectedAgent: id });
              this.back();
            },
            false,
            {
              progress: save.meta,
              atp: save.atp,
              onBuy: (kind, id) => {
                const now = getSave(this);
                const bought = buyUnlock(now.meta, now.atp, kind, id);
                if (!bought) return;
                setSave(this, { ...now, meta: bought.progress, atp: bought.atp });
                this.build();
              },
            },
          )
        : renderCompendium(
            this,
            0,
            64,
            w,
            save.seen,
            save.seenItems,
            save.seenSupplements,
            save.seenAggregates,
          );
    const bw = Math.min(w - 32, 220);
    if (this.view === 'compendium') {
      this.scroll = addScrollArea(this, body, { x: 0, y: 60, width: w, height: h - 132 }, offset);
    }
    this.root = this.add.container(0, 0, [
      bg,
      title,
      ...(this.view === 'compendium' ? [] : body),
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
    this.scroll?.isolate();
  }
}
