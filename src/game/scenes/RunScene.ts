import * as Phaser from 'phaser';
import { DISPLAY, RUN } from '../../config';
import { createAgent, moveAgent, type AgentState } from '../../core/run/agent';
import { KeyboardMove } from '../input/keyboardMove';
import { integerZoom } from '../render/pixelScale';
import { TEXTURES } from '../render/textures';
import type { HudScene } from './HudScene';
import { SCENES } from './keys';

/** Campo crônico. Na fase 0 é só o mapa e o agente andando. */
export class RunScene extends Phaser.Scene {
  private agent!: AgentState;
  private agentSprite!: Phaser.GameObjects.Image;
  private keyboard!: KeyboardMove;
  private hud!: HudScene;

  constructor() {
    super(SCENES.run);
  }

  create(): void {
    const { widthPx: arenaWidth, heightPx: arenaHeight } = RUN.arena;

    this.add.tileSprite(0, 0, arenaWidth, arenaHeight, TEXTURES.ground).setOrigin(0);

    this.agent = createAgent({ x: arenaWidth / 2, y: arenaHeight / 2 });
    this.agentSprite = this.add.image(this.agent.position.x, this.agent.position.y, TEXTURES.agent);

    this.cameras.main.setBounds(0, 0, arenaWidth, arenaHeight).startFollow(this.agentSprite, true);
    this.applyZoom(this.scale.width, this.scale.height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });

    this.keyboard = new KeyboardMove(this);
    this.scene.launch(SCENES.hud);
    this.hud = this.scene.get(SCENES.hud) as HudScene;
  }

  override update(_time: number, deltaMs: number): void {
    const joystick = this.hud.joystick;
    const intent = joystick?.active ? joystick.vector : this.keyboard.vector();
    this.agent = moveAgent(this.agent, intent, deltaMs / 1000, RUN.agent.moveSpeedPxPerSecond, {
      width: RUN.arena.widthPx,
      height: RUN.arena.heightPx,
    });
    this.agentSprite.setPosition(this.agent.position.x, this.agent.position.y);
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.applyZoom(gameSize.width, gameSize.height);
  }

  private applyZoom(width: number, height: number): void {
    this.cameras.main.setZoom(integerZoom(width, height, DISPLAY.minVisibleShortSidePx));
  }
}
