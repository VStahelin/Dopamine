import * as Phaser from 'phaser';
import {
  AGENTS,
  MAP,
  MAP_ENVIRONMENTS,
  ORGANISM,
  type AgentId,
  type MapEnvironment,
} from '../../config';
import { playableAgent } from '../../core/meta/progress';
import { canEnter, indicatedLocal, synergyOf } from '../../core/organism/local';
import { music } from '../audio/music';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import {
  BODY_MAP_SIZE,
  bodyMapCenters,
  drawBodyMap,
  drawGrid,
  drawIcon,
  drawInkBox,
} from '../ui/icons';
import { bodyText, formatTime, impactText, labelText, withShadow } from '../ui/theme';
import { familyText, floorColor, LOCAL_SHORT } from '../ui/locals';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

type Obj = Phaser.GameObjects.GameObject;

/** Ordem da lista, de cima para baixo no corpo. */
const ORDER: MapEnvironment[] = ['brain', 'lung', 'liver', 'intestine', 'blood'];

/**
 * "Onde agir?" (fase 5.12, decisão 0032, prancheta "Escolha do local"): o corpo com os cinco
 * locais, o cartão do local tocado com o par do agente e os botões Qualquer lugar e IR.
 */
export class LocalScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };
  private pick: MapEnvironment = 'blood';

  constructor() {
    super(SCENES.local);
  }

  create(): void {
    music.setMain('hub');
    if (!getSave(this).localsAnnounced) setSave(this, { ...getSave(this), localsAnnounced: true });
    const save = getSave(this);
    const chosen = save.selectedLocal as MapEnvironment | 'random';
    this.pick =
      chosen !== 'random' && MAP_ENVIRONMENTS.includes(chosen)
        ? chosen
        : (indicatedLocal(save.organism) ?? 'blood');
    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.back());
    kb?.on('keydown-ENTER', () => this.go());
    kb?.on('keydown-UP', () => this.move(-1));
    kb?.on('keydown-DOWN', () => this.move(1));
    setupUiLayout(
      this,
      (w, h) => {
        this.size = { w, h };
        this.build();
      },
      { width: 390, height: 760 },
    );
  }

  private agent(): AgentId {
    const save = getSave(this);
    return playableAgent(save.meta, save.selectedAgent in AGENTS ? save.selectedAgent : 'dopamine');
  }

  private back(): void {
    this.scene.start(SCENES.hub);
  }

  private move(d: number): void {
    const i = ORDER.indexOf(this.pick);
    this.pick = ORDER[(i + d + ORDER.length) % ORDER.length]!;
    this.build();
  }

  private select(env: MapEnvironment): void {
    this.pick = env;
    this.build();
  }

  /** Começa a run no local tocado; barrado, não faz nada. */
  private go(): void {
    if (!canEnter(AGENTS[this.agent()], this.pick)) return;
    setSave(this, { ...getSave(this), selectedLocal: this.pick });
    this.scene.start(SCENES.run);
  }

  private random(): void {
    setSave(this, { ...getSave(this), selectedLocal: 'random' });
    this.scene.start(SCENES.run);
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const save = getSave(this);
    const agentId = this.agent();
    const agent = AGENTS[agentId];
    const indicated = indicatedLocal(save.organism);
    const g = this.add.graphics();
    drawGrid(g, 0, 0, w, h);
    const out: Obj[] = [g];
    const colW = Math.min(w, 420);
    const colX = Math.floor((w - colW) / 2);

    out.push(
      this.add
        .text(
          w / 2,
          18,
          'ONDE AGIR?',
          withShadow(impactText(24, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
        )
        .setOrigin(0.5, 0),
    );

    // Embaixo: botões; em cima deles, o cartão do local; o resto é o corpo e a lista.
    const buttonsY = h - 70;
    const cardH = 168;
    const cardY = buttonsY - 10 - cardH;
    const top = 60;
    const areaH = cardY - 10 - top;
    const pixel = Math.max(3, Math.min(7, Math.floor((areaH - 20) / BODY_MAP_SIZE.rows)));
    const bodyW = BODY_MAP_SIZE.cols * pixel;
    const bodyH = BODY_MAP_SIZE.rows * pixel;
    const listW = 150;
    const gap = 14;
    const groupW = bodyW + 20 + gap + listW;
    const bx = Math.floor(colX + (colW - groupW) / 2);
    const by = Math.floor(top + (areaH - bodyH - 20) / 2);

    // Corpo: o local tocado acende no tom 4, os outros no tom 1; barrado fica cinza.
    drawInkBox(g, bx, by, bodyW + 20, bodyH + 20, PALETTE.scanBg);
    const barred = (env: MapEnvironment) => !canEnter(agent, env);
    drawBodyMap(g, bx + 10, by + 10, pixel, (env) => {
      const on = env === this.pick;
      if (on && barred(env)) return PALETTE.stone;
      if (env === 'blood') return on ? PALETTE.interaction : PALETTE.darkRed;
      return floorColor(env, on ? 4 : 1);
    });
    const centers = bodyMapCenters();
    for (const env of ORDER) {
      const c = centers[env];
      const size = env === 'blood' ? 40 : 56;
      out.push(
        this.add
          .zone(bx + 10 + (c.col + 0.5) * pixel, by + 10 + (c.row + 0.5) * pixel, size, size)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => this.select(env)),
      );
    }

    // Lista dos locais, com ✚ do par e ⊘ da barreira.
    const lx = bx + bodyW + 20 + gap;
    const rowH = 40;
    const ly = Math.floor(by + (bodyH + 20 - ORDER.length * (rowH + 6)) / 2);
    ORDER.forEach((env, i) => {
      const y = ly + i * (rowH + 6);
      const on = env === this.pick;
      g.fillStyle(on ? PALETTE.outline : PALETTE.ink).fillRect(lx, y, listW, rowH);
      g.fillStyle(on ? PALETTE.wood : PALETTE.panel).fillRect(lx + 3, y + 3, listW - 6, rowH - 6);
      g.fillStyle(PALETTE.ink).fillRect(lx + 9, y + 13, 14, 14);
      g.fillStyle(env === 'blood' ? PALETTE.interaction : floorColor(env, 3)).fillRect(
        lx + 11,
        y + 15,
        10,
        10,
      );
      out.push(
        this.add.text(
          lx + 30,
          y + 13,
          LOCAL_SHORT[env],
          labelText(10, on ? '#FFFFFF' : PALETTE_CSS.textSoft),
        ),
      );
      if (synergyOf(agent, env)) drawIcon(g, 'synergy', lx + listW - 22, y + 12, PALETTE.buff, 2);
      if (barred(env)) drawIcon(g, 'barrier', lx + listW - 22, y + 12, PALETTE.interaction, 2);
      if (env === indicated) {
        g.fillStyle(PALETTE.ink).fillRect(lx + listW - 38, y + 14, 12, 12);
        g.fillStyle(PALETTE.gold).fillRect(lx + listW - 36, y + 16, 8, 8);
      }
      out.push(
        this.add
          .zone(lx + listW / 2, y + rowH / 2, listW, rowH)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => this.select(env)),
      );
    });

    out.push(...this.card(g, colX + 12, cardY, colW - 24, cardH, agentId, indicated));

    // Botões: Qualquer lugar (+10% de ATP) e IR.
    const bw = colW - 24;
    const goW = Math.floor(bw * 0.38);
    const anyW = bw - goW - 8;
    const blocked = barred(this.pick);
    out.push(
      addButton(this, {
        x: colX + 12,
        y: buttonsY,
        width: anyW,
        height: 54,
        label: `QUALQUER LUGAR +${Math.round(MAP.locals.randomAtpBonus * 100)}% ATP`,
        fontSize: 11,
        variant: 'secondary',
        onClick: () => this.random(),
      }),
      addButton(this, {
        x: colX + 12 + anyW + 8,
        y: buttonsY,
        width: goW,
        height: 54,
        label: 'IR',
        fontSize: 22,
        variant: blocked ? 'secondary' : 'primary',
        onClick: () => this.go(),
      }),
    );
    const back = this.add
      .text(colX + 14, 22, '‹ VOLTAR', labelText(10, PALETTE_CSS.textSoft))
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.back());
    out.push(back);
    this.root = this.add.container(0, 0, out);
  }

  /** Cartão do local tocado: tile, família, setor, o par com o agente e quem tem sinergia. */
  private card(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    agentId: AgentId,
    indicated: MapEnvironment | null,
  ): Obj[] {
    const env = this.pick;
    const def = MAP.environments[env];
    const agent = AGENTS[agentId];
    const save = getSave(this);
    const edge = env === 'blood' ? PALETTE.interaction : floorColor(env, 4);
    g.fillStyle(PALETTE.ink).fillRect(x, y, w, h);
    g.fillStyle(edge).fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle(PALETTE.panelDeep).fillRect(x + 5, y + 5, w - 10, h - 10);
    const out: Obj[] = [];
    out.push(
      this.add.text(
        x + 14,
        y + 12,
        def.name.toUpperCase(),
        withShadow(impactText(18, '#FFFFFF'), PALETTE_CSS.ink, 2),
      ),
    );
    if (env === indicated) {
      const tag = this.add
        .text(x + w - 16, y + 16, 'INDICADO', labelText(9, PALETTE_CSS.ink))
        .setOrigin(1, 0);
      g.fillStyle(PALETTE.ink).fillRect(x + w - 22 - tag.width, y + 11, tag.width + 12, 20);
      g.fillStyle(PALETTE.gold).fillRect(x + w - 20 - tag.width, y + 13, tag.width + 8, 16);
      out.push(tag);
    }

    // Tile do chão: os tons 3 e 2 em xadrez, como um pedaço do mapa.
    const tx = x + 14;
    const ty = y + 42;
    g.fillStyle(PALETTE.ink).fillRect(tx, ty, 40, 40);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        g.fillStyle(floorColor(env, (i + j) % 2 === 0 ? 3 : 2)).fillRect(
          tx + 2 + i * 12,
          ty + 2 + j * 12,
          12,
          12,
        );
      }
    }
    const sector = def.sector;
    out.push(
      this.add.text(tx + 50, ty + 2, familyText(env), bodyText(13, PALETTE_CSS.text)),
      this.add.text(
        tx + 50,
        ty + 21,
        sector
          ? `Setor do local: ${ORGANISM.sectors[sector].name} ×${String(MAP.locals.sectorMultiplier).replace('.', ',')}`
          : 'Local neutro: nada muda',
        bodyText(12, PALETTE_CSS.textSoft),
      ),
    );

    // O par com o agente escolhido.
    const synergy = synergyOf(agent, env);
    let pair: string;
    let color: string = PALETTE_CSS.textSoft;
    if (!canEnter(agent, env)) {
      pair = `⊘ A ${agent.name} não atravessa a barreira`;
      color = PALETTE_CSS.alert;
    } else if (synergy) {
      pair = `✚ ${agent.name}: +${ORGANISM.synergy.health} ${ORGANISM.sectors[synergy].name}, colateral pela metade, perfil no nível ${ORGANISM.synergy.nativeReceptorLevel}`;
      color = PALETTE_CSS.numberHeal;
    } else {
      pair = `${agent.name}: sem sinergia aqui`;
    }
    out.push(
      this.add.text(x + 14, y + 92, pair, {
        ...bodyText(12, color),
        wordWrap: { width: w - 28 },
      }),
    );

    // Quem tem sinergia aqui e o melhor tempo neste local.
    const owners = (Object.keys(AGENTS) as AgentId[]).filter(
      (id) => AGENTS[id].synergy?.env === env,
    );
    const best = save.records.bestTimeByLocal[env] ?? 0;
    const names = owners
      .map((id) => (save.meta.agents.includes(id) ? AGENTS[id].name : '???'))
      .join(', ');
    out.push(
      this.add.text(
        x + 14,
        y + h - 26,
        `SINERGIA: ${names ? names.toUpperCase() : 'EM BREVE'}`,
        labelText(8, PALETTE_CSS.textSoft),
      ),
      this.add
        .text(
          x + w - 14,
          y + h - 26,
          `MELHOR: ${best > 0 ? formatTime(best) : '--:--'}`,
          labelText(8, PALETTE_CSS.gold),
        )
        .setOrigin(1, 0),
    );
    return out;
  }
}
