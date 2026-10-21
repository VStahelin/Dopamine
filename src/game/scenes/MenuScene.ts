import * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { TEXTURES } from '../render/textures';
import { addButtonColumn } from '../ui/menuLayout';
import { impactText, labelText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

/** Tela de título: logo, Jogar, Recordes e Opções. */
export class MenuScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.input.keyboard?.on('keydown-ENTER', () => this.play());
    this.input.keyboard?.on('keydown-SPACE', () => this.play());

    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      // Logo (140) + 3 botões (140): o bloco todo fica centralizado na vertical.
      const logoTop = Math.max(16, Math.floor((h - 280) / 2) - 10);
      const cx = Math.floor(w / 2);

      // Faixa vermelha inclinada atrás de DOPAMINA, como na referência da aba Design.
      const band = this.add.graphics();
      band.fillStyle(PALETTE.outline).fillRect(-125, -21, 250, 42);
      band.fillStyle(PALETTE.interaction).fillRect(-122, -18, 244, 36);
      band.setPosition(cx, logoTop + 70).setRotation(-0.06);

      const agent = this.add.image(cx, logoTop + 20, TEXTURES.agent).setScale(2);
      const title = this.add
        .text(cx, logoTop + 70, 'DOPAMINA', impactText(34, PALETTE_CSS.logoOrange))
        .setOrigin(0.5)
        .setRotation(-0.06);
      const subtitle = this.add
        .text(cx, logoTop + 104, 'BLASTER', impactText(26, PALETTE_CSS.logoGreen))
        .setOrigin(0.5);

      const { buttons } = addButtonColumn(this, w, logoTop + 140, [
        { label: 'JOGAR', onClick: () => this.play() },
        { label: 'RECORDES', onClick: () => this.scene.start(SCENES.records) },
        { label: 'OPÇÕES', onClick: () => this.scene.start(SCENES.options) },
      ]);
      const version = this.add
        .text(cx, h - 16, 'V0.1 · PROTÓTIPO', labelText(8, PALETTE_CSS.cream))
        .setOrigin(0.5, 0);

      this.root = this.add.container(0, 0, [band, agent, title, subtitle, ...buttons, version]);
    });
  }

  private play(): void {
    this.scene.start(SCENES.run);
  }
}
