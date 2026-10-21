import * as Phaser from 'phaser';
import { preloadSprites } from '../render/textures';
import { initSave, loadSave } from '../storage/saveStore';
import { SCENES } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    preloadSprites(this);
  }

  create(): void {
    void loadSave().then((save) => {
      initSave(this, save);
      this.scene.start(SCENES.title);
    });
  }
}
