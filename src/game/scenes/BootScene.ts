import * as Phaser from 'phaser';
import { preloadSprites } from '../render/textures';
import { idleRunner } from '../idle/idleRunner';
import { music } from '../audio/music';
import { initSave, loadSave } from '../storage/saveStore';
import { setLoaderProgress, setLoaderStatus } from '../ui/loader';
import { SCENES } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    setLoaderStatus('CARREGANDO OS SPRITES...');
    this.load.on('progress', (p: number) => setLoaderProgress(p));
    preloadSprites(this);
  }

  create(): void {
    setLoaderStatus('ABRINDO O SAVE...');
    setLoaderProgress(null);
    void loadSave().then((save) => {
      initSave(this, save);
      music.start(this.game, save.options.musicVolume);
      idleRunner.start(this.game);
      this.scene.start(SCENES.title);
    });
  }
}
