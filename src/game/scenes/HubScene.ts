import * as Phaser from 'phaser';
import { AGENTS, ECONOMY, ENEMIES, ORGANISM, SECTORS, type AgentId } from '../../config';
import { dischargeSave } from '../../core/organism/discharge';
import { averageHealth, illnessName } from '../../core/organism/organism';
import { renderOrganism, SECTOR_ORDER, SECTOR_STYLE } from '../ui/organismView';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { AGENT_TEXTURES, ENEMY_TEXTURES, textureKey } from '../render/textures';
import { getSave, setSave } from '../storage/saveStore';
import { renderAgents, renderArsenal } from '../ui/catalogViews';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import {
  buyLab,
  buyUnlock,
  labAffordable,
  openChest,
  playableAgent,
  unlockAffordable,
  type UnlockKind,
} from '../../core/meta/progress';
import { LAB_DETAIL_H, labTreeHeight, renderLabDetail, renderLabTree } from '../ui/labView';
import {
  BODY_SIZE,
  drawBody,
  drawCoin,
  drawBadge,
  drawCreamSlot,
  drawGrid,
  drawIcon,
  drawInkBox,
  drawShield,
  drawStar,
  drawWoodFrame,
  type IconName,
} from '../ui/icons';
import { SCREENS, TABS, type SectionDef, type TabId } from '../ui/menuContent';
import { bodyText, formatTime, impactText, labelText, withShadow } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { addButton } from '../ui/button';
import { collect, type OfflineGain } from '../../core/idle/progress';
import { idleRunner } from '../idle/idleRunner';
import { earn } from '../../core/organism/organism';
import { updates } from '../update/updateManager';
import { SCENES } from './keys';
import { music } from '../audio/music';

const TAB_KEY = 'hubTab';
/** Alturas das faixas do artboard "Menu principal (protótipo)" (390×844). */
const TOP_H = 84;
const ROW2_H = 64;
const ACTION_H = 136;
const TAB_H = 84;
/** Largura máxima da coluna de conteúdo em telas largas. */
const COLUMN_W = 480;

const TAB_ICONS: Record<TabId, IconName> = {
  agents: 'agents',
  arsenal: 'arsenal',
  case: 'case',
  lab: 'lab',
  organism: 'organism',
};

type Obj = Phaser.GameObjects.GameObject;

/**
 * Hub do menu principal, fiel ao artboard "Menu principal (protótipo)" do canvas de identidade
 * visual (docs/menu.md): barra de status, linha de objetivo, o caso com o scanner do organismo,
 * a linha de ação com JOGAR e a barra de 5 abas.
 */
