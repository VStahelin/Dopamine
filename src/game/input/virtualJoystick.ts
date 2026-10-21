import type * as Phaser from 'phaser';
import { ZERO, clampLength, type Vec2 } from '../../core/math/vec2';
import { UI_SPRITES } from '../../assets/sprites';
import { PALETTE } from '../render/palette';
import { pointerToUi } from '../ui/uiLayout';

/**
 * Joystick virtual que aparece onde o dedo toca (aba Plataforma, Controles).
 * Só responde a toque; no PC o movimento é pelo teclado. Vive numa cena de interface e usa as
 * coordenadas lógicas dela.
 */
export class VirtualJoystick {
  private pointerId: number | null = null;
  private originX = 0;
  private originY = 0;
  private current: Vec2 = ZERO;
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
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

  private onDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    // Toques em botões (como o de pausa) não abrem o joystick.
    if (!pointer.wasTouch || this.pointerId !== null || over.length > 0) return;
    const p = pointerToUi(this.scene, pointer);
    this.pointerId = pointer.id;
    this.originX = p.x;
    this.originY = p.y;
    this.current = ZERO;
    this.draw();
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    const p = pointerToUi(this.scene, pointer);
    this.current = clampLength(
      { x: (p.x - this.originX) / this.radius, y: (p.y - this.originY) / this.radius },
      1,
    );
    this.draw();
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.current = ZERO;
    this.graphics.clear();
  }

  /** Joystick da prancheta: octógono em degraus translúcido e miolo quadrado creme. */
  private draw(): void {
    const g = this.graphics.clear();
    const size = this.radius * 2;
    const octagon = UI_SPRITES.shapes.octagon.map(([px = 0, py = 0]) => ({
      x: this.originX - this.radius + px * size,
      y: this.originY - this.radius + py * size,
    }));
    // fillPoints e strokePoints só leem x e y de cada ponto.
    const points = octagon as unknown as Phaser.Math.Vector2[];
    g.fillStyle(PALETTE.night, 0.25).fillPoints(points, true);
    g.lineStyle(3, PALETTE.textLight, 0.45).strokePoints(points, true);
    const knob = 36;
    const kx = Math.round(this.originX + this.current.x * this.radius - knob / 2);
    const ky = Math.round(this.originY + this.current.y * this.radius - knob / 2);
    g.fillStyle(PALETTE.ink, 0.5).fillRect(kx, ky, knob, knob);
    g.fillStyle(PALETTE.textLight, 0.6).fillRect(kx + 3, ky + 3, knob - 6, knob - 6);
  }
}
