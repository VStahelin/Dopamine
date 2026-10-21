import * as Phaser from 'phaser';
import { ZERO, type Vec2 } from '../../core/math/vec2';

/** Lê WASD e as setas e devolve a direção de movimento. */
export class KeyboardMove {
  private readonly keys: Record<
    'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd',
    Phaser.Input.Keyboard.Key
  > | null;

  constructor(scene: Phaser.Scene) {
    const { KeyCodes } = Phaser.Input.Keyboard;
    this.keys =
      (scene.input.keyboard?.addKeys({
        up: KeyCodes.UP,
        down: KeyCodes.DOWN,
        left: KeyCodes.LEFT,
        right: KeyCodes.RIGHT,
        w: KeyCodes.W,
        a: KeyCodes.A,
        s: KeyCodes.S,
        d: KeyCodes.D,
      }) as KeyboardMove['keys']) ?? null;
  }

  vector(): Vec2 {
    const k = this.keys;
    if (!k) return ZERO;
    const x = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const y = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    return { x, y };
  }
}
