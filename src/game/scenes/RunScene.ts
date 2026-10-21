import * as Phaser from 'phaser';
import { DISPLAY, RUN } from '../../config';
import { recordRun } from '../../core/save/saveData';
import { createRun, drainEvents, runResult, type RunState } from '../../core/run/state';
import { stepRun } from '../../core/run/step';
import { KeyboardMove } from '../input/keyboardMove';
import { PALETTE_CSS } from '../render/palette';
import { integerZoom } from '../render/pixelScale';
import { ENEMY_TEXTURES, TEXTURES } from '../render/textures';
import { getSave, setSave } from '../storage/saveStore';
import { impactText } from '../ui/theme';
import type { HudScene } from './HudScene';
import { SCENES } from './keys';

/** Passos de simulação no máximo por quadro, para não travar depois de uma pausa longa. */
const MAX_STEPS_PER_FRAME = 8;
const DAMAGE_TEXT_POOL = 40;

interface Floater {
  text: Phaser.GameObjects.Text;
  life: number;
}

/**
 * Campo crônico: roda a simulação do core em passos fixos (decisão 0012) e desenha o estado.
 * Não guarda regra de jogo.
 */
export class RunScene extends Phaser.Scene {
  run!: RunState;
  private paused = false;
  private accumulator = 0;
  private levelUpOpen = false;
  private overHandled = false;
  private ground!: Phaser.GameObjects.TileSprite;
  private agentSprite!: Phaser.GameObjects.Image;
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private projectileSprites: Phaser.GameObjects.Image[] = [];
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private floaters: Floater[] = [];
  private keyboard!: KeyboardMove;

  constructor() {
    super(SCENES.run);
  }

  create(): void {
    this.run = createRun(Date.now() >>> 0);
    this.paused = false;
    this.accumulator = 0;
    this.levelUpOpen = false;
    this.overHandled = false;
    this.enemySprites = [];
    this.projectileSprites = [];
    this.gemSprites = [];
    this.floaters = [];

    this.ground = this.add.tileSprite(0, 0, 1, 1, TEXTURES.ground).setOrigin(0).setDepth(-10);
    this.agentSprite = this.add.image(0, 0, TEXTURES.agent).setDepth(10);

    this.cameras.main.startFollow(this.agentSprite, true);
    this.applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this);

