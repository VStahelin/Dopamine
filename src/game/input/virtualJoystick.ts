import type * as Phaser from 'phaser';
import { ZERO, clampLength, type Vec2 } from '../../core/math/vec2';
import { PALETTE } from '../render/palette';

/**
 * Joystick virtual que aparece onde o dedo toca (aba Plataforma, Controles).
 * Só responde a toque; no PC o movimento é pelo teclado.
 */
export class VirtualJoystick {
  private pointerId: number | null = null;
  private originX = 0;
  private originY = 0;
  private current: Vec2 = ZERO;
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    private readonly radius = 48,
  ) {
    this.graphics = scene.add.graphics().setDepth(1000);
    scene.input.addPointer(1);
    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  get active(): boolean {
    return this.pointerId !== null;
  }

  /** Direção com comprimento de 0 a 1. */
  get vector(): Vec2 {
    return this.current;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch || this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.originX = pointer.x;
    this.originY = pointer.y;
    this.current = ZERO;
    this.draw();
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    const offset = {
      x: (pointer.x - this.originX) / this.radius,
      y: (pointer.y - this.originY) / this.radius,
    };
    this.current = clampLength(offset, 1);
    this.draw();
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.current = ZERO;
    this.graphics.clear();
  }

  private draw(): void {
    const g = this.graphics.clear();
    g.fillStyle(PALETTE.panel, 0.5).fillCircle(this.originX, this.originY, this.radius);
    g.lineStyle(3, PALETTE.wood, 0.8).strokeCircle(this.originX, this.originY, this.radius);
    g.fillStyle(PALETTE.water, 0.9).fillCircle(
      this.originX + this.current.x * this.radius,
      this.originY + this.current.y * this.radius,
      this.radius * 0.4,
    );
  }
}
