import * as Phaser from 'phaser';
import { PALETTE_CSS } from './game/render/palette';
import { BootScene } from './game/scenes/BootScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { HudScene } from './game/scenes/HudScene';
import { LevelUpScene } from './game/scenes/LevelUpScene';
import { MenuScene } from './game/scenes/MenuScene';
import { OptionsScene } from './game/scenes/OptionsScene';
import { PauseScene } from './game/scenes/PauseScene';
import { RecordsScene } from './game/scenes/RecordsScene';
import { RunScene } from './game/scenes/RunScene';
import { loadFonts } from './game/ui/theme';

await loadFonts();

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
  // A ordem define as camadas: cenas mais abaixo na lista são desenhadas por cima.
  scene: [
    BootScene,
    MenuScene,
    RecordsScene,
    OptionsScene,
    RunScene,
    HudScene,
    LevelUpScene,
    PauseScene,
    GameOverScene,
  ],
});
