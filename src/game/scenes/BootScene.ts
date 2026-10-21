import * as Phaser from 'phaser';
import { preloadSprites } from '../render/textures';
import { idleRunner } from '../idle/idleRunner';
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
      idleRunner.start(this.game);
      this.scene.start(SCENES.title);
    });
  }
}
