import * as Phaser from 'phaser';
import {
  AGENTS,
  DISPLAY,
  DROPS,
  RUN,
  SECTORS,
  type MoleculeType,
  type StructureKind,
} from '../../config';
import { addRunStars, playableAgent, rulesWithProgress } from '../../core/meta/progress';
import { applyHealth, earn, rulesWithOrganism, runHealth } from '../../core/organism/organism';
import { DEFAULT_RULES } from '../../core/run/rules';
import { auraRadius, orbitPositions } from '../../core/run/weapons';
import { recordRun } from '../../core/save/saveData';
import { createRun, drainEvents, runResult, type RunState } from '../../core/run/state';
import { stepRun } from '../../core/run/step';
import { KeyboardMove } from '../input/keyboardMove';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { pixelBand, pixelDisc, pixelOctagonAt, pixelRing, pixelSector } from '../render/fxArt';
import { worldScale } from '../render/pixelScale';
import {
  AGENT_TEXTURES,
  ENEMY_TEXTURES,
  PROJECTILE_TEXTURES,
  TEXTURES,
  iconKey,
  iconTexture,
  loadIconsForZoom,
  textureKey,
} from '../render/textures';
import { getSave, setSave } from '../storage/saveStore';
import { updates } from '../update/updateManager';
import { HIT_KINDS, hitKind, hitLabel, NUMBER_STYLES, type NumberKind } from '../ui/damageNumbers';
import type { GameOverData } from './GameOverScene';
import type { HudScene } from './HudScene';
import { SCENES } from './keys';

/** Passos de simulação no máximo por quadro, para não travar depois de uma pausa longa. */
const MAX_STEPS_PER_FRAME = 8;
const DAMAGE_TEXT_POOL = 40;
/** Golpes contínuos e recuperação são somados e mostrados a cada meio segundo. */
const SUM_EVERY_SECONDS = 0.5;
/** Barra de interações embaixo do agente, em unidades do mundo. */
const LIFE_BAR_WIDTH = 40;
const LIFE_PIPS = 10;
/** Os números sobem e somem em cerca de 0,6 s. */
const FLOATER_SECONDS = 0.6;

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
/** Cores de cada estrutura (prancheta "Estruturas"): rosa, violeta, vermelho, vinho e laranja. */
const STRUCTURE_COLORS: Record<StructureKind, { main: number; dark: number }> = {
  synapse: { main: 0xff6fa8, dark: 0xb03a70 },
  synapseLTP: { main: 0xb072f0, dark: 0x6a3ab0 },
  focus: { main: 0xe0433a, dark: 0x8e1616 },
  clot: { main: 0x8e1616, dark: 0x3a0a0c },
  adrenal: { main: 0xff9a1f, dark: 0xb5541c },
};
const STRUCTURE_SIZE = 18;
const ARROW_SIZE = 18;

/**
 * Arco em pixels de arte: do ângulo `from` ao `to` (frações da volta, a partir do topo, no
 * sentido do relógio), com espessura `thick`; `color` pode variar pelo ângulo (tracejado).
 */
function pixelArc(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  from: number,
  to: number,
  thick: number,
  px: number,
  color: (a: number) => number,
): void {
  const steps = Math.ceil(2 * Math.PI * r);
  for (let i = Math.floor(from * steps); i < to * steps; i++) {
    const a = i / steps;
    const t = a * Math.PI * 2 - Math.PI / 2;
    g.fillStyle(color(a), 1);
    g.fillRect(
      Math.round((x + Math.cos(t) * r) / px) * px - thick / 2,
      Math.round((y + Math.sin(t) * r) / px) * px - thick / 2,
      thick,
      thick,
    );
  }
}

/** Cor do tingimento do mapa na crise, pela família da molécula. */
const CRISIS_TINT: Partial<Record<MoleculeType, number>> = {
  sugar: 0xffffff,
  lipid: PALETTE.sulfur,
  stress: PALETTE.uv,
  radical: PALETTE.oxygen,
  toxin: PALETTE.chlorine,
  inflammation: PALETTE.interaction,
};

/** Tamanho dos itens no chão, em unidades do mundo (o desenho ocupa só o miolo do ícone). */
const GEM_SIZE = 18;
const ITEM_SIZE = 16;
const VESICLE_SIZE = 20;
const CAPSULE_SIZE = 22;

