import * as Phaser from 'phaser';
import { createTextures } from '../render/textures';
import { initSave, loadSave } from '../storage/saveStore';
import { SCENES } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    createTextures(this);
    void loadSave().then((save) => {
      initSave(this, save);
      this.scene.start(SCENES.menu);
    });
  }
}
