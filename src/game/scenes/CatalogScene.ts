import * as Phaser from 'phaser';
import type { AgentId } from '../../config';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { buyUnlock } from '../../core/meta/progress';
import { renderAchievements } from '../ui/achievementsView';
import { renderAgents } from '../ui/catalogViews';
import { drawGrid } from '../ui/icons';
import { impactText, withShadow } from '../ui/theme';
import { PALETTE_CSS } from '../render/palette';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import { music } from '../audio/music';

export type CatalogView = 'agents' | 'achievements';

const TITLES: Record<CatalogView, string> = {
  agents: 'ESCOLHA DO AGENTE',
  achievements: 'CONQUISTAS',
};

/** Telas abertas pelo hub com conteúdo de verdade: escolha do agente e Conquistas. */
export class CatalogScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private view: CatalogView = 'agents';
  private size = { w: 0, h: 0 };
  /** Lista das Conquistas, maior que a tela. */
  private scroll?: ScrollArea;

  constructor() {
    super(SCENES.catalog);
  }

  create(data: { view: CatalogView }): void {
    music.setMain('hub');
    this.view = data.view;
    // A cena é reaproveitada: a lista volta para o topo a cada vez que a tela abre.
    this.root = undefined;
    this.scroll = undefined;
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
            undefined,
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
        : renderAchievements(this, 0, 64, w, save);
    const bw = Math.min(w - 32, 220);
    // As duas listas passam da altura do celular: rolam com o dedo ou a roda do mouse.
    this.scroll = addScrollArea(this, body, { x: 0, y: 60, width: w, height: h - 132 }, offset);
    this.root = this.add.container(0, 0, [
      bg,
      title,
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