export class RunScene extends Phaser.Scene {
  run!: RunState;
  private paused = false;
  private accumulator = 0;
  private levelUpOpen = false;
  /** Avisos de formação: seta piscando na borda do lado de onde ela vem (fase 5.6). */
  private warnings: { angle: number; life: number; crisis: boolean }[] = [];
  /** Tela da cápsula ou da ampola aberta por cima da run. */
  private overlayOpen = false;
  private overHandled = false;
  private gaveUp = false;
  private ground!: Phaser.GameObjects.TileSprite;
  private agentSprite!: Phaser.GameObjects.Image;
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private projectileSprites: Phaser.GameObjects.Image[] = [];
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private coinSprites: Phaser.GameObjects.Image[] = [];
  private vesicleSprites: Phaser.GameObjects.Image[] = [];
  private pickupSprites: Phaser.GameObjects.Image[] = [];
  private structureSprites: Phaser.GameObjects.Image[] = [];
  private arrowSprites: Phaser.GameObjects.Image[] = [];
  /** Opção "números de dano", relida ao voltar da pausa. */
  private showNumbers = true;
  private electronSprites: Phaser.GameObjects.Image[] = [];
  /** Auras, poças e anéis (embaixo dos inimigos). */
  private fieldGfx!: Phaser.GameObjects.Graphics;
  /** Cones, feixes e golpes (por cima). */
  private fxGfx!: Phaser.GameObjects.Graphics;
  private fx: Fx[] = [];
  /** Especial pedido pelo jogador, entregue ao core no próximo passo. */
  private specialQueued = false;
  private floaters: Floater[] = [];
  /** Dano contínuo somado por região do campo, e recuperação somada. */
  private areaSums = new Map<string, { x: number; y: number; amount: number }>();
  private healSum = 0;
  private sumTimer = 0;
  private lifeGfx!: Phaser.GameObjects.Graphics;
  private keyboard!: KeyboardMove;
  /** Pixels de arte por unidade do mundo das texturas em uso (decisão 0009). */
  private detail = 1;
  private zoom = 1;

  constructor() {
    super(SCENES.run);
  }

