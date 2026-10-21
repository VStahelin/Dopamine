import * as Phaser from 'phaser';
import { PALETTE_CSS } from './game/render/palette';
import { BootScene } from './game/scenes/BootScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { HudScene } from './game/scenes/HudScene';
import { LevelUpScene } from './game/scenes/LevelUpScene';
import { CatalogScene } from './game/scenes/CatalogScene';
import { HubScene } from './game/scenes/HubScene';
import { PlaceholderScene } from './game/scenes/PlaceholderScene';
import { TitleScene } from './game/scenes/TitleScene';
import { OptionsScene } from './game/scenes/OptionsScene';
import { PauseScene } from './game/scenes/PauseScene';
import { RecordsScene } from './game/scenes/RecordsScene';
import { RunScene } from './game/scenes/RunScene';
import './game/ui/textFix';
import { loadFonts } from './game/ui/theme';

await loadFonts();

/**
 * O canvas tem a resolução real da tela (decisão 0009): numa tela 3×, um canvas de 390 px de
 * largura em CSS tem 1170 px de verdade. Sem isso o navegador estica a imagem e tudo fica
 * em baixa resolução, inclusive os textos.
 */
function screenSize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 4);
  return {
    width: Math.round(window.innerWidth * ratio),
    height: Math.round(window.innerHeight * ratio),
  };
}

const initial = screenSize();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: PALETTE_CSS.night,
  pixelArt: true,
  scale: {
    // FIT encaixa o canvas de alta resolução no tamanho CSS da página e ajusta o toque.
    mode: Phaser.Scale.FIT,
    width: initial.width,
    height: initial.height,
  },
  input: {
    activePointers: 2,
  },
  // A ordem define as camadas: cenas mais abaixo na lista são desenhadas por cima.
  scene: [
    BootScene,
    TitleScene,
    HubScene,
    PlaceholderScene,
    CatalogScene,
    RecordsScene,
    OptionsScene,
    RunScene,
    HudScene,
    LevelUpScene,
    PauseScene,
    GameOverScene,
  ],
});

const onResize = () => {
  const { width, height } = screenSize();
  if (width !== game.scale.width || height !== game.scale.height)
    game.scale.setGameSize(width, height);
};
window.addEventListener('resize', onResize);
window.visualViewport?.addEventListener('resize', onResize);
