import * as Phaser from 'phaser';
import { ECONOMY } from '../../config';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { ENEMY_TEXTURES, textureKey } from '../render/textures';
import { getSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { drawHeart, drawStar } from '../ui/icons';
import {
  RUN_AGENTS,
  SCREENS,
  TAB_SECTIONS,
  TABS,
  type SectionDef,
  type TabId,
} from '../ui/menuContent';
import { renderSection } from '../ui/sectionView';
import { formatTime, hudLabelText, impactText, labelText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

const TAB_KEY = 'hubTab';
const STATUS_H = 46;
const TAB_H = 44;
const RAIL_W = 76;
/** Valores de exemplo dos 4 setores de saúde até a fase 5. */
const SAMPLE_HEALTH = [
  { label: 'F', value: 0.35 },
  { label: 'M', value: 0.7 },
  { label: 'S', value: 0.55 },
  { label: 'E', value: 0.45 },
];

/**
 * Hub do menu principal (docs/menu.md): barra de status, faixa de objetivo, trilhos laterais,
 * o caso atual com estrelas, a linha de ação com JOGAR e a barra de 5 abas.
 */
export class HubScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };

  constructor() {
    super(SCENES.hub);
  }

  create(): void {
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.title));
    this.input.keyboard?.on('keydown-ENTER', () => this.play());
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
  }

  private get tab(): TabId {
    return (this.registry.get(TAB_KEY) as TabId | undefined) ?? 'case';
  }

  private setTab(tab: TabId): void {
    this.registry.set(TAB_KEY, tab);
    this.build();
  }

  private play(): void {
    if (this.tab === 'case') this.scene.start(SCENES.run);
  }

  private open(def: SectionDef): void {
    this.scene.start(SCENES.placeholder, { def });
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const out: Phaser.GameObjects.GameObject[] = [];
    out.push(...this.statusBar(w));
    const top = STATUS_H + 4;
    const bottom = h - TAB_H - 4;
    if (this.tab === 'case') out.push(...this.caseView(w, top, bottom));
    else
      out.push(...renderSection(this, 0, top + 10, w, bottom - top - 10, TAB_SECTIONS[this.tab]));
    out.push(...this.tabBar(w, h));
    this.root = this.add.container(0, 0, out);
  }

  /** Indivíduo, 4 setores de saúde e ATP (valores de exemplo até as fases 3 e 5). */
  private statusBar(w: number): Phaser.GameObjects.GameObject[] {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.panel).fillRect(0, 0, w, STATUS_H);
    g.fillStyle(PALETTE.wood).fillRect(0, STATUS_H - 3, w, 3);
    g.fillStyle(PALETTE.outline).fillRect(0, STATUS_H, w, 1);
    drawHeart(g, 8, 8);
    SAMPLE_HEALTH.forEach((s, i) => {
      const x = 28 + i * 34;
      g.fillStyle(PALETTE.outline).fillRect(x + 8, 29, 22, 7);
      g.fillStyle(PALETTE.panelDark).fillRect(x + 9, 30, 20, 5);
      g.fillStyle(PALETTE.chlorine).fillRect(x + 9, 30, Math.round(20 * s.value), 5);
    });
    return [
      g,
      this.add.text(28, 6, 'INDIVÍDUO 1', impactText(12)),
      ...SAMPLE_HEALTH.map((s, i) =>
        this.add.text(28 + i * 34, 27, s.label, labelText(7, PALETTE_CSS.cream)),
      ),
      this.add.text(w - 8, 6, 'ATP 0', impactText(12, PALETTE_CSS.gold)).setOrigin(1, 0),
      this.add.text(w - 8, 27, 'EM BREVE', labelText(7, PALETTE_CSS.cream)).setOrigin(1, 0),
    ];
  }

  private caseView(w: number, top: number, bottom: number): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    const portrait = this.size.h >= this.size.w * 1.1;
    const best = getSave(this).records.bestTimeSeconds;
    const goals = ECONOMY.meta.caseStarMinutes;
    const stars = goals.filter((m) => best >= m * 60).length;

    // Faixa de objetivo: a próxima estrela do caso.
    const next = goals.find((m) => best < m * 60);
    const objective = next
      ? `PRÓXIMA ESTRELA: SOBREVIVA ${formatTime(next * 60)}`
      : 'CASO 1 COMPLETO: TODAS AS ESTRELAS';
    out.push(
      this.add
        .text(w / 2, top + 4, objective, hudLabelText(8, PALETTE_CSS.water))
        .setOrigin(0.5, 0),
    );

    // Trilhos: Opções à esquerda; Recordes, Compêndio e Conquistas à direita.
    const railTop = top + 22;
    const rail = (x: number, y: number, label: string, onClick: () => void) =>
      addButton(this, {
        x,
        y,
        width: RAIL_W,
        height: 26,
        label,
        fontSize: 9,
        variant: 'secondary',
        onClick,
      });
    out.push(rail(8, railTop, 'OPÇÕES', () => this.scene.start(SCENES.options)));
    out.push(rail(w - RAIL_W - 8, railTop, 'RECORDES', () => this.scene.start(SCENES.records)));
    out.push(rail(w - RAIL_W - 8, railTop + 30, 'COMPÊNDIO', () => this.open(SCREENS.compendium)));
    out.push(
      rail(w - RAIL_W - 8, railTop + 60, 'CONQUISTAS', () => this.open(SCREENS.achievements)),
    );

    // Linha de ação, logo acima da barra de abas.
    const actionH = 48;
    const actionY = bottom - actionH;
    const playW = Math.min(170, Math.floor(w * 0.42));
    const sideW = Math.min(110, Math.floor((w - playW - 32) / 2));
    const cx = Math.floor(w / 2);
    out.push(
      addButton(this, {
        x: cx - Math.floor(playW / 2),
        y: actionY,
        width: playW,
        height: actionH,
        label: 'JOGAR',
        fontSize: 20,
        onClick: () => this.play(),
      }),
      addButton(this, {
        x: cx - Math.floor(playW / 2) - 8 - sideW,
        y: actionY + 6,
        width: sideW,
        height: actionH - 6,
        label: 'CAMPO LONGO',
        fontSize: 9,
        variant: 'secondary',
        onClick: () => this.open(SCREENS.idle),
      }),
    );
    const agent = addButton(this, {
      x: cx + Math.ceil(playW / 2) + 8,
      y: actionY + 6,
      width: sideW,
      height: actionH - 6,
      label: 'DOPAMINA',
      fontSize: 9,
      variant: 'secondary',
      onClick: () =>
        this.open({
          title: 'AGENTE',
          text: 'Escolha o agente da run. Os outros chegam com a profundidade da run.',
          phase: 'FASE 2',
          examples: [{ label: 'AGENTES DA RUN', items: RUN_AGENTS }],
        }),
    });
    out.push(agent);

    // Palco: o caso atual. Em pé fica abaixo dos trilhos; deitado, entre eles.
    const areaTop = portrait ? railTop + 96 : railTop;
    const stageW = portrait ? Math.min(w - 24, 300) : Math.min(300, w - 2 * (RAIL_W + 24));
    const free = actionY - 10 - areaTop;
    const stageH = Math.max(120, Math.min(300, free));
    const stageTop = areaTop + Math.max(0, Math.floor((free - stageH) / 2));
    const left = Math.floor(cx - stageW / 2);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(left, stageTop, stageW, stageH);
    g.fillStyle(PALETTE.wood).fillRect(left + 2, stageTop + 2, stageW - 4, stageH - 4);
    g.fillStyle(PALETTE.sand).fillRect(left + 5, stageTop + 5, stageW - 10, stageH - 10);
    g.fillStyle(PALETTE.panel).fillRect(left + 5, stageTop + 5, stageW - 10, 36);
    out.push(g);
    out.push(this.add.text(cx, stageTop + 9, 'CASO 1', impactText(14)).setOrigin(0.5, 0));
    out.push(
      this.add
        .text(cx, stageTop + 27, 'FÍSICA BAIXA · EXEMPLO', labelText(7, PALETTE_CSS.cream))
        .setOrigin(0.5, 0),
    );

    // Ilustração: as moléculas que atacam este organismo.
    const footer = 58;
    const artY = stageTop + 41 + (stageH - 41 - footer) / 2;
    const kinds = ['glucose', 'triglyceride', 'fattyAcid'] as const;
    const spread = (stageW - 10) * 0.32;
    kinds.forEach((kind, i) => {
      out.push(
        this.add
          .image(cx + (i - 1) * spread, artY, textureKey(ENEMY_TEXTURES[kind], 3))
          .setScale(1 / 2),
      );
    });

    // Melhor tempo e as 3 estrelas.
    const fy = stageTop + stageH - footer;
    g.fillStyle(PALETTE.panel).fillRect(left + 5, fy, stageW - 10, footer - 5);
    out.push(
      this.add
        .text(cx, fy + 5, `MELHOR ${formatTime(best)}`, impactText(13, PALETTE_CSS.hydrogen))
        .setOrigin(0.5, 0),
    );
    goals.forEach((m, i) => {
      const sx = cx - 39 + i * 28;
      drawStar(g, sx, fy + 24, i < stars);
      out.push(
        this.add.text(sx + 10, fy + 46, `${m}`, labelText(6, PALETTE_CSS.cream)).setOrigin(0.5, 0),
      );
    });

    return out;
  }

  private tabBar(w: number, h: number): Phaser.GameObjects.GameObject[] {
    const y = h - TAB_H;
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(0, y - 1, w, 1);
    g.fillStyle(PALETTE.panelDark).fillRect(0, y, w, TAB_H);
    const maxW = Math.min(w, 560);
    const x0 = Math.floor((w - maxW) / 2);
    const tw = Math.floor(maxW / TABS.length);
    return [
      g,
      ...TABS.map((t, i) =>
        addButton(this, {
          x: x0 + i * tw + 2,
          y: y + 4,
          width: tw - 4,
          height: TAB_H - 8,
          label: t.label,
          fontSize: 10,
          variant: t.id === this.tab ? 'primary' : 'secondary',
          onClick: () => this.setTab(t.id),
        }),
      ),
    ];
  }
}
