import * as Phaser from 'phaser';
import { PALETTE_CSS } from '../render/palette';
import { LOGO_KEYS } from '../render/spriteFiles';
import { addButtonColumn } from '../ui/menuLayout';
import { labelText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { hideLoader } from '../ui/loader';
import { SCENES } from './keys';
import { music } from '../audio/music';

/** Tela de título: logo e um botão que leva ao hub. */
export class TitleScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    music.setMain('title');
    // O jogo abriu: some a tela de carregamento do index.html.
    hideLoader();
    this.input.keyboard?.on('keydown-ENTER', () => this.play());
    this.input.keyboard?.on('keydown-SPACE', () => this.play());

    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      // Logo em escala inteira (2× ou 3×, pela largura) + botão (40), centralizados na vertical.
      const logo = this.add.image(0, 0, LOGO_KEYS.stacked).setOrigin(0.5, 0);
      const logoScale = Math.max(1, Math.min(3, Math.floor((w - 24) / logo.width)));
      logo.setScale(logoScale);
      const logoH = logo.height * logoScale;
      const logoTop = Math.max(16, Math.floor((h - logoH - 56) / 2) - 10);
      const cx = Math.floor(w / 2);
      logo.setPosition(cx, logoTop);

      const { buttons } = addButtonColumn(this, w, logoTop + logoH + 16, [
        { label: 'COMEÇAR', onClick: () => this.play() },
      ]);
      const version = this.add
        .text(
          cx,
          h - 16,
          `V${__APP_VERSION__} · ${__BUILD_ID__.split('-')[0]}`,
          labelText(8, PALETTE_CSS.cream),
        )
        .setOrigin(0.5, 0);

      this.root = this.add.container(0, 0, [logo, ...buttons, version]);
    });
  }

  private play(): void {
    this.scene.start(SCENES.hub);
  }
}
