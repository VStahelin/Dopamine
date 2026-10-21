import * as Phaser from 'phaser';
import { addButtonColumn } from '../ui/menuLayout';
import { impactText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

export class PauseScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    const run = () => this.scene.get(SCENES.run) as RunScene;
    this.input.keyboard?.on('keydown-ESC', () => run().togglePause());
    this.input.keyboard?.on('keydown-P', () => run().togglePause());

    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      const top = Math.floor(h / 2) - 70;
      const { buttons } = addButtonColumn(this, w, top + 44, [
        { label: 'CONTINUAR', onClick: () => run().togglePause() },
        { label: 'VOLTAR AO MENU', onClick: () => run().exitToMenu() },
      ]);
      this.root = this.add.container(0, 0, [
        addDim(this, w, h),
        this.add.text(w / 2, top, 'PAUSADO', impactText(24)).setOrigin(0.5, 0),
        ...buttons,
      ]);
    });
  }
}
