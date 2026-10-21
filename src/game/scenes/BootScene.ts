import * as Phaser from 'phaser';
import { createPlaceholderTextures } from '../render/textures';
import { SCENES } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    createPlaceholderTextures(this);
    this.scene.start(SCENES.run);
  }
}
