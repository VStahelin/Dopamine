import * as Phaser from 'phaser';
import { AGENTS, DISPLAY, RUN, type AgentId } from '../../config';
import { DEFAULT_RULES } from '../../core/run/rules';
import { auraRadius, orbitPositions } from '../../core/run/weapons';
import { recordRun } from '../../core/save/saveData';
import { createRun, drainEvents, runResult, type RunState } from '../../core/run/state';
import { stepRun } from '../../core/run/step';
import { KeyboardMove } from '../input/keyboardMove';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { worldScale } from '../render/pixelScale';
import {
  AGENT_TEXTURES,
  ENEMY_TEXTURES,
  PROJECTILE_TEXTURES,
  TEXTURES,
  textureKey,
} from '../render/textures';
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

/** Efeito rápido desenhado a partir de um acontecimento do core (cone, feixe, golpe). */
interface Fx {
  draw: (g: Phaser.GameObjects.Graphics, alpha: number) => void;
  life: number;
  total: number;
}

/** Cor das auras de cada arma. */
const AURA_COLORS: Record<string, number> = {
  catalyst: 0xa335ee,
  insulinField: PALETTE.gold,
  enzyme: PALETTE.chlorine,
};

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
  private electronSprites: Phaser.GameObjects.Image[] = [];
  /** Auras, poças e anéis (embaixo dos inimigos). */
  private fieldGfx!: Phaser.GameObjects.Graphics;
  /** Cones, feixes e golpes (por cima). */
  private fxGfx!: Phaser.GameObjects.Graphics;
  private fx: Fx[] = [];
  /** Especial pedido pelo jogador, entregue ao core no próximo passo. */
  private specialQueued = false;
  private floaters: Floater[] = [];
  private keyboard!: KeyboardMove;
  /** Pixels de arte por unidade do mundo das texturas em uso (decisão 0009). */
  private detail = 1;
  private zoom = 1;

  constructor() {
    super(SCENES.run);
  }

  create(): void {
    const chosen = getSave(this).selectedAgent;
    const agentId = (chosen in AGENTS ? chosen : 'dopamine') as AgentId;
    this.run = createRun(Date.now() >>> 0, DEFAULT_RULES, agentId);
    this.specialQueued = false;
    this.electronSprites = [];
    this.fx = [];
    this.paused = false;
    this.accumulator = 0;
    this.levelUpOpen = false;
    this.overHandled = false;
    this.enemySprites = [];
    this.projectileSprites = [];
    this.gemSprites = [];
    this.floaters = [];

    this.detail = 0;
    this.ground = this.add.tileSprite(0, 0, 1, 1, '__DEFAULT').setOrigin(0).setDepth(-10);
    this.agentSprite = this.add.image(0, 0, '__DEFAULT').setDepth(10);
    this.fieldGfx = this.add.graphics().setDepth(1);
    this.fxGfx = this.add.graphics().setDepth(9);

    this.cameras.main.startFollow(this.agentSprite, true);
    this.applyZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this);

    this.keyboard = new KeyboardMove(this);
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    this.input.keyboard?.on('keydown-P', this.togglePause, this);
    this.input.keyboard?.on('keydown-SPACE', this.queueSpecial, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.pauseFromOutside, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.pauseFromOutside, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.pauseFromOutside, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.pauseFromOutside, this);
    });

    this.scene.launch(SCENES.hud);
    // Só em desenvolvimento: deixa a run acessível no console do navegador para testes.
    if (import.meta.env.DEV) Object.assign(globalThis, { dopamina: this });
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

  /** Pede o especial (tecla Espaço ou o botão da HUD). */
  queueSpecial(): void {
    if (!this.paused && !this.levelUpOpen) this.specialQueued = true;
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
    this.scene.start(SCENES.hub);
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
      stepRun(this.run, { ...input, special: this.specialQueued }, step);
      this.specialQueued = false;
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
      s.setTexture(this.tex(ENEMY_TEXTURES[e.kind]))
        .setScale(1 / this.detail)
        .setPosition(e.x, e.y)
        .setFlipX(e.x > agent.x);
      if (e.hitFlash > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else s.clearTint();
    });
    this.drawFields();
    const electrons = this.run.weapons.flatMap((w, i) =>
      this.run.rules.weapons[w.id].kind === 'orbit' ? orbitPositions(this.run, w, i) : [],
    );
    sync(this, this.electronSprites, electrons, 8, (s, e) => {
      s.setTexture(this.tex(TEXTURES.electron))
        .setScale(1 / this.detail)
        .setPosition(e.x, e.y);
    });
    sync(this, this.projectileSprites, this.run.projectiles, 8, (s, p) => {
      s.setTexture(this.tex(PROJECTILE_TEXTURES[p.weapon] ?? 'proj-hydroxyl'))
        .setScale((p.weapon === 'fenton' ? 1.3 : 1) / this.detail)
        .setPosition(p.x, p.y)
        .setRotation(Math.atan2(p.vy, p.vx));
    });
    sync(this, this.gemSprites, this.run.gems, 2, (s, g) => {
      s.setTexture(this.tex(TEXTURES.gem))
        .setScale(1 / this.detail)
        .setPosition(g.x, g.y);
    });

    for (const ev of drainEvents(this.run)) {
      const { agent: a } = this.run;
      if (ev.type === 'damage') {
        this.showFloater(ev.x, ev.y, String(Math.round(ev.amount)), ev.crit ? 'crit' : 'damage');
      }
      if (ev.type === 'dodge') this.showFloater(a.x, a.y - 12, 'ESQUIVA', 'info');
      if (ev.type === 'revive') {
        this.showFloater(a.x, a.y - 14, 'SEGUNDA DOSE!', 'info');
        this.cameras.main.flash(250, 57, 211, 240);
      }
      if (ev.type === 'hurt') this.cameras.main.shake(90, 0.006);
      if (ev.type === 'cone') this.addConeFx(ev);
      if (ev.type === 'beam') this.addBeamFx(ev);
      if (ev.type === 'strike') this.addStrikeFx(ev);
      if (ev.type === 'boss') {
        this.cameras.main.shake(400, 0.01);
        this.showFloater(a.x, a.y - 30, 'CHEFE!', 'crit');
      }
      if (ev.type === 'special') this.cameras.main.flash(200, 255, 179, 71);
    }
    this.updateFloaters(dt);
    this.drawFx(dt);
  }

  /** Auras, poças e anéis do pulso, embaixo dos inimigos. */
  private drawFields(): void {
    const g = this.fieldGfx.clear();
    const { agent } = this.run;
    this.run.weapons.forEach((w, i) => {
      if (this.run.rules.weapons[w.id].kind !== 'aura') return;
      const radius = auraRadius(this.run, i);
      const color = AURA_COLORS[w.id] ?? PALETTE.water;
      g.fillStyle(color, 0.12).fillCircle(agent.x, agent.y, radius);
      g.lineStyle(1.5, color, 0.6).strokeCircle(agent.x, agent.y, radius);
    });
    for (const z of this.run.zones) {
      const color = z.kind === 'emulsion' ? PALETTE.cream : PALETTE.chlorine;
      const a = Math.min(1, z.life * 2);
      g.fillStyle(color, 0.3 * a).fillEllipse(z.x, z.y, z.radius * 2, z.radius * 1.6);
      g.lineStyle(1.5, color, 0.7 * a).strokeEllipse(z.x, z.y, z.radius * 2, z.radius * 1.6);
    }
    for (const p of this.run.pulses) {
      const a = 1 - p.radius / p.maxRadius;
      g.lineStyle(3, 0xff6fb5, 0.8 * a + 0.2).strokeCircle(p.x, p.y, p.radius);
    }
  }

  private addFx(total: number, draw: Fx['draw']): void {
    this.fx.push({ draw, life: total, total });
  }

  private addConeFx(ev: { x: number; y: number; angle: number; range: number; spread: number }) {
    this.addFx(0.18, (g, a) => {
      g.fillStyle(PALETTE.chlorine, 0.45 * a);
      g.slice(ev.x, ev.y, ev.range, ev.angle - ev.spread / 2, ev.angle + ev.spread / 2, false);
      g.fillPath();
    });
  }

  private addBeamFx(ev: { x: number; y: number; angle: number; length: number; width: number }) {
    const x2 = ev.x + Math.cos(ev.angle) * ev.length;
    const y2 = ev.y + Math.sin(ev.angle) * ev.length;
    this.addFx(0.15, (g, a) => {
      g.lineStyle(ev.width, 0xb388ff, 0.8 * a).lineBetween(ev.x, ev.y, x2, y2);
      g.lineStyle(Math.max(1, ev.width / 3), 0xffffff, a).lineBetween(ev.x, ev.y, x2, y2);
    });
  }

  private addStrikeFx(ev: { x: number; y: number; radius: number }) {
    this.addFx(0.18, (g, a) => {
      g.lineStyle(2, PALETTE.woodHi, a).strokeCircle(ev.x, ev.y, ev.radius * (1.2 - a * 0.4));
      g.fillStyle(PALETTE.wood, 0.35 * a).fillCircle(ev.x, ev.y, ev.radius * 0.6);
    });
  }

  private drawFx(dt: number): void {
    const g = this.fxGfx.clear();
    for (const f of this.fx) {
      f.life -= dt;
      if (f.life > 0) f.draw(g, f.life / f.total);
    }
    this.fx = this.fx.filter((f) => f.life > 0);
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

  /** Texto que sobe e some: dano, crítico (dourado e maior) ou aviso. */
  private showFloater(x: number, y: number, label: string, kind: 'damage' | 'crit' | 'info'): void {
    let floater = this.floaters.find((f) => f.life <= 0);
    if (!floater) {
      if (this.floaters.length < DAMAGE_TEXT_POOL) {
        const text = this.add
          .text(0, 0, '', {
            ...impactText(8),
            stroke: PALETTE_CSS.interaction,
            resolution: this.zoom,
          })
          .setOrigin(0.5)
          .setDepth(20);
        floater = { text, life: 0 };
        this.floaters.push(floater);
      } else {
        floater = this.floaters.reduce((a, b) => (a.life < b.life ? a : b));
      }
    }
    const color =
      kind === 'crit'
        ? PALETTE_CSS.gold
        : kind === 'info'
          ? PALETTE_CSS.water
          : PALETTE_CSS.hydrogen;
    floater.life = 0.5;
    floater.text
      .setText(label)
      .setColor(color)
      .setScale(kind === 'crit' ? 1.4 : 1)
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

  private tex(name: string): string {
    return textureKey(name, this.detail);
  }

  /** Escala do mundo: zoom da câmera e texturas com o detalhe certo para a tela (decisão 0009). */
  private applyZoom(): void {
    const scale = worldScale(
      this.scale.width,
      this.scale.height,
      DISPLAY.minVisibleShortSidePx,
      DISPLAY.spriteDetails,
    );
    this.zoom = scale.zoom;
    this.cameras.main.setZoom(scale.zoom);
    for (const f of this.floaters) f.text.setResolution(scale.zoom);
    if (scale.detail === this.detail) return;
    this.detail = scale.detail;
    this.ground.setTexture(this.tex(TEXTURES.ground)).setTileScale(1 / this.detail);
    this.agentSprite
      .setTexture(this.tex(AGENT_TEXTURES[this.run.agentId]))
      .setScale(1 / this.detail);
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
    pool.push(scene.add.image(0, 0, '__DEFAULT').setDepth(depth));
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
