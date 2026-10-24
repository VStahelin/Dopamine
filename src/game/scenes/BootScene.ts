import * as Phaser from 'phaser';
import { preloadSprites } from '../render/textures';
import { idleRunner } from '../idle/idleRunner';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { adminRequestedByUrl, enableAdmin } from '../admin/admin';
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
    void loadSave().then(async (save) => {
      initSave(this, save);
      // `?admin=1` liga o modo admin, guardando antes a cópia do save (decisão 0039).
      if (adminRequestedByUrl()) await enableAdmin(this);
      music.start(this.game, save.options.sound);
      sfx.start(this.game, save.options.sound);
      idleRunner.start(this.game);
      this.scene.start(SCENES.title);
    });
  }
}
