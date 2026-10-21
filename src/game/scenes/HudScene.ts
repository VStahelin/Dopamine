import * as Phaser from 'phaser';
import { DISPLAY } from '../../config';
import { VirtualJoystick } from '../input/virtualJoystick';
import { PALETTE_CSS } from '../render/palette';
import { SCENES } from './keys';

/** Camada de interface por cima da run, em pixels de tela (sem o zoom do mundo). */
export class HudScene extends Phaser.Scene {
  joystick?: VirtualJoystick;
  private fpsText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.joystick = new VirtualJoystick(this);

    if (DISPLAY.showFps) {
      this.fpsText = this.add.text(8, 8, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: PALETTE_CSS.hydrogen,
        stroke: PALETTE_CSS.outline,
        strokeThickness: 3,
      });
    }
  }

  override update(): void {
    this.fpsText?.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
  }
}
