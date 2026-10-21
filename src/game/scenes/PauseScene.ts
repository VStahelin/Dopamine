import * as Phaser from 'phaser';
import { waveAt } from '../../core/run/progression';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { arsenalRows, runRows, statRows, type PauseRow } from '../ui/pauseContent';
import { safeAreaUi } from '../ui/safeArea';
import { formatTime, impactText, labelText, withShadow } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

type Tab = 'arsenal' | 'stats' | 'run';

const TABS: [Tab, string][] = [
  ['arsenal', 'ARSENAL'],
  ['stats', 'ATRIBUTOS'],
  ['run', 'RUN'],
];

/** Deitada e com esta largura lógica, a pausa mostra Arsenal e Atributos lado a lado. */
const WIDE = 560;
const PAD = 10;

/** Lista rolável de linhas dentro de um painel; mostra só as linhas inteiras. */
interface Scroller {
  rows: PauseRow[];
  x: number;
  y: number;
  width: number;
  height: number;
  offset: number;
  total: number;
}

/**
 * Pausa com status (docs/ui-cronico.md, prancheta "Crônico: pausa e status"): cabeçalho,
 * interações, abas Arsenal, Atributos e Run, e os botões Continuar, Opções e Desistir. Em tela
 * larga, Arsenal e Atributos ficam lado a lado.
 */