export class HubScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private scroll?: ScrollArea;
  /** Rolagem de cada aba, para voltar ao mesmo ponto depois de uma compra. */
  private scrollOffsets: Partial<Record<TabId, number>> = {};
  private scrollTab?: TabId;
  /** Primeiro toque em DAR ALTA pede confirmação. */
  private confirmDischarge = false;
  /** Relatório do progresso offline, mostrado uma vez ao abrir o Hub. */
  private awayReport?: OfflineGain;
  /** Nó do Laboratório mostrado no painel de detalhe. */
  private labSelected = 'interactions';
  private size = { w: 0, h: 0 };

  constructor() {
    super(SCENES.hub);
  }

  create(): void {
    music.setMain('hub');
    this.awayReport = idleRunner.takeReport();
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.title));
    // Aviso de versão nova: só aqui nos menus, uma vez por visita ao hub.
    const unsubscribe = updates.subscribe(() => this.maybePromptUpdate());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    updates.enterHub();
    this.time.delayedCall(300, () => this.maybePromptUpdate());
    this.input.keyboard?.on('keydown-ENTER', () => this.play());
    setupUiLayout(
      this,
      (w, h) => {
        this.size = { w, h };
        this.build();
      },
      { width: 390, height: 760 },
    );
  }

  private maybePromptUpdate(): void {
    if (!this.scene.isActive() || this.scene.isActive(SCENES.updatePrompt)) return;
    if (updates.shouldPrompt) this.scene.launch(SCENES.updatePrompt);
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

  private selectedAgent(): AgentId {
    const save = getSave(this);
    return playableAgent(save.meta, save.selectedAgent in AGENTS ? save.selectedAgent : 'dopamine');
  }

  /** Loja das abas Agentes e Arsenal: desbloqueia com ATP e salva. */
  private shop() {
    const save = getSave(this);
    return {
      progress: save.meta,
      atp: save.atp,
      onBuy: (kind: UnlockKind, id: string) => {
        const now = getSave(this);
        const bought = buyUnlock(now.meta, now.atp, kind, id);
        if (!bought) return;
        setSave(this, { ...now, meta: bought.progress, atp: bought.atp });
        this.build();
      },
    };
  }

  private buyLabNode(id: string): void {
    const save = getSave(this);
    const bought = buyLab(save.meta, save.atp, id);
    if (!bought) return;
    setSave(this, { ...save, meta: bought.progress, atp: bought.atp });
    this.build();
  }

  /** Conteúdo das abas: Agentes e Arsenal já têm conteúdo; Laboratório e Organismo são placeholder. */
  private tabContent(w: number, top: number): Phaser.GameObjects.GameObject[] {
    switch (this.tab) {
      case 'agents':
        return renderAgents(
          this,
          0,
          top + 14,
          w,
          this.selectedAgent(),
          (id) => {
            setSave(this, { ...getSave(this), selectedAgent: id });
            this.build();
          },
          true,
          this.shop(),
        );
      case 'arsenal':
        return renderArsenal(this, 0, top + 14, w, this.shop());
      case 'lab': {
        const save = getSave(this);
        const special = AGENTS[this.selectedAgent()].special.kind;
        const width = Math.min(w - 24, 400);
        return renderLabTree(
          this,
          Math.floor((w - width) / 2),
          top + 10,
          width,
          save.meta,
          special,
          this.labSelected,
          (id) => {
            this.labSelected = id;
            this.build();
          },
        );
      }
      case 'organism':
        return renderOrganism(
          this,
          0,
          top + 14,
          w,
          getSave(this).organism,
          this.confirmDischarge,
          () => {
            if (!this.confirmDischarge) {
              this.confirmDischarge = true;
              this.build();
              return;
            }
            this.confirmDischarge = false;
            idleRunner.flush();
            const next = dischargeSave(getSave(this), Date.now());
            if (!next) return;
            setSave(this, next);
            music.jingle('alta');
            idleRunner.rebuild();
            this.build();
          },
        );
      case 'case':
        return [];
    }
  }

  private open(def: SectionDef): void {
    this.scene.start(SCENES.placeholder, { def });
  }

  private build(): void {
    this.root?.destroy();
    if (this.scroll && this.scrollTab) this.scrollOffsets[this.scrollTab] = this.scroll.offset();
    this.scroll?.destroy();
    this.scroll = undefined;
    const { w, h } = this.size;
    const colW = Math.min(w, COLUMN_W);
    const colX = Math.floor((w - colW) / 2);
    const g = this.add.graphics();
    const out: Obj[] = [g];

    const midTop = TOP_H + ROW2_H;
    const midBottom = h - TAB_H;
    drawGrid(g, 0, midTop, w, midBottom - midTop);

    out.push(...this.topBar(g, w, colX, colW));
    out.push(...this.row2(g, colX, colW));
    if (this.tab === 'case') {
      out.push(...this.caseArea(g, colX, colW, midTop, midBottom - ACTION_H));
      out.push(...this.actionRow(g, w, colX, colW, midBottom - ACTION_H));
    } else if (
      this.tab === 'agents' ||
      this.tab === 'arsenal' ||
      this.tab === 'lab' ||
      this.tab === 'organism'
    ) {
      // Listas longas rolam dentro da área entre as barras. No Laboratório, o painel do nó
      // escolhido fica fixo em cima e só a árvore rola.
      let top = midTop;
      if (this.tab === 'lab') {
        const save = getSave(this);
        out.push(
          ...renderLabDetail(
            this,
            colX + 12,
            midTop + 8,
            colW - 24,
            this.labSelected,
            save.meta,
            save.atp,
            AGENTS[this.selectedAgent()].special.kind,
            (id) => this.buyLabNode(id),
          ),
        );
        top = midTop + 8 + LAB_DETAIL_H + 4;
      }
      const content = this.tabContent(w, top);
      this.scroll = addScrollArea(
        this,
        content,
        { x: 0, y: top, width: w, height: midBottom - top },
        this.scrollOffsets[this.tab] ?? 0,
      );
      this.scrollTab = this.tab;
      void labTreeHeight;
    } else {
      out.push(...this.tabContent(w, midTop));
    }
    out.push(...this.tabBar(g, w, h, colX, colW));
    if (this.awayReport) out.push(...this.awayPanel(w, h, this.awayReport));
    this.root = this.add.container(0, 0, out);
    this.scroll?.isolate();
  }

  /** Painel "Enquanto você estava fora": o que o campo longo produziu com o jogo fechado. */
  private awayPanel(w: number, h: number, report: OfflineGain): Obj[] {
    const pw = Math.min(w - 32, 320);
    const ph = 190;
    const x = Math.floor((w - pw) / 2);
    const y = Math.floor((h - ph) / 2);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(x, y, pw, ph);
    g.fillStyle(PALETTE.woodDark).fillRect(x + 4, y + 4, pw - 8, ph - 8);
    g.fillStyle(PALETTE.panel).fillRect(x + 8, y + 8, pw - 16, ph - 16);
    const hours = Math.floor(report.seconds / 3600);
    const minutes = Math.floor((report.seconds % 3600) / 60);
    const time = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
    return [
      addDim(this, w, h, 0.7),
      g,
      this.add
        .text(w / 2, y + 20, 'ENQUANTO VOCÊ ESTAVA FORA', labelText(11, PALETTE_CSS.cyan))
        .setOrigin(0.5, 0),
      this.add
        .text(
          w / 2,
          y + 44,
          `+${report.atp.toLocaleString('pt-BR')} ATP`,
          impactText(30, PALETTE_CSS.gold),
        )
        .setOrigin(0.5, 0),
      this.add
        .text(w / 2, y + 88, `O campo longo trabalhou ${time}.`, bodyText(11, PALETTE_CSS.cream))
        .setOrigin(0.5, 0),
      addButton(this, {
        x: x + 20,
        y: y + ph - 62,
        width: pw - 40,
        height: 44,
        label: 'COLETAR',
        fontSize: 16,
        onClick: () => {
          const save = getSave(this);
          const c = collect(save.idle, save.atp);
          const organism = earn(save.organism, c.atp - save.atp);
          setSave(this, { ...save, idle: c.idle, atp: c.atp, organism });
          this.awayReport = undefined;
          this.build();
        },
      }),
    ];
  }

  /** Retrato do organismo, indivíduo, saúde por setor e ATP. */
  private topBar(g: Phaser.GameObjects.Graphics, w: number, colX: number, colW: number): Obj[] {
    g.fillStyle(PALETTE.night).fillRect(0, 0, w, TOP_H);
    g.fillStyle(PALETTE.ink).fillRect(0, TOP_H - 4, w, 4);

    // Retrato: moldura de madeira com o organismo em miniatura.
    const px = colX + 12;
    drawWoodFrame(g, px, 14, 56, 56);
    g.fillStyle(PALETTE.scanBg).fillRect(px + 7, 21, 42, 42);
    drawBody(g, px + 14, 20, 2);

    const tx = px + 66;
    const organism = getSave(this).organism;
    const out: Obj[] = [
      this.add.text(tx, 20, `INDIVÍDUO ${organism.individual}`, labelText(12, PALETTE_CSS.text)),
    ];
    SECTOR_ORDER.forEach((sector, i) => {
      const bx = tx + i * 35;
      const value = organism.sectors[sector];
      g.fillStyle(PALETTE.ink).fillRect(bx, 40, 30, 12);
      g.fillStyle(PALETTE.panelDeep).fillRect(bx + 2, 42, 26, 8);
      g.fillStyle(SECTOR_STYLE[sector].color).fillRect(
        bx + 2,
        42,
        Math.round((26 * value) / 100),
        8,
      );
      out.push(
        this.add
          .text(bx + 15, 54, SECTOR_STYLE[sector].label, labelText(9, PALETTE_CSS.textSoft))
          .setOrigin(0.5, 0),
      );
    });
    const avg = Math.round(averageHealth(organism));
    out.push(
      this.add.text(
        tx + 4 * 35 + 2,
        38,
        `${avg}%`,
        withShadow({ ...bodyText(15, '#FFFFFF'), fontStyle: '700' }, PALETTE_CSS.ink, 2),
      ),
    );

    // ATP: caixa azul com moeda, valor e rótulo.
    const atp = this.add.text(
      0,
      0,
      getSave(this).atp.toLocaleString('pt-BR'),
      withShadow({ ...bodyText(19, '#FFFFFF'), fontStyle: '700' }, PALETTE_CSS.ink, 3),
    );
    const chipW = 8 + 22 + 6 + Math.max(atp.width, 30) + 10;
    const chipX = colX + colW - 12 - chipW;
    g.fillStyle(PALETTE.ink).fillRect(chipX, 19, chipW, 46);
    g.fillStyle(PALETTE.panel).fillRect(chipX + 3, 22, chipW - 6, 40);
    g.fillStyle(PALETTE.panelShade).fillRect(chipX + 3, 59, chipW - 6, 3);
    drawCoin(g, chipX + 8, 31, 22);
    atp.setPosition(chipX + 36, 25);
    out.push(atp, this.add.text(chipX + 36, 47, 'ATP', labelText(9, PALETTE_CSS.gold)));
    return out;
  }

  /** Opções, faixa de objetivo (próxima estrela) e Recordes. */
  private row2(g: Phaser.GameObjects.Graphics, colX: number, colW: number): Obj[] {
    const y = TOP_H + 10;
    const out: Obj[] = [
      this.iconButton(g, colX + 12, y, 44, 'menu', PALETTE.textLight, () =>
        this.scene.start(SCENES.options, { fromRun: false }),
      ),
      this.iconButton(g, colX + colW - 56, y, 44, 'trophy', PALETTE.gold, () =>
        this.scene.start(SCENES.records),
      ),
    ];

    const best = getSave(this).records.bestTimeSeconds;
    const next = ECONOMY.meta.caseStarMinutes.find((m) => best < m * 60);
    const sx = colX + 12 + 44 + 8;
    const sw = colW - 2 * (12 + 44 + 8);
    drawWoodFrame(g, sx, y, sw, 44);
    g.fillStyle(PALETTE.panelDeep).fillRect(sx + 7, y + 7, sw - 14, 30);
    const left = next ? `PRÓXIMA ESTRELA: ${next} MIN` : 'CASO 1 COMPLETO';
    const right = next ? `faltam ${formatTime(next * 60 - best)}` : '3 estrelas';
    out.push(
      this.add.text(sx + 14, y + 10, left, labelText(10, PALETTE_CSS.text)),
      this.add.text(sx + sw - 14, y + 9, right, bodyText(11, PALETTE_CSS.textSoft)).setOrigin(1, 0),
    );
    const progress = next ? Math.min(1, best / (next * 60)) : 1;
    const barW = sw - 28;
    g.fillStyle(PALETTE.panel).fillRect(sx + 14, y + 26, barW, 6);
    g.fillStyle(PALETTE.progress).fillRect(sx + 14, y + 26, Math.round(barW * progress), 6);
    g.fillStyle(PALETTE.progressShade).fillRect(sx + 14, y + 30, Math.round(barW * progress), 2);
    return out;
  }

  /** O caso atual: distintivo, melhor tempo, scanner do organismo, estrelas e baú, trilho. */
  private caseArea(
    g: Phaser.GameObjects.Graphics,
    colX: number,
    colW: number,
    top: number,
    bottom: number,
  ): Obj[] {
    const out: Obj[] = [];
    const cx = colX + Math.floor(colW / 2);
    const best = getSave(this).records.bestTimeSeconds;
    const goals = ECONOMY.meta.caseStarMinutes;

    // Distintivo + nome do caso.
    const organism = getSave(this).organism;
    const lowest = [...SECTORS].sort((a, b) => organism.sectors[a] - organism.sectors[b])[0]!;
    const title = this.add.text(
      0,
      top + 14,
      illnessName(organism.individual),
      withShadow(impactText(23, '#FFFFFF'), PALETTE_CSS.outline, 2),
    );
    const rowW = 34 + 8 + title.width;
    const rx = Math.floor(cx - rowW / 2);
    drawShield(g, rx, top + 14, 34, 38);
    out.push(
      this.add
        .text(rx + 17, top + 18, String(organism.individual), impactText(20, PALETTE_CSS.cyan))
        .setOrigin(0.5, 0),
    );
    title.setX(rx + 42);
    out.push(title);
    out.push(
      this.add
        .text(
          cx,
          top + 58,
          `Melhor: ${formatTime(best)}`,
          withShadow(
            { ...bodyText(16, PALETTE_CSS.gold), fontStyle: '700' },
            PALETTE_CSS.outline,
            2,
          ),
        )
        .setOrigin(0.5, 0),
    );

    // Estrelas e baú no rodapé do caso.
    const starsH = 58;
    const starsY = bottom - starsH - 10;

    // Scanner do organismo, do tamanho que couber entre o título e as estrelas.
    const scanTop = top + 86;
    const scanH = Math.max(110, Math.min(198, starsY - 8 - scanTop));
    const pixel = Math.max(3, Math.floor((scanH - 30) / BODY_SIZE.rows));
    const scanW = Math.round((186 * scanH) / 198);
    const scanX = Math.floor(cx - scanW / 2);
    g.fillStyle(PALETTE.ink).fillRect(scanX, scanTop, scanW, scanH);
    g.fillStyle(PALETTE.scanEdge).fillRect(scanX + 4, scanTop + 4, scanW - 8, scanH - 8);
    g.fillStyle(PALETTE.scanBg).fillRect(scanX + 6, scanTop + 6, scanW - 12, scanH - 12);
    g.fillStyle(PALETTE.scanLine);
    for (let sy = scanTop + 6; sy < scanTop + scanH - 6; sy += 6) {
      g.fillRect(scanX + 6, sy, scanW - 12, 2);
    }
    drawBody(
      g,
      Math.floor(cx - (BODY_SIZE.cols * pixel) / 2),
      Math.floor(scanTop + scanH / 2 - (BODY_SIZE.rows * pixel) / 2),
      pixel,
    );
    out.push(
      this.add.text(scanX + 10, scanTop + 10, 'SCAN', labelText(9, PALETTE_CSS.cyan)),
      this.add
        .text(
          scanX + scanW - 10,
          scanTop + scanH - 10,
          `${ORGANISM.sectors[lowest].name.toUpperCase()} ${Math.round(organism.sectors[lowest])}`,
          labelText(9, PALETTE_CSS.alert),
        )
        .setOrigin(1, 1),
    );

    // Moléculas flutuando em volta do scanner.
    // As moléculas da doença: as da família do setor mais baixo.
    const family = (Object.keys(ENEMY_TEXTURES) as (keyof typeof ENEMY_TEXTURES)[]).filter(
      (k) => ORGANISM.sectors[lowest].families.includes(ENEMIES[k].type) && !ENEMIES[k].boss,
    );
    const pick = (i: number) => family[i % Math.max(1, family.length)] ?? 'glucose';
    const floaters: [keyof typeof ENEMY_TEXTURES, number, number][] = [
      [pick(0), scanX - 24, scanTop + 30],
      [pick(1), scanX + scanW + 6, scanTop + scanH * 0.72],
      [pick(2), scanX - 18, scanTop + scanH * 0.78],
    ];
    for (const [kind, fx, fy] of floaters) {
      out.push(this.add.image(fx, fy, textureKey(ENEMY_TEXTURES[kind], 3)).setScale(0.4));
    }

    // Caixa das estrelas (metas de tempo) e o baú ao lado.
    // Estrelas a cada 44 px, para os rótulos "10 MIN" e "15 MIN" não se encostarem.
    const boxW = 3 * 26 + 2 * 18 + 24;
    const rowX = Math.floor(cx - (boxW + 10 + 52) / 2);
    drawInkBox(g, rowX, starsY, boxW, starsH);
    goals.forEach((m, i) => {
      const sx = rowX + 12 + i * 44;
      drawStar(g, sx, starsY + 8, 26, i < getSave(this).meta.stars || best >= m * 60);
      out.push(
        this.add
          .text(sx + 13, starsY + 38, `${m} MIN`, labelText(9, PALETTE_CSS.textSoft))
          .setOrigin(0.5, 0),
      );
    });
    const meta = getSave(this).meta;
    out.push(
      this.iconButton(g, rowX + boxW + 10, starsY + 3, 52, 'chest', PALETTE.gold, () => {
        const save = getSave(this);
        if (save.meta.chest > 0) {
          const opened = openChest(save.meta, save.atp);
          setSave(this, { ...save, meta: opened.progress, atp: opened.atp });
          this.build();
          return;
        }
        this.open({
          title: 'BAÚ DAS ESTRELAS',
          icon: 'chest',
          text: 'Cada estrela nova do caso enche o baú com ATP para o Laboratório e os desbloqueios. Sobreviva 5, 10 e 15 minutos.',
          phase:
            meta.stars >= goals.length
              ? 'CASO COMPLETO'
              : `${meta.stars} DE ${goals.length} ESTRELAS`,
        });
      }),
    );
    if (meta.chest > 0) {
      drawBadge(g, rowX + boxW + 10 + 52 - 12, starsY - 4);
      out.push(
        this.add
          .text(
            rowX + boxW + 10 + 26,
            starsY + 58,
            `+${meta.chest}`,
            labelText(8, PALETTE_CSS.gold),
          )
          .setOrigin(0.5, 0),
      );
    }

    // Trilho direito: Compêndio e Conquistas.
    const railX = colX + colW - 10 - 60;
    const railY = top + 14;
    drawInkBox(g, railX, railY, 60, 140);
    out.push(
      this.iconButton(g, railX + 8, railY + 8, 44, 'book', PALETTE.textLight, () =>
        this.scene.start(SCENES.catalog, { view: 'compendium' }),
      ),
      this.add
        .text(railX + 30, railY + 55, 'COMPÊNDIO', labelText(8, PALETTE_CSS.text))
        .setOrigin(0.5, 0),
      this.iconButton(
        g,
        railX + 8,
        railY + 74,
        44,
        'medal',
        0x5b6380,
        () => this.open(SCREENS.achievements),
        true,
      ),
      this.add
        .text(railX + 30, railY + 121, 'EM BREVE', labelText(8, PALETTE_CSS.textMuted))
        .setOrigin(0.5, 0),
    );
    return out;
  }

  /** Campo longo, JOGAR e o agente escolhido. */
  private actionRow(
    g: Phaser.GameObjects.Graphics,
    w: number,
    colX: number,
    colW: number,
    top: number,
  ): Obj[] {
    g.fillStyle(PALETTE.ink).fillRect(0, top, w, 4);
    g.fillStyle(PALETTE.panelDeep).fillRect(0, top + 4, w, ACTION_H - 4);
    const out: Obj[] = [];
    const base = top + ACTION_H - 14;

    // Campo longo: miniatura do campo vertical numa moldura de madeira.
    const lx = colX + 16;
    const fy = base - 106;
    drawWoodFrame(g, lx, fy, 80, 72);
    drawCreamSlot(g, lx + 6, fy + 6, 68, 60);
    [6, 22, 12].forEach((t, i) => {
      const x = lx + 14 + i * 18;
      g.fillStyle(PALETTE.sand).fillRect(x, fy + 10, 14, 52);
      g.fillStyle(PALETTE.carbon).fillRect(x + 3, fy + 10 + t, 8, 8);
      g.fillStyle(PALETTE.water).fillRect(x + 3, fy + 56, 8, 4);
    });
    // ATP produzido pelo idle esperando coleta: selo com o valor, como no menu.md.
    const pending = Math.floor(getSave(this).idle.pending);
    if (pending > 0) {
      const tag = this.add
        .text(lx + 40, fy - 10, `+${pending}`, {
          ...bodyText(12, PALETTE_CSS.outline),
          fontStyle: '700',
        })
        .setOrigin(0.5, 0);
      g.fillStyle(PALETTE.outline).fillRect(
        lx + 40 - tag.width / 2 - 8,
        fy - 13,
        tag.width + 16,
        21,
      );
      g.fillStyle(PALETTE.gold).fillRect(lx + 40 - tag.width / 2 - 5, fy - 10, tag.width + 10, 15);
      out.push(tag);
    }
    out.push(
      this.add
        .text(lx + 40, fy + 76, 'CAMPO LONGO', labelText(9, PALETTE_CSS.text))
        .setOrigin(0.5, 0),
      this.zone(lx, fy - 14, 80, 106, () => this.scene.start(SCENES.idle)),
    );

    // Agente escolhido.
    const ax = colX + colW - 16 - 80;
    drawWoodFrame(g, ax, fy, 80, 72);
    drawCreamSlot(g, ax + 6, fy + 6, 68, 60);
    const agentId = this.selectedAgent();
    const agent = this.add.image(ax + 40, fy + 36, textureKey(AGENT_TEXTURES[agentId], 3));
    agent.setScale(Math.min(60 / agent.width, 48 / agent.height));
    out.push(
      agent,
      this.add
        .text(
          ax + 40,
          fy + 76,
          `${AGENTS[agentId].name.toUpperCase()} ▸`,
          labelText(9, PALETTE_CSS.text),
        )
        .setOrigin(0.5, 0),
      this.zone(ax, fy, 80, 92, () => this.scene.start(SCENES.catalog, { view: 'agents' })),
    );

    // JOGAR: o botão dominante, entre os dois.
    const px = lx + 80 + 12;
    const pw = ax - 12 - px;
    const py = base - 108;
    const face = this.add.graphics();
    const label = this.add
      .text(
        px + pw / 2,
        0,
        'JOGAR',
        withShadow(
          { ...impactText(42, '#FFFFFF'), stroke: PALETTE_CSS.woodOutline, strokeThickness: 6 },
          PALETTE_CSS.woodOutline,
          4,
        ),
      )
      .setOrigin(0.5, 0);
    const sub = this.add
      .text(
        px + pw / 2,
        0,
        'CAMPO CRÔNICO',
        withShadow(labelText(10, PALETTE_CSS.woodText), PALETTE_CSS.woodOutline, 2),
      )
      .setOrigin(0.5, 0);
    const drawPlay = (pressed: boolean) => {
      face.clear();
      const d = pressed ? 6 : 0;
      if (!pressed) face.fillStyle(PALETTE.outline).fillRect(px, py + 6, pw, 96);
      face.fillStyle(PALETTE.outline).fillRect(px, py + d, pw, 96);
      face.fillStyle(PALETTE.wood).fillRect(px + 4, py + d + 4, pw - 8, 88);
      if (!pressed) face.fillStyle(PALETTE.woodHi).fillRect(px + 4, py + 4, pw - 8, 5);
      face.fillStyle(PALETTE.woodShade).fillRect(px + 4, py + d + 84, pw - 8, 8);
      label.setY(py + d + 14);
      sub.setY(py + d + 64);
    };
    drawPlay(false);
    const zone = this.add
      .zone(px + pw / 2, py + 51, pw, 102)
      .setInteractive({ useHandCursor: true });
    let armed = false;
    zone.on('pointerdown', () => {
      armed = true;
      drawPlay(true);
    });
    zone.on('pointerout', () => {
      armed = false;
      drawPlay(false);
    });
    zone.on('pointerup', () => {
      drawPlay(false);
      if (armed) this.play();
      armed = false;
    });
    out.push(face, label, sub, zone);
    return out;
  }

  /** Barra de 5 abas com ícones; a do meio (Caso) é maior e sobe acima da barra. */
  private tabBar(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
    colX: number,
    colW: number,
  ): Obj[] {
    const top = h - TAB_H;
    g.fillStyle(PALETTE.ink).fillRect(0, top, w, 4);
    g.fillStyle(PALETTE.panel).fillRect(0, top + 4, w, TAB_H - 4);
    g.fillStyle(PALETTE.panelHi).fillRect(0, top + 4, w, 3);

    const tg = this.add.graphics();
    const out: Obj[] = [tg];
    const weights = TABS.map((t) => (t.id === 'case' ? 1.3 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    const inner = colW - 8 - 2 * (TABS.length - 1);
    const bottom = h - 6;
    let x = colX + 4;
    TABS.forEach((t, i) => {
      const tw = Math.floor((inner * weights[i]!) / total);
      const on = t.id === this.tab;
      const mid = t.id === 'case';
      const th = mid ? (on ? 92 : 84) : 62;
      const ty = bottom - th;
      if (mid) {
        tg.fillStyle(PALETTE.outline).fillRect(x, ty, tw, th);
        tg.fillStyle(on ? PALETTE.wood : PALETTE.woodDark).fillRect(x + 4, ty + 4, tw - 8, th - 8);
        tg.fillStyle(on ? PALETTE.woodHi : PALETTE.wood).fillRect(x + 4, ty + 4, tw - 8, 4);
        tg.fillStyle(on ? PALETTE.woodShade : 0x7a3510).fillRect(x + 4, ty + th - 9, tw - 8, 5);
      } else if (on) {
        tg.fillStyle(PALETTE.outline).fillRect(x, ty, tw, th);
        tg.fillStyle(PALETTE.wood).fillRect(x + 3, ty + 3, tw - 6, th - 6);
        tg.fillStyle(PALETTE.woodHi).fillRect(x + 3, ty + 3, tw - 6, 4);
        tg.fillStyle(PALETTE.woodShade).fillRect(x + 3, ty + th - 8, tw - 6, 5);
      }
      const bright = on || mid;
      const pixel = mid ? 4 : 3;
      const iconY = ty + Math.floor((th - (8 * pixel + 4 + 10)) / 2);
      drawIcon(
        tg,
        TAB_ICONS[t.id],
        x + Math.floor((tw - 8 * pixel) / 2),
        iconY,
        bright ? 0xffffff : PALETTE.textSoft,
        pixel,
      );
      const style = bright
        ? withShadow(labelText(9, '#FFFFFF'), PALETTE_CSS.woodOutline, 2)
        : labelText(9, PALETTE_CSS.textSoft);
      out.push(this.add.text(x + tw / 2, iconY + 8 * pixel + 4, t.label, style).setOrigin(0.5, 0));
      if (!on && this.tabHasBadge(t.id)) drawBadge(tg, x + tw - 18, ty + 2, 14);
      out.push(this.zone(x, ty, tw, th, () => this.setTab(t.id)));
      x += tw + 2;
    });
    return out;
  }

  /** Selo "!" na aba quando dá para comprar algo nela agora (docs/menu.md, Selos e avisos). */
  private tabHasBadge(tab: TabId): boolean {
    const { meta, atp } = getSave(this);
    if (tab === 'agents') return unlockAffordable(meta, atp, 'agents');
    if (tab === 'arsenal') {
      return unlockAffordable(meta, atp, 'weapons') || unlockAffordable(meta, atp, 'receptors');
    }
    if (tab === 'lab') return labAffordable(meta, atp);
    return false;
  }

  /** Botão quadrado azul com ícone de pixels (Opções, Recordes, Compêndio, baú). */
  private iconButton(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    icon: IconName,
    color: number,
    onClick: () => void,
    dim = false,
  ): Obj {
    if (dim) {
      drawInkBox(g, x, y, size, size);
    } else {
      g.fillStyle(PALETTE.ink).fillRect(x, y, size, size);
      g.fillStyle(PALETTE.panel).fillRect(x + 4, y + 4, size - 8, size - 8);
      g.fillStyle(PALETTE.panelHi).fillRect(x + 4, y + 4, size - 8, 3);
      g.fillStyle(PALETTE.panelShade).fillRect(x + 4, y + size - 8, size - 8, 4);
    }
    const pixel = size >= 52 ? 4 : 3;
    const offset = Math.floor((size - 8 * pixel) / 2);
    drawIcon(g, icon, x + offset, y + offset, color, pixel);
    return this.zone(x, y, size, size, onClick);
  }

  private zone(x: number, y: number, w: number, h: number, onClick: () => void): Obj {
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerup', onClick);
    return zone;
  }
}