    this.keyboard = new KeyboardMove(this);
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    this.input.keyboard?.on('keydown-P', this.togglePause, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.pauseFromOutside, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.pauseFromOutside, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.pauseFromOutside, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.pauseFromOutside, this);
    });

    this.scene.launch(SCENES.hud);
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.paused) this.simulate(deltaMs);
    this.draw(deltaMs / 1000);
    this.checkTransitions();
  }

  /** Abre ou fecha a pausa (tecla Esc, P ou o botão da HUD). */
  togglePause(): void {
    if (this.run.over || this.levelUpOpen) return;
    this.paused = !this.paused;
    if (this.paused) this.scene.launch(SCENES.pause);
    else this.scene.stop(SCENES.pause);
  }

  private pauseFromOutside(): void {
    if (!this.paused) this.togglePause();
  }

  /** Recomeça uma run nova, do zero. */
  restartRun(): void {
    this.stopOverlays();
    this.scene.restart();
  }

  exitToMenu(): void {
    this.stopOverlays();
    this.scene.start(SCENES.menu);
  }

  private stopOverlays(): void {
    for (const key of [SCENES.hud, SCENES.levelUp, SCENES.pause, SCENES.gameOver]) {
      this.scene.stop(key);
    }
  }

  private simulate(deltaMs: number): void {
    const step = 1 / RUN.ticksPerSecond;
    this.accumulator += Math.min(deltaMs / 1000, 0.25);
    const hud = this.scene.get(SCENES.hud) as HudScene;
    const joystick = hud.joystick;
    const input = {
      move: joystick?.active ? joystick.vector : this.keyboard.vector(),
      viewRadius: this.viewRadius(),
    };
    for (let n = 0; this.accumulator >= step && n < MAX_STEPS_PER_FRAME; n++) {
      stepRun(this.run, input, step);
      this.accumulator -= step;
      if (this.run.over || this.run.pendingLevelUps > 0) {
        this.accumulator = 0;
        break;
      }
    }
  }

  private viewRadius(): number {
    const cam = this.cameras.main;
    return Math.hypot(cam.width / cam.zoom, cam.height / cam.zoom) / 2;
  }

  private draw(dt: number): void {
    const { agent } = this.run;
    const blink = agent.invulnerableFor > 0 && Math.floor(this.run.time * 20) % 2 === 0;
    this.agentSprite
      .setPosition(agent.x, agent.y)
      .setFlipX(agent.facingX < 0)
      .setAlpha(blink ? 0.4 : 1);

    this.drawGround();

    sync(this, this.enemySprites, this.run.enemies, 5, (s, e) => {
      s.setTexture(ENEMY_TEXTURES[e.kind])
        .setPosition(e.x, e.y)
        .setFlipX(e.x > agent.x);
      if (e.hitFlash > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else s.clearTint();
    });
    sync(this, this.projectileSprites, this.run.projectiles, 8, (s, p) => {
      s.setTexture(TEXTURES.projectile).setPosition(p.x, p.y).setRotation(Math.atan2(p.vy, p.vx));
    });
    sync(this, this.gemSprites, this.run.gems, 2, (s, g) => {
      s.setTexture(TEXTURES.gem).setPosition(g.x, g.y);
    });

    for (const ev of drainEvents(this.run)) {
      if (ev.type === 'damage') this.showDamage(ev.x, ev.y, ev.amount);
      if (ev.type === 'hurt') this.cameras.main.shake(90, 0.006);
    }
    this.updateFloaters(dt);
  }

  /** O chão cobre só a área visível, alinhado à grade, e acompanha a câmera. */
  private drawGround(): void {
    const cam = this.cameras.main;
    const tile = DISPLAY.tileSizePx;
    const w = cam.width / cam.zoom;
    const h = cam.height / cam.zoom;
    const x0 = Math.floor((this.run.agent.x - w / 2) / tile) * tile - tile;
    const y0 = Math.floor((this.run.agent.y - h / 2) / tile) * tile - tile;
    this.ground.setPosition(x0, y0).setSize(w + tile * 3, h + tile * 3);
  }

  private showDamage(x: number, y: number, amount: number): void {
    let floater = this.floaters.find((f) => f.life <= 0);
    if (!floater) {
      if (this.floaters.length < DAMAGE_TEXT_POOL) {
        const text = this.add
          .text(0, 0, '', { ...impactText(8), stroke: PALETTE_CSS.interaction })
          .setOrigin(0.5)
          .setDepth(20);
        floater = { text, life: 0 };
        this.floaters.push(floater);
      } else {
        floater = this.floaters.reduce((a, b) => (a.life < b.life ? a : b));
      }
    }
    floater.life = 0.5;
    floater.text
      .setText(String(Math.round(amount)))
      .setPosition(x + Phaser.Math.Between(-4, 4), y - 6)
      .setVisible(true)
      .setAlpha(1);
  }

  private updateFloaters(dt: number): void {
    for (const f of this.floaters) {
      if (f.life <= 0) continue;
      f.life -= dt;
      f.text.y -= 20 * dt;
      f.text.setAlpha(Math.max(0, f.life / 0.5));
      if (f.life <= 0) f.text.setVisible(false);
    }
  }

  private checkTransitions(): void {
    if (this.run.pendingLevelUps > 0 && !this.levelUpOpen && !this.run.over) {
      this.levelUpOpen = true;
      this.scene.launch(SCENES.levelUp, {
        run: this.run,
        onDone: () => {
          this.levelUpOpen = false;
        },
      });
    }

    if (this.run.over && !this.overHandled) {
      this.overHandled = true;
      const result = runResult(this.run);
      const { save, newRecords } = recordRun(getSave(this), result);
      setSave(this, save);
      this.time.delayedCall(700, () => this.scene.launch(SCENES.gameOver, { result, newRecords }));
    }
  }

  private applyZoom(): void {
    this.cameras.main.setZoom(
      integerZoom(this.scale.width, this.scale.height, DISPLAY.minVisibleShortSidePx),
    );
  }
}

/** Reaproveita sprites: um por item, o resto fica escondido. */
function sync<T>(
  scene: Phaser.Scene,
  pool: Phaser.GameObjects.Image[],
  items: readonly T[],
  depth: number,
  apply: (sprite: Phaser.GameObjects.Image, item: T) => void,
): void {
  while (pool.length < items.length) {
    pool.push(scene.add.image(0, 0, TEXTURES.gem).setDepth(depth));
  }
  for (let i = 0; i < pool.length; i++) {
    const sprite = pool[i]!;
    const item = items[i];
    if (item === undefined) {
      sprite.setVisible(false);
      continue;
    }
    sprite.setVisible(true);
    apply(sprite, item);
  }
}