export class PauseScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private tab: Tab = 'arsenal';
  private size = { w: 0, h: 0 };
  private scrollers: Scroller[] = [];

  constructor() {
    super(SCENES.pause);
  }

  private get runScene(): RunScene {
    return this.scene.get(SCENES.run) as RunScene;
  }

  create(): void {
    this.tab = 'arsenal';
    this.input.keyboard?.on('keydown-ESC', () => this.runScene.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.runScene.togglePause());
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.scrollAt(p, dy * 0.5);
    });
    let last: { x: number; y: number } | undefined;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (last = { x: p.x, y: p.y }));
    this.input.on('pointerup', () => (last = undefined));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!last || !p.isDown) return;
      const dy = (last.y - p.y) / this.cameras.main.zoom;
      last = { x: p.x, y: p.y };
      this.scrollAt(p, dy);
    });
    // Volta das Opções: refaz a tela (o FPS pode ter mudado).
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.build());
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
  }

  private build(): void {
    this.root?.destroy();
    this.scrollers = [];
    const run = this.runScene.run;
    const { w, h } = this.size;
    const safe = safeAreaUi(this.cameras.main.zoom);
    const wide = w > h && w >= WIDE;
    const width = Math.min(wide ? 860 : 480, w - safe.left - safe.right - 24);
    const left = Math.floor((w - width) / 2);
    const top = safe.top + 14;
    const children: Phaser.GameObjects.GameObject[] = [addDim(this, w, h, 0.8)];

    // Cabeçalho.
    const wave = waveAt(run.time, run.rules.economy.difficulty);
    const agent = run.rules.agents[run.agentId].name.toUpperCase();
    children.push(
      this.add
        .text(
          w / 2,
          top,
          'PAUSADO',
          withShadow(impactText(28, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 3),
        )
        .setOrigin(0.5, 0),
      this.add
        .text(
          w / 2,
          top + 36,
          `${agent} · NV ${run.level} · ${formatTime(run.time)} · ONDA ${wave.wave}`,
          labelText(9, PALETTE_CSS.textSoft),
        )
        .setOrigin(0.5, 0),
    );

    // Faixa de status: interações com o número, e decompostas.
    const sy = top + 54;
    const g = this.add.graphics();
    children.push(g);
    g.fillStyle(PALETTE.ink).fillRect(left, sy, width, 48);
    g.fillStyle(PALETTE.panel).fillRect(left + 3, sy + 3, width - 6, 42);
    const max = run.stats.maxInteractions;
    children.push(
      this.add.text(
        left + 12,
        sy + 9,
        `INTERAÇÕES ${Math.ceil(run.agent.interactions)}/${Math.round(max)}`,
        labelText(9, PALETTE_CSS.textSoft),
      ),
      this.add
        .text(
          left + width - 12,
          sy + 9,
          Math.floor(run.atp).toLocaleString('pt-BR'),
          impactText(15, PALETTE_CSS.white),
        )
        .setOrigin(1, 0),
      this.add
        .text(
          left + width - 12,
          sy + 28,
          `${run.kills.toLocaleString('pt-BR')} DECOMPOSTAS`,
          labelText(8, PALETTE_CSS.textSoft),
        )
        .setOrigin(1, 0),
    );
    // Moeda à esquerda do número de ATP, como na prancheta.
    const atpW = (children[children.length - 2] as Phaser.GameObjects.Text).width;
    const cx = left + width - 12 - atpW - 18;
    g.fillStyle(PALETTE.goldDark).fillRect(cx, sy + 10, 12, 12);
    g.fillStyle(PALETTE.gold).fillRect(cx + 2, sy + 12, 8, 8);
    const barW = Math.min(220, width - 130);
    const bx = left + 12;
    const by = sy + 24;
    g.fillStyle(PALETTE.outline).fillRect(bx, by, barW, 16);
    g.fillStyle(PALETTE.woodDark).fillRect(bx + 2, by + 2, barW - 4, 12);
    g.fillStyle(PALETTE.panelDeep).fillRect(bx + 4, by + 4, barW - 8, 8);
    const filled = (run.agent.interactions / max) * 10;
    const pip = (barW - 8 - 2 * 11) / 10;
    for (let i = 0; i < 10; i++) {
      const color =
        i < Math.floor(filled)
          ? PALETTE.interaction
          : i < filled
            ? PALETTE.interactionLight
            : PALETTE.panel;
      g.fillStyle(color).fillRect(Math.round(bx + 6 + i * (pip + 2)), by + 5, Math.floor(pip), 6);
    }

    // Botões de baixo: em pé, Continuar em cima e os outros dois embaixo; deitado, numa linha.
    const buttonsH = wide ? 40 : 48 + 8 + 40;
    const bottom = h - safe.bottom - 12;
    const continueW = wide ? Math.floor(width * 0.4) : width;
    const restX = wide ? left + continueW + 8 : left;
    const restW = wide ? width - continueW - 8 : width;
    const half = Math.floor((restW - 8) / 2);
    children.push(
      addButton(this, {
        x: left,
        y: bottom - buttonsH,
        width: continueW,
        height: wide ? 40 : 48,
        label: 'CONTINUAR',
        fontSize: wide ? 15 : 18,
        onClick: () => this.runScene.togglePause(),
      }),
      addButton(this, {
        x: restX,
        y: bottom - 40,
        width: half,
        height: 40,
        label: 'OPÇÕES',
        fontSize: 12,
        variant: 'secondary',
        onClick: () => {
          this.scene.launch(SCENES.options, { fromRun: true });
          this.scene.sleep();
        },
      }),
      addButton(this, {
        x: restX + half + 8,
        y: bottom - 40,
        width: restW - half - 8,
        height: 40,
        label: 'DESISTIR',
        fontSize: 12,
        variant: 'danger',
        onClick: () => this.runScene.giveUp(),
      }),
    );

    // Abas (só no celular) e o painel de conteúdo.
    let panelTop = sy + 58;
    const panelBottom = bottom - buttonsH - 10;
    const best = getSave(this).records.bestTimeSeconds;
    if (!wide) {
      const tw = Math.floor((width - 12) / 3);
      TABS.forEach(([id, label], i) => {
        children.push(
          addButton(this, {
            x: left + i * (tw + 6),
            y: panelTop,
            width: i === 2 ? width - 2 * (tw + 6) : tw,
            height: 44,
            label,
            fontSize: 11,
            variant: id === this.tab ? 'primary' : 'secondary',
            onClick: () => {
              this.tab = id;
              this.build();
            },
          }),
        );
      });
      panelTop += 54;
      const rows =
        this.tab === 'arsenal'
          ? arsenalRows(run)
          : this.tab === 'stats'
            ? statRows(run)
            : runRows(run, best);
      this.addPanel(
        children,
        rows.map((b) => b(this, width - PAD * 2 - 6)),
        left,
        panelTop,
        width,
        panelBottom - panelTop,
      );
    } else {
      const colW = Math.floor((width - 10) / 2);
      const inner = colW - PAD * 2 - 6;
      this.addPanel(
        children,
        arsenalRows(run).map((b) => b(this, inner)),
        left,
        panelTop,
        colW,
        panelBottom - panelTop,
      );
      const right = [...statRows(run), ...runRows(run, best)].map((b) => b(this, inner));
      this.addPanel(
        children,
        right,
        left + colW + 10,
        panelTop,
        width - colW - 10,
        panelBottom - panelTop,
      );
    }
    this.root = this.add.container(0, 0, children);
    for (const s of this.scrollers) this.place(s);
  }

  /** Painel noite com moldura vinho e as linhas roláveis dentro. */
  private addPanel(
    children: Phaser.GameObjects.GameObject[],
    rows: PauseRow[],
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(x, y, width, height);
    g.fillStyle(PALETTE.night).fillRect(x + 3, y + 3, width - 6, height - 6);
    children.splice(1, 0, g);
    const scroller: Scroller = {
      rows,
      x: x + 3 + PAD,
      y: y + 3 + PAD,
      width: width - 6 - PAD * 2,
      height: height - 6 - PAD * 2,
      offset: 0,
      total: rows.reduce((sum, r) => sum + r.height, 0),
    };
    for (const r of rows) children.push(r.container);
    this.scrollers.push(scroller);
  }

  /** Posiciona as linhas com a rolagem atual; linhas cortadas pela borda ficam escondidas. */
  private place(s: Scroller): void {
    let y = s.y - s.offset;
    for (const r of s.rows) {
      r.container.setPosition(s.x, y);
      r.container.setVisible(y >= s.y - 1 && y + r.height - 6 <= s.y + s.height + 1);
      y += r.height;
    }
  }

  private scrollAt(pointer: Phaser.Input.Pointer, dy: number): void {
    const zoom = this.cameras.main.zoom;
    const px = pointer.x / zoom;
    const py = pointer.y / zoom;
    for (const s of this.scrollers) {
      const inside =
        px >= s.x - PAD &&
        px <= s.x + s.width + PAD &&
        py >= s.y - PAD &&
        py <= s.y + s.height + PAD;
      if (!inside) continue;
      const max = Math.max(0, s.total - s.height);
      s.offset = Phaser.Math.Clamp(s.offset + dy, 0, max);
      this.place(s);
    }
  }
}
