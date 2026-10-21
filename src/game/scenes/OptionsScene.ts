import * as Phaser from 'phaser';
import { getSave, setSave } from '../storage/saveStore';
import { addButtonColumn } from '../ui/menuLayout';
import { impactText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

const yesNo = (value: boolean) => (value ? 'SIM' : 'NÃO');

/** Opções: mostrar FPS (salvo) e tela cheia. Volume entra quando o jogo tiver som. */
export class OptionsScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };

  constructor() {
    super(SCENES.options);
  }

  create(): void {
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.hub));
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.build, this);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.build, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.build, this);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.build, this);
    });
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const save = getSave(this);
    const top = Math.max(16, Math.floor(h / 2) - 110);

    const { buttons } = addButtonColumn(this, w, top + 44, [
      {
        label: `MOSTRAR FPS: ${yesNo(save.options.showFps)}`,
        variant: 'secondary',
        onClick: () => {
          setSave(this, { ...save, options: { ...save.options, showFps: !save.options.showFps } });
          this.build();
        },
      },
      {
        label: `TELA CHEIA: ${yesNo(this.scale.isFullscreen)}`,
        variant: 'secondary',
        onClick: () => this.scale.toggleFullscreen(),
      },
      { label: 'VOLTAR', onClick: () => this.scene.start(SCENES.hub) },
    ]);
    this.root = this.add.container(0, 0, [
      this.add.text(w / 2, top, 'OPÇÕES', impactText(24)).setOrigin(0.5, 0),
      ...buttons,
    ]);
  }
}
