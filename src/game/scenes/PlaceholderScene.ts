import * as Phaser from 'phaser';
import { addButton } from '../ui/button';
import { drawGrid } from '../ui/icons';
import type { SectionDef } from '../ui/menuContent';
import { renderSection } from '../ui/sectionView';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

/** Tela aberta pelo hub que ainda não tem conteúdo: formato comum de placeholder + Voltar. */
export class PlaceholderScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.placeholder);
  }

  create(data: { def: SectionDef }): void {
    const back = () => this.scene.start(SCENES.hub);
    this.input.keyboard?.on('keydown-ESC', back);
    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      const bg = this.add.graphics();
      drawGrid(bg, 0, 0, w, h);
      this.root = this.add.container(0, 0, [
        bg,
        ...renderSection(this, 0, 0, w, h - 70, data.def),
        addButton(this, {
          x: Math.floor((w - Math.min(w - 32, 220)) / 2),
          y: h - 62,
          width: Math.min(w - 32, 220),
          height: 48,
          label: 'VOLTAR',
          variant: 'secondary',
          onClick: back,
        }),
      ]);
    });
  }
}