  create(): void {
    // Meta-progressão: Laboratório somado aos atributos, só armas liberadas e agente liberado.
    const save = getSave(this);
    const agentId = playableAgent(
      save.meta,
      save.selectedAgent in AGENTS ? save.selectedAgent : 'dopamine',
    );
    // Organismo: setores mudam atributos, a doença puxa as moléculas e o indivíduo dá a dificuldade.
    const rules = {
      ...rulesWithOrganism(rulesWithProgress(DEFAULT_RULES, save.meta), save.organism),
      capsulesOpened: save.capsulesOpened,
    };
    this.run = createRun(Date.now() >>> 0, rules, agentId);
    this.specialQueued = false;
    this.electronSprites = [];
    this.fx = [];
    this.paused = false;
    this.accumulator = 0;
    this.levelUpOpen = false;
    this.overlayOpen = false;
    this.warnings = [];
    this.overHandled = false;
    this.gaveUp = false;
    this.enemySprites = [];
    this.projectileSprites = [];
    this.gemSprites = [];
    this.coinSprites = [];
    this.vesicleSprites = [];
    this.pickupSprites = [];
    this.structureSprites = [];
    this.arrowSprites = [];
    this.showNumbers = getSave(this).options.showDamageNumbers;
    this.floaters = [];
    this.areaSums.clear();
    this.healSum = 0;
    this.sumTimer = 0;

    this.detail = 0;
    this.ground = this.add.tileSprite(0, 0, 1, 1, '__DEFAULT').setOrigin(0).setDepth(-10);
    this.agentSprite = this.add.image(0, 0, '__DEFAULT').setDepth(10);
    this.fieldGfx = this.add.graphics().setDepth(1);
    this.fxGfx = this.add.graphics().setDepth(9);
    this.lifeGfx = this.add.graphics().setDepth(11);

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

    // Durante a run: nada de verificação nem de aviso de versão nova.
    updates.leaveMenus();
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
    if (this.run.over || this.levelUpOpen || this.overlayOpen) return;
    this.paused = !this.paused;
    this.showNumbers = getSave(this).options.showDamageNumbers;
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

  /** Desistir pela pausa: encerra a run e vai para a tela de fim de run. */
  giveUp(): void {
    if (this.run.over) return;
    this.gaveUp = true;
    this.run.over = true;
    this.paused = false;
    this.scene.stop(SCENES.pause);
    this.scene.stop(SCENES.options);
  }

  exitToMenu(): void {
    this.stopOverlays();
    this.scene.start(SCENES.hub);
  }

  private stopOverlays(): void {
    for (const key of [
      SCENES.hud,
      SCENES.levelUp,
      SCENES.capsule,
      SCENES.ampoule,
      SCENES.pause,
      SCENES.options,
      SCENES.gameOver,
    ]) {
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
      if (
        this.run.over ||
        this.run.pendingLevelUps > 0 ||
        this.run.capsule ||
        this.run.ampoule ||
        this.run.synapseOffer
      ) {
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
    const frozen = this.run.effects.freeze > 0;

    sync(this, this.enemySprites, this.run.enemies, 5, (s, e) => {
      // O agregado é a mesma molécula, maior (fase 5.10).
      const size = e.aggregate ? RUN.aggregates.sizeMultiplier : 1;
      s.setTexture(this.tex(ENEMY_TEXTURES[e.kind]))
        .setScale(size / this.detail)
        .setPosition(e.x, e.y)
        .setFlipX(e.x > agent.x);
      if (e.hitFlash > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      // Gelo seco ou Nitrogênio líquido: moléculas pintadas de azul.
      else if (frozen || e.frozen > 0) {
        s.setTint(PALETTE.water).setTintMode(Phaser.TintModes.MULTIPLY);
      } else s.clearTint();
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
      s.setTexture(this.tex(PROJECTILE_TEXTURES[p.weapon] ?? TEXTURES.shot))
        .setScale((p.weapon === 'fenton' ? 1.3 : 1) / this.detail)
        .setPosition(p.x, p.y)
        .setRotation(Math.atan2(p.vy, p.vx));
    });
    sync(this, this.coinSprites, this.run.coins, 2, (s, c) => {
      s.setTexture(this.tex(TEXTURES.coin))
        .setScale(1 / this.detail)
        .setPosition(c.x, c.y);
    });
    // Gemas: ciano, verde ou vermelha pelo XP (drops.json gems).
    sync(this, this.gemSprites, this.run.gems, 2, (s, g) => {
      const id =
        g.value <= DROPS.gems.smallMaxXp
          ? 'gemSmall'
          : g.value <= DROPS.gems.mediumMaxXp
            ? 'gemMedium'
            : 'gemLarge';
      this.placeIcon(s, id, g.x, g.y, GEM_SIZE);
    });
    sync(this, this.structureSprites, this.run.structures, 2, (s, st) => {
      this.placeStructureIcon(s, st.kind, st.x, st.y, STRUCTURE_SIZE);
    });
    this.drawEdgeArrows();
    sync(this, this.vesicleSprites, this.run.vesicles, 2, (s, v) => {
      this.placeIcon(
        s,
        'vesicle',
        v.x,
        v.y + Math.sin(this.run.time * 2 + v.x) * 1.5,
        VESICLE_SIZE,
      );
    });
    // Itens piscam devagar; a cápsula é maior.
    const glow = 0.75 + 0.25 * Math.sin(this.run.time * 5);
    sync(this, this.pickupSprites, this.run.pickups, 3, (s, p) => {
      const capsule = p.kind === 'capsule' || p.kind === 'ampoule';
      const id = capsule ? (p.silver ? 'capsuleSilver' : 'capsuleBronze') : p.kind;
      this.placeIcon(s, id, p.x, p.y, capsule ? CAPSULE_SIZE : ITEM_SIZE);
      s.setAlpha(glow);
    });

    for (const ev of drainEvents(this.run)) {
      const { agent: a } = this.run;
      if (ev.type === 'damage') {
        const kind = ev.continuous && !ev.crit && ev.affinity > 0 ? 'area' : hitKind(ev);
        if (kind === 'area') this.addAreaDamage(ev.x, ev.y, ev.amount);
        else this.showFloater(ev.x, ev.y, hitLabel(kind, ev.amount), kind);
      }
      if (ev.type === 'heal') this.healSum += ev.amount;
      if (ev.type === 'dodge') this.showFloater(a.x, a.y - 12, 'ESQUIVA', 'info');
      if (ev.type === 'revive') {
        this.showFloater(a.x, a.y - 14, 'SEGUNDA DOSE!', 'info');
        this.cameras.main.flash(250, 57, 211, 240);
      }
      if (ev.type === 'hurt') {
        this.cameras.main.shake(90, 0.006);
        this.showFloater(a.x, a.y - 14, `-${Math.round(ev.amount)}`, 'hurt');
        this.agentSprite.setTint(PALETTE.interaction).setTintMode(Phaser.TintModes.FILL);
        this.time.delayedCall(90, () => this.agentSprite.clearTint());
      }
      if (ev.type === 'kill') this.addPopFx(ev);
      if (ev.type === 'cone') this.addConeFx(ev);
      if (ev.type === 'beam') this.addBeamFx(ev);
      if (ev.type === 'spark') this.addSparkFx(ev);
      if (ev.type === 'strike') this.addStrikeFx(ev);
      if (ev.type === 'boss') {
        this.cameras.main.shake(400, 0.01);
        this.showFloater(a.x, a.y - 30, 'CHEFE!', 'hurt');
      }
      if (ev.type === 'formationWarning') {
        const hud = this.scene.get(SCENES.hud) as HudScene;
        hud.showBanner(
          ev.name.toUpperCase(),
          ev.crisis ? PALETTE_CSS.interaction : PALETTE_CSS.logoOrange,
        );
        this.warnings.push({
          angle: ev.angle,
          life: RUN.formations.warningSeconds,
          crisis: ev.crisis,
        });
        if (ev.crisis) this.cameras.main.shake(300, 0.006);
      }
      if (ev.type === 'structure') {
        this.addPopFx(ev);
        const hud = this.scene.get(SCENES.hud) as HudScene;
        if (ev.kind === 'focus') hud.showBanner('DECOMPONHA O CERCO!', PALETTE_CSS.interaction);
        if (ev.kind === 'clot') hud.showBanner('COÁGULO: AGREGADO!', PALETTE_CSS.interaction);
        if (ev.kind === 'adrenal') this.showFloater(a.x, a.y - 16, '+ATP · +ESTRESSE', 'info');
      }
      if (ev.type === 'challenge') {
        (this.scene.get(SCENES.hud) as HudScene).showBanner(
          ev.won ? 'CERCO DESFEITO: AMPOLA!' : 'O CERCO ESCAPOU',
          ev.won ? PALETTE_CSS.gold : PALETTE_CSS.textSoft,
        );
      }
      if (ev.type === 'overdose') {
        (this.scene.get(SCENES.hud) as HudScene).showBanner('SUPERDOSAGEM', PALETTE_CSS.gold);
      }
      if (ev.type === 'aggregate') {
        this.cameras.main.shake(200, 0.005);
        this.showFloater(a.x, a.y - 30, 'AGREGADO!', 'hurt');
      }
      if (ev.type === 'special') this.cameras.main.flash(200, 255, 179, 71);
      if (ev.type === 'vesicle') this.addPopFx(ev);
      if (ev.type === 'lysosome') this.cameras.main.flash(300, 255, 255, 255);
      if (
        ev.type === 'item' &&
        ev.kind !== 'capsule' &&
        ev.kind !== 'ampoule' &&
        !DROPS.items[ev.kind].coins
      ) {
        this.showFloater(a.x, a.y - 16, DROPS.items[ev.kind].name.toUpperCase(), 'info');
      }
    }
    this.flushSums(dt);
    this.updateFloaters(dt);
    this.drawFx(dt);
    this.drawLifeBar();
  }

  /** Soma o dano contínuo por região (célula de 24 unidades) até o próximo número. */
  private addAreaDamage(x: number, y: number, amount: number): void {
    const key = `${Math.round(x / 24)},${Math.round(y / 24)}`;
    const sum = this.areaSums.get(key);
    if (sum) sum.amount += amount;
    else this.areaSums.set(key, { x, y, amount });
  }

  private flushSums(dt: number): void {
    this.sumTimer += dt;
    if (this.sumTimer < SUM_EVERY_SECONDS) return;
    this.sumTimer = 0;
    for (const sum of this.areaSums.values()) {
      this.showFloater(sum.x, sum.y, hitLabel('area', sum.amount), 'area');
    }
    this.areaSums.clear();
    if (this.healSum >= 1) {
      const { agent } = this.run;
      this.showFloater(agent.x + 10, agent.y - 10, `+${Math.floor(this.healSum)}`, 'heal');
      this.healSum -= Math.floor(this.healSum);
    }
  }

  /** Interações embaixo do agente: 10 segmentos, o parcial em vermelho claro. */
  private drawLifeBar(): void {
    const g = this.lifeGfx.clear();
    const { agent, stats } = this.run;
    // Medidas da prancheta em pixels de arte: borda, segmentos e 1 pixel entre eles.
    const px = 1 / this.detail;
    const border = Math.max(1, Math.round(1.4 * this.detail)) * px;
    const pip = Math.floor((LIFE_BAR_WIDTH / LIFE_PIPS - px) * this.detail) * px;
    const pipH = Math.round(3.5 * this.detail) * px;
    const w = LIFE_PIPS * pip + (LIFE_PIPS - 1) * px + border * 2;
    const h = pipH + border * 2;
    const x = Math.round((agent.x - w / 2) * this.detail) * px;
    const y = Math.round((agent.y + this.agentSprite.displayHeight / 2 + 2) * this.detail) * px;
    g.fillStyle(PALETTE.ink).fillRect(x, y, w, h);
    const filled = (agent.interactions / stats.maxInteractions) * LIFE_PIPS;
    for (let i = 0; i < LIFE_PIPS; i++) {
      const color =
        i < Math.floor(filled)
          ? PALETTE.interaction
          : i < filled
            ? PALETTE.interactionLight
            : PALETTE.panel;
      g.fillStyle(color).fillRect(x + border + i * (pip + px), y + border, pip, pipH);
    }
  }

  /** Auras, poças e anéis do pulso, embaixo dos inimigos, em pixels de arte. */
  private drawFields(): void {
    const g = this.fieldGfx.clear();
    const { agent } = this.run;
    const px = 1 / this.detail;
    this.run.weapons.forEach((w, i) => {
      if (this.run.rules.weapons[w.id].kind !== 'aura') return;
      const radius = auraRadius(this.run, i);
      const color = AURA_COLORS[w.id] ?? PALETTE.water;
      g.fillStyle(color, 0.14);
      pixelDisc(g, agent.x, agent.y, radius, px);
      g.fillStyle(color, 0.7);
      pixelRing(g, agent.x, agent.y, radius, 1, px);
    });
    for (const z of this.run.zones) {
      const emulsion = z.kind === 'emulsion';
      const a = Math.min(1, z.life * 2);
      const w = z.radius * 2;
      const h = z.radius * 1.6;
      g.fillStyle(emulsion ? PALETTE.cream : PALETTE.chlorine, 0.5 * a);
      pixelOctagonAt(g, z.x, z.y, w, h, px);
      // Filete escuro por dentro, como a poça da prancheta.
      g.fillStyle(emulsion ? PALETTE.creamShade : PALETTE.chlorineDark, 0.55 * a);
      const iw = w * 0.7;
      const ih = h * 0.6;
      const t = Math.max(px, 1);
      g.fillRect(z.x - iw / 2, z.y - ih / 2, iw, t)
        .fillRect(z.x - iw / 2, z.y + ih / 2 - t, iw, t)
        .fillRect(z.x - iw / 2, z.y - ih / 2, t, ih)
        .fillRect(z.x + iw / 2 - t, z.y - ih / 2, t, ih);
    }
    for (const p of this.run.pulses) {
      const a = 1 - p.radius / p.maxRadius;
      g.fillStyle(PALETTE.dopaminePink, 0.8 * a + 0.2);
      pixelRing(g, p.x, p.y, p.radius, 2, px);
    }
    this.drawItemEffects(g, px);
    this.drawStructures(g, px);
    this.drawAggregates(g, px);
    this.drawFormationWarnings(g);
    this.drawCrisisTint(g);
  }

  /**
   * Agregados: contorno vermelho em volta (a seta na borda fica em drawEdgeArrows, fase 5.10).
   */
  private drawAggregates(g: Phaser.GameObjects.Graphics, px: number): void {
    for (const e of this.run.enemies) {
      if (!e.aggregate || e.hp <= 0) continue;
      g.fillStyle(PALETTE.interaction, 0.9);
      pixelRing(g, e.x, e.y, e.radius + 3, 2, px);
    }
  }

  /**
   * Setas da prancheta "Estruturas" na borda da tela: uma para cada agregado fora de vista, em
   * vermelho, e uma para a estrutura mais perto fora de vista, na cor dela.
   */
  private drawEdgeArrows(): void {
    const v = this.cameras.main.worldView;
    const { agent } = this.run;
    const targets: { x: number; y: number; color: number }[] = [];
    for (const e of this.run.enemies) {
      if (e.aggregate && e.hp > 0 && !v.contains(e.x, e.y)) {
        targets.push({ x: e.x, y: e.y, color: PALETTE.interaction });
      }
    }
    const away = this.run.structures.filter((st) => !v.contains(st.x, st.y));
    const nearest = away.sort(
      (a, b) =>
        (a.x - agent.x) ** 2 + (a.y - agent.y) ** 2 - ((b.x - agent.x) ** 2 + (b.y - agent.y) ** 2),
    )[0];
    if (nearest)
      targets.push({ x: nearest.x, y: nearest.y, color: STRUCTURE_COLORS[nearest.kind].main });
    const margin = 14;
    sync(this, this.arrowSprites, targets, 12, (s, t) => {
      const angle = Math.atan2(t.y - agent.y, t.x - agent.x);
      this.placeStructureIcon(
        s,
        'arrow',
        Phaser.Math.Clamp(t.x, v.x + margin, v.right - margin),
        Phaser.Math.Clamp(t.y, v.y + margin, v.bottom - margin),
        ARROW_SIZE,
      );
      // A seta do desenho aponta para cima.
      s.setRotation(angle + Math.PI / 2)
        .setTint(t.color)
        .setTintMode(Phaser.TintModes.MULTIPLY);
    });
  }

  /**
   * Estruturas: o círculo tingido, a borda tracejada e, na sinapse, o anel de dentro que enche
   * no sentido do relógio (prancheta "Estruturas de interação").
   */
  private drawStructures(g: Phaser.GameObjects.Graphics, px: number): void {
    const r = this.run.rules.structures.radiusPx;
    for (const st of this.run.structures) {
      const c = STRUCTURE_COLORS[st.kind];
      g.fillStyle(c.main, 0.16);
      pixelDisc(g, st.x, st.y, r - 6, px);
      pixelArc(g, st.x, st.y, r, 0, 1, 2, px, (a) =>
        Math.floor(a * 40) % 2 === 0 ? c.main : c.dark,
      );
      if (st.progress > 0) {
        pixelArc(g, st.x, st.y, r - 4, 0, st.progress, 3, px, () => c.main);
      }
    }
  }

  /** Seta grande piscando na borda, do lado de onde a formação vai entrar. */
  private drawFormationWarnings(g: Phaser.GameObjects.Graphics): void {
    const v = this.cameras.main.worldView;
    const { agent } = this.run;
    const step = 1 / 60;
    this.warnings = this.warnings.filter((w) => (w.life -= step) > 0);
    for (const w of this.warnings) {
      if (Math.floor(w.life * 6) % 2 === 1) continue;
      const far = Math.hypot(v.width, v.height);
      const x = Phaser.Math.Clamp(agent.x + Math.cos(w.angle) * far, v.x + 22, v.right - 22);
      const y = Phaser.Math.Clamp(agent.y + Math.sin(w.angle) * far, v.y + 22, v.bottom - 22);
      // A seta aponta para dentro: a formação vem de fora.
      const a = w.angle + Math.PI;
      const tip = (r: number, da: number) => ({
        x: x + Math.cos(a + da) * r,
        y: y + Math.sin(a + da) * r,
      });
      const p1 = tip(16, 0);
      const p2 = tip(13, 2.4);
      const p3 = tip(13, -2.4);
      g.fillStyle(PALETTE.outline, 1).fillTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      const q1 = tip(11, 0);
      const q2 = tip(9, 2.4);
      const q3 = tip(9, -2.4);
      g.fillStyle(w.crisis ? PALETTE.interaction : PALETTE.woodHi, 1);
      g.fillTriangle(q1.x, q1.y, q2.x, q2.y, q3.x, q3.y);
    }
  }

  /** Crise: o mapa fica levemente tingido na cor da família enquanto ela dura. */
  private drawCrisisTint(g: Phaser.GameObjects.Graphics): void {
    const family = this.run.formations.crisis?.family;
    if (!family) return;
    const v = this.cameras.main.worldView;
    g.fillStyle(CRISIS_TINT[family] ?? PALETTE.interaction, 0.16).fillRect(
      v.x,
      v.y,
      v.width,
      v.height,
    );
  }

  /** Efeitos de item com tempo: lança-chamas, anel do Gelo seco e borda da Febre de ATP. */
  private drawItemEffects(g: Phaser.GameObjects.Graphics, px: number): void {
    const { agent, effects, stats } = this.run;
    if (effects.flame > 0) {
      const f = DROPS.flame;
      const angle = Math.atan2(agent.dirY, agent.dirX);
      const flicker = 0.85 + 0.15 * Math.sin(this.run.time * 30);
      g.fillStyle(PALETTE.woodHi, 0.45);
      pixelSector(
        g,
        agent.x,
        agent.y,
        f.rangePx * stats.area * flicker,
        angle,
        f.spreadRadians * stats.area,
        2,
      );
      g.fillStyle(PALETTE.goldHi, 0.5);
      pixelSector(
        g,
        agent.x,
        agent.y,
        f.rangePx * stats.area * 0.5,
        angle,
        f.spreadRadians * stats.area * 0.6,
        2,
      );
    }
    if (effects.freeze > 0) {
      g.fillStyle(PALETTE.water, 0.8);
      pixelRing(g, agent.x, agent.y, 14, 1, px);
    }
    if (effects.fever > 0) {
      // Borda de 8 pixels CSS: ouro escuro por fora e claro por dentro, para aparecer na areia.
      const v = this.cameras.main.worldView;
      const t = (4 * Math.min(window.devicePixelRatio || 1, 4)) / this.zoom;
      const border = (inset: number) =>
        g
          .fillRect(v.x + inset, v.y + inset, v.width - inset * 2, t)
          .fillRect(v.x + inset, v.bottom - inset - t, v.width - inset * 2, t)
          .fillRect(v.x + inset, v.y + inset, t, v.height - inset * 2)
          .fillRect(v.right - inset - t, v.y + inset, t, v.height - inset * 2);
      const pulse = 0.75 + 0.25 * Math.sin(this.run.time * 8);
      g.fillStyle(PALETTE.goldDark, pulse);
      border(0);
      g.fillStyle(PALETTE.goldHi, pulse);
      border(t);
    }
  }

  private addFx(total: number, draw: Fx['draw']): void {
    this.fx.push({ draw, life: total, total });
  }

  private addConeFx(ev: { x: number; y: number; angle: number; range: number; spread: number }) {
    this.addFx(0.18, (g, a) => {
      g.fillStyle(PALETTE.chlorine, 0.45 * a);
      pixelSector(g, ev.x, ev.y, ev.range, ev.angle, ev.spread, 2);
    });
  }

  /** Feixe da prancheta: bordas roxo-escuras, roxo e um miolo branco. */
  /** Faísca do Eletrodo: linha azul-clara que pisca entre as duas moléculas. */
  private addSparkFx(ev: { x1: number; y1: number; x2: number; y2: number }) {
    const px = 1 / this.detail;
    this.addFx(0.15, (g, a) => {
      g.fillStyle(PALETTE.cyan, a);
      pixelBand(g, ev.x1, ev.y1, ev.x2, ev.y2, 2, px);
    });
  }

  private addBeamFx(ev: { x: number; y: number; angle: number; length: number; width: number }) {
    const x2 = ev.x + Math.cos(ev.angle) * ev.length;
    const y2 = ev.y + Math.sin(ev.angle) * ev.length;
    const px = 1 / this.detail;
    this.addFx(0.15, (g, a) => {
      g.fillStyle(PALETTE.uvDark, 0.8 * a);
      pixelBand(g, ev.x, ev.y, x2, y2, ev.width + 2, px);
      g.fillStyle(PALETTE.uv, 0.9 * a);
      pixelBand(g, ev.x, ev.y, x2, y2, ev.width, px);
      g.fillStyle(0xffffff, a);
      pixelBand(g, ev.x, ev.y, x2, y2, Math.max(1, ev.width / 3), px);
    });
  }

  private addStrikeFx(ev: { x: number; y: number; radius: number }) {
    const px = 1 / this.detail;
    this.addFx(0.18, (g, a) => {
      g.fillStyle(PALETTE.wood, 0.35 * a);
      pixelDisc(g, ev.x, ev.y, ev.radius * 0.6, px);
      g.fillStyle(PALETTE.woodHi, a);
      pixelRing(g, ev.x, ev.y, ev.radius * (1.2 - a * 0.4), 1.5, px);
    });
  }

  /** Cascata: estalo branco na molécula decomposta e lascas saltando para fora. */
  private addPopFx(ev: { x: number; y: number }) {
    const px = 1 / this.detail;
    const bits = [0, 1, 2, 3, 4, 5].map((k) => (k / 6) * Math.PI * 2 + Math.random() * 0.5);
    this.addFx(0.25, (g, a) => {
      const t = 1 - a;
      g.fillStyle(0xffffff, 0.8 * a);
      pixelRing(g, ev.x, ev.y, 4 + t * 10, 2, px);
      g.fillStyle(0xffffff, a);
      for (const angle of bits) {
        const d = 6 + t * 16;
        g.fillRect(ev.x + Math.cos(angle) * d - 1, ev.y + Math.sin(angle) * d - 1, 2, 2);
      }
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

  /** Número que sobe e some, com a cor e o tamanho do tipo (docs/ui-cronico.md). */
  private showFloater(x: number, y: number, label: string, kind: NumberKind): void {
    if (!this.showNumbers && HIT_KINDS.has(kind)) return;
    let floater = this.floaters.find((f) => f.life <= 0);
    if (!floater) {
      if (this.floaters.length < DAMAGE_TEXT_POOL) {
        const text = this.add
          .text(0, 0, '', { fontStyle: '700', resolution: this.zoom })
          .setOrigin(0.5)
          .setDepth(20);
        floater = { text, life: 0 };
        this.floaters.push(floater);
      } else {
        floater = this.floaters.reduce((a, b) => (a.life < b.life ? a : b));
      }
    }
    const style = NUMBER_STYLES[kind];
    floater.life = FLOATER_SECONDS;
    floater.text
      .setFontFamily(style.font)
      .setFontSize(style.size)
      .setColor(style.color)
      .setStroke(style.outline, Math.max(2, Math.round(style.size / 5)))
      .setText(label)
      .setPosition(x + Phaser.Math.Between(-4, 4), y - 6)
      .setVisible(true)
      .setAlpha(1);
  }

  private updateFloaters(dt: number): void {
    for (const f of this.floaters) {
      if (f.life <= 0) continue;
      f.life -= dt;
      f.text.y -= 20 * dt;
      f.text.setAlpha(Math.min(1, Math.max(0, (f.life / FLOATER_SECONDS) * 2)));
      if (f.life <= 0) f.text.setVisible(false);
    }
  }

  private checkTransitions(): void {
    // A cápsula e a ampola abrem antes do level up que o XP do chefe trouxer.
    const overlay = this.run.capsule
      ? SCENES.capsule
      : this.run.ampoule
        ? SCENES.ampoule
        : this.run.synapseOffer
          ? SCENES.levelUp
          : null;
    if (overlay && !this.overlayOpen && !this.levelUpOpen && !this.run.over) {
      this.overlayOpen = true;
      this.scene.launch(overlay, {
        run: this.run,
        synapse: overlay === SCENES.levelUp,
        onDone: () => {
          this.overlayOpen = false;
        },
      });
      return;
    }
    if (this.overlayOpen) return;
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
      const recorded = recordRun(getSave(this), result);
      const { newRecords } = recorded;
      // Estrelas novas do caso enchem o baú do menu.
      const stars = addRunStars(recorded.save.meta, result.timeSeconds);
      // Saúde: o agente aplica o efeito dele pelos minutos da run; o ATP conta para a herança.
      const health = runHealth(this.run.rules.agents[this.run.agentId], result.timeSeconds / 60);
      const before = recorded.save.organism;
      const organism = earn(applyHealth(before, health), result.atp + stars.reward);
      setSave(this, { ...recorded.save, meta: stars.progress, organism });
      const healthChange = SECTORS.map((s) => ({
        sector: s,
        delta: organism.sectors[s] - before.sectors[s],
      })).filter((c) => Math.abs(c.delta) >= 0.05);
      const damage = this.run.weapons
        .map((w) => ({ id: w.id, value: this.run.tally.damageByWeapon[w.id] ?? 0 }))
        .sort((a, b) => b.value - a.value);
      const data: GameOverData = {
        healthChange,
        result,
        newRecords,
        damage,
        gaveUp: this.gaveUp,
        newStars: stars.newStars,
        starReward: stars.reward,
      };
      this.time.delayedCall(700, () => this.scene.launch(SCENES.gameOver, data));
    }
  }

  /** Sprite de estrutura (prancheta "Estruturas") no mundo, com `size` unidades de lado. */
  private placeStructureIcon(
    s: Phaser.GameObjects.Image,
    id: string,
    x: number,
    y: number,
    size: number,
  ): void {
    s.setTexture(iconKey(this, iconTexture('structures', id), size))
      .setDisplaySize(size, size)
      .setPosition(x, y)
      .setRotation(0)
      .clearTint()
      .setAlpha(1);
  }

  /** Ícone de item (prancheta "Itens do mapa") no mundo, com `size` unidades de lado. */
  private placeIcon(
    s: Phaser.GameObjects.Image,
    id: string,
    x: number,
    y: number,
    size: number,
  ): void {
    s.setTexture(iconKey(this, iconTexture('items', id), size))
      .setDisplaySize(size, size)
      .setPosition(x, y)
      .setAlpha(1);
  }

  private tex(name: string): string {
    return textureKey(name, this.detail);
  }

  /** Escala do mundo: zoom da câmera e texturas com o detalhe certo para a tela (decisão 0009). */
  private applyZoom(): void {
    const cssShort =
      Math.min(this.scale.width, this.scale.height) / Math.min(window.devicePixelRatio || 1, 4);
    const target =
      cssShort >= DISPLAY.largeScreenShortSideCss
        ? DISPLAY.minVisibleShortSidePxLarge
        : DISPLAY.minVisibleShortSidePx;
    const scale = worldScale(this.scale.width, this.scale.height, target, DISPLAY.spriteDetails);
    this.zoom = scale.zoom;
    this.cameras.main.setZoom(scale.zoom);
    // Ícones dos itens no tamanho do zoom do mundo.
    loadIconsForZoom(this, scale.zoom, () => undefined);
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
