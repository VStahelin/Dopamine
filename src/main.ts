import * as Phaser from 'phaser';
import { PALETTE_CSS } from './game/render/palette';
import { BootScene } from './game/scenes/BootScene';
import { HudScene } from './game/scenes/HudScene';
import { RunScene } from './game/scenes/RunScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: PALETTE_CSS.night,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    activePointers: 2,
  },
  // A ordem define as camadas: a HUD é desenhada por cima da run.
  scene: [BootScene, RunScene, HudScene],
});
