import * as Phaser from 'phaser';
import {
  AGENTS,
  ECONOMY,
  ENEMIES,
  MAP,
  MAP_ENVIRONMENTS,
  META,
  ORGANISM,
  SECTORS,
  type AgentId,
  type MapEnvironment,
} from '../../config';
import { canEnter, indicatedLocal, localsUnlocked, synergyOf } from '../../core/organism/local';
import { LOCAL_SHORT } from '../ui/locals';
import { claimAchievements } from '../../core/meta/achievements';
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
  BODY_MAP_SIZE,
  BODY_SIZE,
  drawBody,
  drawBodyMap,
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
import { TABS, type SectionDef, type TabId } from '../ui/menuContent';
import { bodyText, formatTime, impactText, labelText, withShadow } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import {
  addZone,
  drawBlueButton,
  drawWoodButton,
  isWideMenu,
  menuMinSize,
  WIDE,
} from '../ui/wide/wideLayout';
import { renderAgentsWide } from '../ui/wide/agentsWide';
import { renderArsenalWide } from '../ui/wide/arsenalWide';
import { renderLabWide } from '../ui/wide/labWide';
import { renderOrganismWide } from '../ui/wide/organismWide';
import { renderCaseAgent, renderCaseGoals } from '../ui/wide/caseWide';
import { isUnlocked } from '../../core/meta/progress';
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
/** Faixa do local acima do JOGAR (fase 5.12). */
const BAND_H = 34;
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
  /** Agente aberto na ficha da aba Agentes no PC. */
  private agentView?: AgentId;
  private size = { w: 0, h: 0 };

  /** Menu no PC (docs/menu.md, Tela larga): trilho de abas à esquerda e colunas. */
  private get wide(): boolean {
    return isWideMenu(this.size.w, this.size.h);
  }

  constructor() {
    super(SCENES.hub);
  }

  create(): void {
    music.setMain('hub');
    this.awayReport = idleRunner.takeReport();
    // Saves de antes das conquistas: o que já estava cumprido sai aqui, sem esperar o fim de uma run.
    const claimed = claimAchievements(getSave(this));
    if (claimed.earned.length > 0) setSave(this, claimed.save);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.title));
    // Aviso de versão nova: só aqui nos menus, uma vez por visita ao hub.
    const unsubscribe = updates.subscribe(() => this.maybePromptUpdate());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    updates.enterHub();
    this.time.delayedCall(300, () => this.maybePromptUpdate());
    this.input.keyboard?.on('keydown-ENTER', () => this.play());
    // Atalhos do menu no PC: 1 a 5 trocam a aba, O abre as Opções e L a escolha do local.
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (!this.wide || this.awayReport) return;
      const index = Number(e.key) - 1;
      if (TABS[index]) this.setTab(TABS[index].id);
      else if (e.key === 'o' || e.key === 'O') this.scene.start(SCENES.options, { fromRun: false });
      else if ((e.key === 'l' || e.key === 'L') && this.localsOpen())
        this.scene.start(SCENES.local);
    });
    setupUiLayout(
      this,
      (w, h) => {
        this.size = { w, h };
        this.build();
      },
      menuMinSize({ width: 390, height: 760 }),
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
    // No PC o JOGAR fica no pé do trilho em toda aba; no celular, só na aba Caso.
    if (this.awayReport) return;
    if (this.tab === 'case' || this.wide) this.scene.start(SCENES.run);
  }

  private localsOpen(): boolean {
    const save = getSave(this);
    return localsUnlocked(save.meta.stars, save.organism);
  }

  private chooseAgent(id: AgentId): void {
    setSave(this, { ...getSave(this), selectedAgent: id });
    this.build();
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

  /** Conteúdo das abas; a aba Caso é o próprio hub. */
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
          getSave(this).idle.agents,
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
          () => this.discharge(),
        );
      case 'case':
        return [];
    }
  }

  /** DAR ALTA: o primeiro toque pede confirmação, o segundo dá a alta. */
  private discharge(): void {
    if (!this.confirmDischarge) {
      this.confirmDischarge = true;
      this.build();
      return;
    }
    this.confirmDischarge = false;
    idleRunner.flush();
    const next = dischargeSave(getSave(this), Date.now());
    if (!next) return;
    // A ALTA conta para as conquistas de casos curados.
    setSave(this, claimAchievements(next).save);
    music.jingle('alta');
    idleRunner.rebuild();
    this.build();
  }

  private open(def: SectionDef): void {
    this.scene.start(SCENES.placeholder, { def });
  }

  private build(): void {
    this.root?.destroy();
    if (this.scroll && this.scrollTab) this.scrollOffsets[this.scrollTab] = this.scroll.offset();
    this.scroll?.destroy();
    this.scroll = undefined;
    if (this.wide) {
      this.buildWide();
      return;
    }
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
      // Faixa do local (fase 5.12): só depois que os locais abrem.
      const save = getSave(this);
      const band = localsUnlocked(save.meta.stars, save.organism) ? BAND_H : 0;
      out.push(...this.caseArea(g, colX, colW, midTop, midBottom - ACTION_H - band));
      if (band > 0) out.push(...this.localBand(g, colX, colW, midBottom - ACTION_H - band));
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

  /** Baú das estrelas: abre se tiver ATP guardado; senão explica como encher. */
  private chest(): void {
    const save = getSave(this);
    const goals = ECONOMY.meta.caseStarMinutes;
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
        save.meta.stars >= goals.length
          ? 'CASO COMPLETO'
          : `${save.meta.stars} DE ${goals.length} ESTRELAS`,
    });
  }

  /**
   * Menu no PC (pranchetas "Menu no PC" do canvas): barra de status no topo, as 5 abas num
   * trilho à esquerda e o conteúdo da aba em colunas, sem rolagem.
   */
  private buildWide(): void {
    const { w, h } = this.size;
    const g = this.add.graphics();
    const out: Obj[] = [g];
    const main = {
      x: WIDE.railW + WIDE.pad,
      y: WIDE.topH + WIDE.pad,
      w: w - WIDE.railW - 2 * WIDE.pad,
      h: h - WIDE.topH - 2 * WIDE.pad,
    };
    drawGrid(g, WIDE.railW, WIDE.topH, w - WIDE.railW, h - WIDE.topH);
    const save = getSave(this);
    const shop = this.shop();
    switch (this.tab) {
      case 'case':
        out.push(...this.wideCase(main));
        break;
      case 'agents': {
        const view = this.agentView ?? this.selectedAgent();
        out.push(
          ...renderAgentsWide(this, main, {
            shop,
            selected: this.selectedAgent(),
            view,
            idleUnlocked: save.idle.agents,
            onView: (id) => {
              this.agentView = id;
              this.build();
            },
            onSelect: (id) => this.chooseAgent(id),
          }),
        );
        break;
      }
      case 'arsenal':
        out.push(...renderArsenalWide(this, main, shop));
        break;
      case 'lab':
        out.push(
          ...renderLabWide(this, main, {
            progress: save.meta,
            atp: save.atp,
            special: AGENTS[this.selectedAgent()].special.kind,
            selected: this.labSelected,
            onSelect: (id) => {
              this.labSelected = id;
              this.build();
            },
            onBuy: (id) => this.buyLabNode(id),
          }),
        );
        break;
      case 'organism':
        out.push(
          ...renderOrganismWide(this, main, save.organism, this.confirmDischarge, () =>
            this.discharge(),
          ),
        );
        break;
    }
    out.push(...this.wideTopBar(g, w));
    out.push(...this.wideRail(h));
    if (this.awayReport) out.push(...this.awayPanel(w, h, this.awayReport));
    this.root = this.add.container(0, 0, out);
  }

  /** Barra de status do PC: retrato, indivíduo e setores, objetivo, ATP e Opções. */
  private wideTopBar(g: Phaser.GameObjects.Graphics, w: number): Obj[] {
    const H = WIDE.topH;
    g.fillStyle(PALETTE.night).fillRect(0, 0, w, H);
    g.fillStyle(PALETTE.ink).fillRect(0, H - 4, w, 4);
    const save = getSave(this);
    const organism = save.organism;
    const px = WIDE.pad;
    drawWoodFrame(g, px, 6, 60, 60);
    g.fillStyle(PALETTE.scanBg).fillRect(px + 7, 13, 46, 46);
    drawBody(g, px + 7 + Math.floor((46 - BODY_SIZE.cols * 2) / 2), 14, 2);
    const tx = px + 76;
    const out: Obj[] = [];
    const ind = this.add.text(
      tx,
      14,
      `INDIVÍDUO ${organism.individual}`,
      labelText(13, PALETTE_CSS.text),
    );
    out.push(
      ind,
      this.add.text(
        tx + ind.width + 10,
        17,
        illnessName(organism.individual).toUpperCase(),
        labelText(10, PALETTE_CSS.numberHurt),
      ),
    );
    let bx = tx;
    SECTOR_ORDER.forEach((sector) => {
      const value = Math.round(organism.sectors[sector]);
      out.push(
        this.add.text(bx, 42, SECTOR_STYLE[sector].label, labelText(9, PALETTE_CSS.textSoft)),
      );
      g.fillStyle(PALETTE.ink).fillRect(bx + 12, 41, 44, 12);
      g.fillStyle(PALETTE.panelDeep).fillRect(bx + 14, 43, 40, 8);
      g.fillStyle(SECTOR_STYLE[sector].color).fillRect(
        bx + 14,
        43,
        Math.round((40 * value) / 100),
        8,
      );
      out.push(this.add.text(bx + 60, 39, String(value), bodyText(12, PALETTE_CSS.text)));
      bx += 60 + 26;
    });
    out.push(
      this.add.text(
        bx,
        36,
        `${Math.round(averageHealth(organism))}%`,
        withShadow({ ...bodyText(17, '#FFFFFF'), fontStyle: '700' }, PALETTE_CSS.ink, 2),
      ),
    );

    // Opções e ATP à direita.
    const ox = w - WIDE.pad - 48;
    drawBlueButton(g, ox, 14, 48, 48);
    drawIcon(g, 'menu', ox + 12, 26, PALETTE.textLight, 3);
    out.push(
      addZone(this, ox, 14, 48, 48, () => this.scene.start(SCENES.options, { fromRun: false })),
    );
    const atp = this.add.text(
      0,
      18,
      save.atp.toLocaleString('pt-BR'),
      withShadow({ ...bodyText(20, '#FFFFFF'), fontStyle: '700' }, PALETTE_CSS.ink, 3),
    );
    const chipW = 8 + 24 + 8 + Math.max(atp.width, 30) + 12;
    const chipX = ox - 12 - chipW;
    drawBlueButton(g, chipX, 12, chipW, 52);
    drawCoin(g, chipX + 10, 26, 24);
    atp.setX(chipX + 42);
    out.push(atp, this.add.text(chipX + 42, 42, 'ATP', labelText(9, PALETTE_CSS.gold)));

    // Objetivo no meio: a próxima estrela do caso.
    const best = save.records.bestTimeSeconds;
    const next = ECONOMY.meta.caseStarMinutes.find((m) => best < m * 60);
    const left = bx + 70;
    const right = chipX - 20;
    const ow = Math.min(420, right - left);
    if (ow > 160) {
      const sx = Math.floor(left + (right - left - ow) / 2);
      drawWoodFrame(g, sx, 15, ow, 46);
      g.fillStyle(PALETTE.panelDeep).fillRect(sx + 7, 22, ow - 14, 32);
      out.push(
        this.add.text(
          sx + 16,
          26,
          next ? `PRÓXIMA ESTRELA: ${next} MIN` : 'CASO COMPLETO',
          labelText(10, PALETTE_CSS.text),
        ),
        this.add
          .text(
            sx + ow - 16,
            25,
            next ? `faltam ${formatTime(next * 60 - best)}` : '3 estrelas',
            bodyText(12, PALETTE_CSS.textSoft),
          )
          .setOrigin(1, 0),
      );
      const progress = next ? Math.min(1, best / (next * 60)) : 1;
      const barW = ow - 32;
      g.fillStyle(PALETTE.panel).fillRect(sx + 16, 42, barW, 6);
      g.fillStyle(PALETTE.progress).fillRect(sx + 16, 42, Math.round(barW * progress), 6);
      g.fillStyle(PALETTE.progressShade).fillRect(sx + 16, 46, Math.round(barW * progress), 2);
    }
    return out;
  }

  /** Trilho de abas do PC: as 5 abas com a tecla, os atalhos e o JOGAR compacto no pé. */
  private wideRail(h: number): Obj[] {
    const W = WIDE.railW;
    const top = WIDE.topH;
    const g = this.add.graphics();
    g.fillStyle(PALETTE.panelDeep).fillRect(0, top, W, h - top);
    g.fillStyle(PALETTE.ink).fillRect(W - 4, top, 4, h - top);
    const out: Obj[] = [g];
    const x = 12;
    const iw = W - 4 - 24;
    let y = top + 16;
    out.push(this.add.text(x + 4, y, 'SEÇÕES', labelText(10, PALETTE_CSS.muted)));
    y += 20;
    TABS.forEach((t, i) => {
      const on = t.id === this.tab;
      const mid = t.id === 'case';
      if (on) drawWoodButton(g, x, y, iw, 52);
      else if (mid) drawWoodButton(g, x, y, iw, 52, true);
      const bright = on || mid;
      drawIcon(g, TAB_ICONS[t.id], x + 10, y + 14, bright ? 0xffffff : PALETTE.textSoft, 3);
      const name =
        t.id === 'lab' ? 'Laboratório' : t.label.charAt(0) + t.label.slice(1).toLowerCase();
      out.push(
        this.add
          .text(
            x + 44,
            y + 26,
            name,
            bright
              ? withShadow(
                  { ...bodyText(15, '#FFFFFF'), fontStyle: '700' },
                  PALETTE_CSS.woodOutline,
                  2,
                )
              : { ...bodyText(15, PALETTE_CSS.textSoft), fontStyle: '700' },
          )
          .setOrigin(0, 0.5),
      );
      // Tecla do atalho num quadradinho.
      const kx = x + iw - 30;
      g.fillStyle(bright ? PALETTE.outline : PALETTE.panelHi).fillRect(kx, y + 16, 20, 20);
      g.fillStyle(bright ? (on ? PALETTE.wood : PALETTE.woodDark) : PALETTE.panelDeep).fillRect(
        kx + 2,
        y + 18,
        16,
        16,
      );
      out.push(
        this.add
          .text(
            kx + 10,
            y + 26,
            String(i + 1),
            labelText(9, bright ? '#FFFFFF' : PALETTE_CSS.muted),
          )
          .setOrigin(0.5),
      );
      if (!on && this.tabHasBadge(t.id)) drawBadge(g, kx - 22, y + 4, 16);
      out.push(addZone(this, x, y, iw, 52, () => this.setTab(t.id)));
      y += 58;
    });

    y += 10;
    out.push(this.add.text(x + 4, y, 'ATALHOS', labelText(10, PALETTE_CSS.muted)));
    y += 20;
    const save = getSave(this);
    const shortcut = (
      label: string,
      icon: IconName,
      color: number,
      right: string,
      onClick: () => void,
    ) => {
      drawBlueButton(g, x, y, iw, 40);
      drawIcon(g, icon, x + 12, y + 12, color, 2);
      out.push(
        this.add
          .text(x + 36, y + 20, label, { ...bodyText(14, PALETTE_CSS.text), fontStyle: '600' })
          .setOrigin(0, 0.5),
        this.add.text(x + iw - 12, y + 20, right, bodyText(12, PALETTE_CSS.gold)).setOrigin(1, 0.5),
        addZone(this, x, y, iw, 40, onClick),
      );
      y += 46;
    };
    shortcut('Compêndio', 'book', PALETTE.textLight, '', () =>
      this.scene.start(SCENES.compendium, {}),
    );
    shortcut(
      'Conquistas',
      'medal',
      PALETTE.gold,
      `${save.achievements.length}/${META.achievements.length}`,
      () => this.scene.start(SCENES.catalog, { view: 'achievements' }),
    );
    shortcut('Recordes', 'trophy', PALETTE.gold, '', () => this.scene.start(SCENES.records));

    // Pé do trilho: no Caso, as teclas (o JOGAR grande está no meio); nas outras abas, JOGAR.
    const bottom = h - 14;
    if (this.tab === 'case') {
      const hints = [
        '1 A 5 TROCAM A ABA',
        `ENTER JOGA${this.localsOpen() ? ' · L LOCAL' : ''}`,
        'ESC VOLTA AO TÍTULO',
      ];
      const bh = hints.length * 16 + 16;
      const by = bottom - bh;
      if (by > y + 6) {
        g.fillStyle(PALETTE.panelHi);
        for (let dx = 0; dx < iw; dx += 8) {
          g.fillRect(x + dx, by, 4, 2).fillRect(x + dx, by + bh - 2, 4, 2);
        }
        for (let dy = 0; dy < bh; dy += 8) {
          g.fillRect(x, by + dy, 2, 4).fillRect(x + iw - 2, by + dy, 2, 4);
        }
        hints.forEach((t, i) =>
          out.push(this.add.text(x + 10, by + 10 + i * 16, t, labelText(8, PALETTE_CSS.muted))),
        );
      }
    } else {
      const agent = AGENTS[this.selectedAgent()].name.toUpperCase();
      out.push(...this.playButton(x, Math.max(y + 8, bottom - 76), iw, 72, 30, `${agent} · ENTER`));
    }
    return out;
  }

  /** JOGAR do PC: botão de madeira com sombra que afunda ao apertar. */
  private playButton(
    px: number,
    py: number,
    pw: number,
    ph: number,
    size: number,
    subText: string,
  ): Obj[] {
    const face = this.add.graphics();
    const label = this.add
      .text(
        px + pw / 2,
        0,
        'JOGAR',
        withShadow(
          { ...impactText(size, '#FFFFFF'), stroke: PALETTE_CSS.woodOutline, strokeThickness: 6 },
          PALETTE_CSS.woodOutline,
          4,
        ),
      )
      .setOrigin(0.5, 0);
    const sub = this.add
      .text(
        px + pw / 2,
        0,
        subText,
        withShadow(labelText(9, PALETTE_CSS.woodText), PALETTE_CSS.woodOutline, 2),
      )
      .setOrigin(0.5, 0);
    const bodyH = ph - 6;
    const draw = (pressed: boolean) => {
      face.clear();
      const d = pressed ? 6 : 0;
      if (!pressed) face.fillStyle(PALETTE.outline).fillRect(px, py + 6, pw, bodyH);
      face.fillStyle(PALETTE.outline).fillRect(px, py + d, pw, bodyH);
      face.fillStyle(PALETTE.wood).fillRect(px + 4, py + d + 4, pw - 8, bodyH - 8);
      if (!pressed) face.fillStyle(PALETTE.woodHi).fillRect(px + 4, py + 4, pw - 8, 5);
      face.fillStyle(PALETTE.woodShade).fillRect(px + 4, py + d + bodyH - 12, pw - 8, 8);
      const block = label.height + sub.height - 4;
      const ty = py + d + Math.floor((bodyH - 8 - block) / 2);
      label.setY(ty);
      sub.setY(ty + label.height - 4);
    };
    draw(false);
    const zone = this.add
      .zone(px + pw / 2, py + ph / 2, pw, ph)
      .setInteractive({ useHandCursor: true });
    let armed = false;
    zone.on('pointerdown', () => {
      armed = true;
      draw(true);
    });
    zone.on('pointerout', () => {
      armed = false;
      draw(false);
    });
    zone.on('pointerup', () => {
      draw(false);
      if (armed) this.scene.start(SCENES.run);
      armed = false;
    });
    return [face, label, sub, zone];
  }

  /** Aba Caso no PC: agente à esquerda, o caso e o JOGAR no meio, metas à direita. */
  private wideCase(main: { x: number; y: number; w: number; h: number }): Obj[] {
    // Colunas do lado crescem um pouco em telas muito largas; o meio fica com o resto.
    const side = Math.max(288, Math.min(400, Math.floor((main.w - 600 - 2 * WIDE.gap) / 2)));
    const save = getSave(this);
    const out: Obj[] = [];
    out.push(
      ...renderCaseAgent(this, { x: main.x, y: main.y, w: side, h: main.h }, save, {
        selected: this.selectedAgent(),
        onPick: (id) => {
          if (isUnlocked(save.meta, 'agents', id)) this.chooseAgent(id);
          else {
            this.agentView = id;
            this.setTab('agents');
          }
        },
        onOpenSheet: () => {
          this.agentView = this.selectedAgent();
          this.setTab('agents');
        },
      }),
      ...renderCaseGoals(
        this,
        { x: main.x + main.w - side, y: main.y, w: side, h: main.h },
        save,
        () => this.setTab('organism'),
        () => this.scene.start(SCENES.catalog, { view: 'achievements' }),
        () => this.scene.start(SCENES.records),
      ),
    );
    const cx = main.x + side + WIDE.gap;
    const cw = main.w - 2 * (side + WIDE.gap);
    out.push(...this.wideCaseCenter(cx, main.y, cw, main.h));
    return out;
  }

  /** Centro do Caso no PC: caso anterior, distintivo, scanner, estrelas e baú, local e JOGAR. */
  private wideCaseCenter(x: number, y: number, w: number, h: number): Obj[] {
    const g = this.add.graphics();
    const out: Obj[] = [g];
    const save = getSave(this);
    const organism = save.organism;
    const mid = x + w / 2;
    let cy = y;

    // Último caso curado, numa etiqueta.
    const last = save.cases[save.cases.length - 1];
    if (last) {
      const t = this.add.text(
        0,
        cy + 5,
        `Caso ${last.individual} · ${illnessName(last.individual)} · ${last.runs} runs · ${formatTime(last.bestTimeSeconds)}`,
        bodyText(12, PALETTE_CSS.textSoft),
      );
      const tag = this.add.text(0, cy + 7, 'ALTA', labelText(8, PALETTE_CSS.numberHeal));
      const tw = tag.width + 8 + t.width + 16;
      const tx = Math.floor(mid - tw / 2);
      drawInkBox(g, tx, cy, tw, 24, PALETTE.panelDeep);
      tag.setX(tx + 8);
      t.setX(tx + 8 + tag.width + 8);
      out.push(tag, t);
      cy += 32;
    }

    // Distintivo e nome do caso.
    const title = this.add.text(
      0,
      cy,
      illnessName(organism.individual),
      withShadow(impactText(30, '#FFFFFF'), PALETTE_CSS.outline, 3),
    );
    const rowW = 36 + 10 + title.width;
    const rx = Math.floor(mid - rowW / 2);
    drawShield(g, rx, cy, 36, 40);
    out.push(
      this.add
        .text(rx + 18, cy + 4, String(organism.individual), impactText(21, PALETTE_CSS.cyan))
        .setOrigin(0.5, 0),
    );
    title.setPosition(rx + 46, cy + 2);
    out.push(title);
    cy += 46;
    const best = save.records.bestTimeSeconds;
    out.push(
      this.add
        .text(
          mid,
          cy,
          `Melhor: ${formatTime(best)}`,
          withShadow(
            { ...bodyText(17, PALETTE_CSS.gold), fontStyle: '700' },
            PALETTE_CSS.outline,
            2,
          ),
        )
        .setOrigin(0.5, 0),
    );
    cy += 30;

    // Pé: local (quando abre) e a linha do campo longo com o JOGAR.
    const playH = 96;
    const playY = y + h - playH - 6;
    const localH = this.localsOpen() ? BAND_H : 0;
    const localY = playY - 12 - localH;

    // Scanner com os locais (o indicado em vermelho) e, ao lado, estrelas e baú.
    const scanH = Math.max(140, Math.min(288, localY - 12 - cy));
    // O grupo do scanner fica no meio do espaço livre entre o título e o local.
    cy += Math.max(0, Math.floor((localY - 12 - cy - scanH) / 2));
    const pixel = Math.max(2, Math.min(6, Math.floor((scanH - 16) / BODY_MAP_SIZE.rows)));
    const scanW = Math.max(BODY_MAP_SIZE.cols * pixel + 28, Math.round((scanH * 168) / 288));
    const starsW = 3 * 28 + 2 * 14 + 24;
    const groupW = scanW + 24 + starsW;
    const sx = Math.floor(mid - groupW / 2);
    g.fillStyle(PALETTE.ink).fillRect(sx, cy, scanW, scanH);
    g.fillStyle(PALETTE.scanEdge).fillRect(sx + 4, cy + 4, scanW - 8, scanH - 8);
    g.fillStyle(PALETTE.scanBg).fillRect(sx + 6, cy + 6, scanW - 12, scanH - 12);
    g.fillStyle(PALETTE.scanLine);
    for (let ly = cy + 6; ly < cy + scanH - 6; ly += 6) g.fillRect(sx + 6, ly, scanW - 12, 2);
    const indicated = indicatedLocal(organism);
    drawBodyMap(
      g,
      Math.floor(sx + (scanW - BODY_MAP_SIZE.cols * pixel) / 2),
      Math.floor(cy + (scanH - BODY_MAP_SIZE.rows * pixel) / 2),
      pixel,
      (env) => (env === indicated ? PALETTE.interaction : PALETTE.bodyFill),
    );
    const lowest = [...SECTORS].sort((a, b) => organism.sectors[a] - organism.sectors[b])[0]!;
    out.push(
      this.add.text(sx + 10, cy + 10, 'SCAN', labelText(8, PALETTE_CSS.cyan)),
      this.add
        .text(
          sx + scanW - 10,
          cy + scanH - 10,
          `${ORGANISM.sectors[lowest].name.toUpperCase()} ${Math.round(organism.sectors[lowest])}`,
          labelText(8, PALETTE_CSS.alert),
        )
        .setOrigin(1, 1),
    );
    const goals = ECONOMY.meta.caseStarMinutes;
    const stX = sx + scanW + 24;
    const stY = cy + Math.floor(scanH / 2) - 80;
    drawInkBox(g, stX, stY, starsW, 60, PALETTE.panelDeep);
    goals.forEach((m, i) => {
      const px = stX + 12 + i * 42;
      drawStar(g, px, stY + 8, 28, i < save.meta.stars || best >= m * 60);
      out.push(
        this.add
          .text(px + 14, stY + 40, `${m} MIN`, labelText(8, PALETTE_CSS.textSoft))
          .setOrigin(0.5, 0),
      );
    });
    const nextStar = goals.find((m) => best < m * 60);
    out.push(
      this.add
        .text(
          stX + starsW / 2,
          stY + 70,
          nextStar ? `Próxima estrela: ${nextStar} min` : 'Caso completo',
          bodyText(12, PALETTE_CSS.textSoft),
        )
        .setOrigin(0.5, 0),
    );
    const chestX = Math.floor(stX + starsW / 2 - 28);
    out.push(this.iconButton(g, chestX, stY + 98, 56, 'chest', PALETTE.gold, () => this.chest()));
    if (save.meta.chest > 0) {
      drawBadge(g, chestX + 44, stY + 92, 16);
      out.push(
        this.add
          .text(chestX + 28, stY + 158, `+${save.meta.chest}`, labelText(8, PALETTE_CSS.gold))
          .setOrigin(0.5, 0),
      );
    }

    if (localH > 0) out.push(...this.localBand(g, x - 12, w + 24, localY));

    // Campo longo e JOGAR.
    const fy = playY + 14;
    drawWoodFrame(g, x, fy, 88, 76);
    drawCreamSlot(g, x + 6, fy + 6, 76, 64);
    [6, 24, 12].forEach((t, i) => {
      const lx = x + 16 + i * 20;
      g.fillStyle(PALETTE.sand).fillRect(lx, fy + 10, 14, 56);
      g.fillStyle(PALETTE.carbon).fillRect(lx + 3, fy + 10 + t, 8, 8);
      g.fillStyle(PALETTE.water).fillRect(lx + 3, fy + 60, 8, 4);
    });
    const pending = Math.floor(save.idle.pending);
    if (pending > 0) {
      const tag = this.add
        .text(x + 44, fy - 10, `+${pending}`, {
          ...bodyText(13, PALETTE_CSS.outline),
          fontStyle: '700',
        })
        .setOrigin(0.5, 0);
      g.fillStyle(PALETTE.outline).fillRect(
        x + 44 - tag.width / 2 - 8,
        fy - 13,
        tag.width + 16,
        22,
      );
      g.fillStyle(PALETTE.gold).fillRect(x + 44 - tag.width / 2 - 5, fy - 10, tag.width + 10, 16);
      out.push(tag);
    }
    out.push(
      this.add
        .text(x + 44, fy + 80, 'CAMPO LONGO', labelText(8, PALETTE_CSS.text))
        .setOrigin(0.5, 0),
      addZone(this, x, fy - 14, 88, 108, () => this.scene.start(SCENES.idle)),
    );
    out.push(...this.playButton(x + 88 + 12, playY, w - 100, playH, 46, 'CAMPO CRÔNICO · ENTER'));
    return out;
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

    // Casos anteriores (fase 5.16): os dois últimos curados, logo acima das estrelas.
    const cases = getSave(this).cases.slice(-2).reverse();
    const casesH = cases.length * 14;
    const casesTop = starsY - 6 - casesH;
    cases.forEach((c, i) => {
      out.push(
        this.add
          .text(
            cx,
            casesTop + i * 14,
            `✓ CASO ${c.individual} · ${illnessName(c.individual).toUpperCase()} · ${c.runs} RUNS · MELHOR ${formatTime(c.bestTimeSeconds)}`,
            labelText(8, PALETTE_CSS.textMuted),
          )
          .setOrigin(0.5, 0),
      );
    });

    // Scanner do organismo, do tamanho que couber entre o título e as estrelas.
    const scanTop = top + 86;
    const scanH = Math.max(110, Math.min(198, casesTop - 8 - scanTop));
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
      this.iconButton(g, rowX + boxW + 10, starsY + 3, 52, 'chest', PALETTE.gold, () =>
        this.chest(),
      ),
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
        this.scene.start(SCENES.compendium, {}),
      ),
      this.add
        .text(railX + 30, railY + 55, 'COMPÊNDIO', labelText(8, PALETTE_CSS.text))
        .setOrigin(0.5, 0),
      this.iconButton(g, railX + 8, railY + 74, 44, 'medal', PALETTE.gold, () =>
        this.scene.start(SCENES.catalog, { view: 'achievements' }),
      ),
      this.add
        .text(
          railX + 30,
          railY + 121,
          `${getSave(this).achievements.length}/${META.achievements.length}`,
          labelText(8, PALETTE_CSS.gold),
        )
        .setOrigin(0.5, 0),
    );
    return out;
  }

  /**
   * Faixa do local acima do JOGAR (fase 5.12, prancheta "Escolha do local"): o local escolhido e
   * o que o par rende (✚ e o setor, ⊘ quando o agente não entra). O toque abre a escolha.
   */
  private localBand(g: Phaser.GameObjects.Graphics, colX: number, colW: number, y: number): Obj[] {
    const save = getSave(this);
    const agent = AGENTS[this.selectedAgent()];
    const choice = save.selectedLocal as MapEnvironment | 'random';
    const random = choice === 'random' || !MAP_ENVIRONMENTS.includes(choice);
    const x = colX + 12;
    const w = colW - 24;
    const bh = BAND_H - 6;
    let edge: number = PALETTE.scanEdge;
    let text = '';
    let color: string = PALETTE_CSS.textSoft;
    let icon: 'synergy' | 'barrier' | null = null;
    if (!random && !canEnter(agent, choice)) {
      edge = PALETTE.interaction;
      icon = 'barrier';
      text = '→ CORRENTE';
      color = PALETTE_CSS.alert;
    } else if (!random && synergyOf(agent, choice)) {
      edge = PALETTE.buff;
      icon = 'synergy';
      text = ORGANISM.sectors[synergyOf(agent, choice)!].name.toUpperCase();
      color = PALETTE_CSS.numberHeal;
    } else if (random) {
      text = `+${Math.round(MAP.locals.randomAtpBonus * 100)}% ATP`;
      color = PALETTE_CSS.gold;
    }
    g.fillStyle(PALETTE.ink).fillRect(x, y, w, bh);
    g.fillStyle(edge).fillRect(x + 3, y + 3, w - 6, bh - 6);
    g.fillStyle(PALETTE.scanBg).fillRect(x + 5, y + 5, w - 10, bh - 10);
    drawIcon(g, 'local', x + 10, y + 6, PALETTE.wood, 2);
    const name = this.add.text(
      x + 32,
      y + 8,
      random ? 'QUALQUER LUGAR' : LOCAL_SHORT[choice],
      labelText(11, PALETTE_CSS.text),
    );
    const out: Obj[] = [name];
    let tx = x + 32 + name.width + 10;
    if (icon) {
      drawIcon(g, icon, tx, y + 6, icon === 'synergy' ? PALETTE.buff : PALETTE.interaction, 2);
      tx += 22;
    }
    if (text) out.push(this.add.text(tx, y + 8, text, labelText(11, color)));
    out.push(
      this.add.text(x + w - 18, y + 8, '▸', labelText(11, PALETTE_CSS.textSoft)),
      this.zone(x, y, w, bh, () => this.scene.start(SCENES.local)),
    );
    // Aviso de que os locais abriram, até a primeira visita à tela.
    if (!save.localsAnnounced) {
      drawBadge(g, x + w - 14, y - 6, 14);
      out.push(
        this.add
          .text(x + w - 22, y - 6, 'NOVO: ESCOLHA ONDE AGIR', labelText(8, PALETTE_CSS.gold))
          .setOrigin(1, 0),
      );
    }
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
