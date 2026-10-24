import * as Phaser from 'phaser';
import { music } from '../audio/music';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import {
  categoryCard,
  categoryCount,
  drawArt,
  drawSlot,
  entryDetail,
  entryRow,
  newTag,
  sectionHead,
  tapZone,
} from '../ui/compendium/draw';
import {
  buildCompendium,
  registryTotals,
  searchCompendium,
  seenKeys,
  type CompendiumCategory,
  type CompendiumEntry,
} from '../ui/compendium/model';
import { addHtmlInput, type HtmlInput } from '../ui/htmlInput';
import { drawGrid, drawInkBox } from '../ui/icons';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { drawFramedPanel, isWideMenu, menuMinSize } from '../ui/wide/wideLayout';
import { SCENES } from './keys';

type Obj = Phaser.GameObjects.GameObject;
type Screen = 'index' | 'list' | 'entry';
type Filter = 'all' | 'seen' | 'new';

const SEARCH_HINT = 'Buscar molécula, arma, termo...';

/**
 * Compêndio (pranchetas "Compêndio" e "Compêndio no PC"): o registro de tudo que o jogador já
 * encontrou, em categorias, e o Guia do jogo com as páginas do docs/wiki.md. No celular, três
 * telas (índice, lista, verbete); no PC, as três lado a lado. A busca acha só o que já foi visto.
 */
export class CompendiumScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private scrolls: ScrollArea[] = [];
  private offsets: number[] = [];
  private size = { w: 0, h: 0 };
  private cats: CompendiumCategory[] = [];
  private screen: Screen = 'index';
  private catId = 'molecules';
  private entryId = '';
  private filter: Filter = 'all';
  private query = '';
  private search?: HtmlInput;

  constructor() {
    super(SCENES.compendium);
  }

  create(data: { cat?: string }): void {
    music.setMain('hub');
    this.screen = 'index';
    this.query = '';
    this.filter = 'all';
    this.search = undefined;
    this.scrolls = [];
    this.offsets = [];
    // Save de antes do Compêndio novo: o que já foi encontrado entra como lido.
    const save = getSave(this);
    if (save.compendiumRead === null) {
      setSave(this, { ...save, compendiumRead: seenKeys(buildCompendium(save)) });
    }
    this.cats = buildCompendium(getSave(this));
    if (data.cat && this.cats.some((c) => c.id === data.cat)) {
      this.catId = data.cat;
      this.screen = 'list';
    }
    this.entryId = this.cat().entries[0]?.id ?? '';
    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.back());
    kb?.on('keydown', (e: KeyboardEvent) => this.key(e));
    setupUiLayout(
      this,
      (w, h) => {
        this.size = { w, h };
        this.build();
      },
      menuMinSize({ width: 390, height: 700 }),
    );
  }

  private get wide(): boolean {
    return isWideMenu(this.size.w, this.size.h);
  }

  private cat(id = this.catId): CompendiumCategory {
    return this.cats.find((c) => c.id === id) ?? this.cats[0]!;
  }

  private entry(): CompendiumEntry {
    const c = this.cat();
    return c.entries.find((e) => e.id === this.entryId) ?? c.entries[0]!;
  }

  private find = (cat: string, id: string) => this.cat(cat).entries.find((e) => e.id === id);

  /** Abre um verbete e o marca como lido (some o NOVO). */
  private open(cat: string, id: string): void {
    this.catId = cat;
    this.entryId = id;
    this.screen = 'entry';
    this.query = '';
    if (this.search) this.search.el.value = '';
    const e = this.find(cat, id);
    const save = getSave(this);
    const key = `${cat}:${id}`;
    if (e?.seen && !(save.compendiumRead ?? []).includes(key)) {
      setSave(this, { ...save, compendiumRead: [...(save.compendiumRead ?? []), key] });
      this.cats = buildCompendium(getSave(this));
    }
    this.offsets = [];
    this.build();
  }

  private openCategory(c: CompendiumCategory): void {
    this.catId = c.id;
    this.filter = 'all';
    this.query = '';
    if (this.search) this.search.el.value = '';
    if (this.wide) {
      this.open(c.id, c.entries[0]!.id);
      return;
    }
    this.screen = 'list';
    this.offsets = [];
    this.build();
  }

  private step(d: number): void {
    const list = this.cat().entries;
    const i = list.findIndex((e) => e.id === this.entry().id);
    this.open(this.catId, list[(i + d + list.length) % list.length]!.id);
  }

  private back(): void {
    if (this.query) {
      this.query = '';
      if (this.search) this.search.el.value = '';
      this.build();
      return;
    }
    if (this.wide || this.screen === 'index') {
      this.scene.start(SCENES.hub);
      return;
    }
    this.screen = this.screen === 'entry' ? 'list' : 'index';
    this.offsets = [];
    this.build();
  }

  /** Atalhos: / abre a busca; no PC, ← → trocam o verbete. */
  private key(e: KeyboardEvent): void {
    if (e.key === '/') {
      e.preventDefault();
      this.search?.el.focus();
      return;
    }
    if (!this.wide && this.screen !== 'entry') return;
    if (e.key === 'ArrowLeft') this.step(-1);
    else if (e.key === 'ArrowRight') this.step(1);
  }

  private build(): void {
    this.offsets = this.scrolls.length ? this.scrolls.map((s) => s.offset()) : this.offsets;
    this.root?.destroy();
    for (const s of this.scrolls) s.destroy();
    this.scrolls = [];
    const { w, h } = this.size;
    const bg = this.add.graphics();
    drawGrid(bg, 0, 0, w, h);
    const out: Obj[] = [bg];
    if (this.wide) out.push(...this.buildWide());
    else out.push(...this.buildPortrait());
    this.root = this.add.container(0, 0, out);
    for (const s of this.scrolls) s.isolate();
  }

  private scrollArea(
    objects: Obj[],
    area: { x: number; y: number; width: number; height: number },
  ) {
    const s = addScrollArea(this, objects, area, this.offsets[this.scrolls.length] ?? 0);
    this.scrolls.push(s);
  }

  /** Caixa da busca, com a lupa e o `<input>` da página por cima. */
  private searchBox(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    drawInkBox(g, x, y, w, h, PALETTE.panelDeep);
    // Lupa de pixels: aro ciano e cabo.
    g.fillStyle(PALETTE.cyan);
    g.fillRect(x + 14, y + h / 2 - 6, 6, 2).fillRect(x + 14, y + h / 2 + 2, 6, 2);
    g.fillRect(x + 12, y + h / 2 - 4, 2, 6).fillRect(x + 20, y + h / 2 - 4, 2, 6);
    g.fillRect(x + 22, y + h / 2 + 4, 2, 2).fillRect(x + 24, y + h / 2 + 6, 2, 2);
    const area = { x: x + 36, y: y + 4, width: w - 46, height: h - 8 };
    if (this.search) this.search.move(area);
    else {
      this.search = addHtmlInput(this, area, {
        placeholder: SEARCH_HINT,
        value: this.query,
        fontSize: 14,
        onInput: (v) => {
          this.query = v;
          this.offsets = [];
          this.build();
        },
      });
    }
  }

  private subtitle(): string {
    const t = registryTotals(this.cats);
    const results = searchCompendium(this.cats, this.query);
    if (this.query.trim()) {
      return `${results.length} RESULTADO${results.length === 1 ? '' : 'S'} PARA "${this.query.trim().toUpperCase()}"`;
    }
    if (this.wide || this.screen === 'index') {
      return `${Math.round((t.seen / t.total) * 100)}% DESCOBERTO · ${t.fresh} NOVO${t.fresh === 1 ? '' : 'S'}`;
    }
    const c = this.cat();
    if (this.screen === 'list') {
      return `${c.group === 'reg' ? 'REGISTRO' : 'GUIA'} › ${c.name.toUpperCase()}`;
    }
    const i = c.entries.findIndex((e) => e.id === this.entry().id);
    return `${c.name.toUpperCase()} › ${i + 1}/${c.entries.length}`;
  }

  // ---------- Celular em pé ----------

  private buildPortrait(): Obj[] {
    const { w, h } = this.size;
    const colW = Math.min(w - 24, 420);
    const x = Math.floor((w - colW) / 2);
    const g = this.add.graphics();
    const out: Obj[] = [
      g,
      this.add
        .text(
          w / 2,
          16,
          'COMPÊNDIO',
          withShadow(impactText(26, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
        )
        .setOrigin(0.5, 0),
      this.add
        .text(w / 2, 50, this.subtitle(), labelText(8, PALETTE_CSS.textSoft))
        .setOrigin(0.5, 0),
    ];
    this.searchBox(g, x, 66, colW, 40);
    const top = 116;
    const bottom = h - 76;
    drawFramedPanel(g, x, top, colW, bottom - top);
    const inner = { x: x + 14, y: top + 12, w: colW - 28 };
    const body = this.query.trim()
      ? this.resultsBody(inner.x, inner.y, inner.w)
      : this.screen === 'index'
        ? this.indexBody(inner.x, inner.y, inner.w, 2)
        : this.screen === 'list'
          ? this.listBody(inner.x, inner.y, inner.w)
          : this.entryBody(inner.x, inner.y, inner.w, 96);
    this.scrollArea(body, { x: x + 8, y: top + 8, width: colW - 16, height: bottom - top - 16 });
    const searching = Boolean(this.query.trim());
    out.push(
      addButton(this, {
        x,
        y: h - 64,
        width: colW,
        height: 48,
        label: this.screen === 'index' && !searching ? 'VOLTAR AO HUB' : 'VOLTAR',
        fontSize: 16,
        onClick: () => this.back(),
      }),
    );
    return out;
  }

  /** Índice: o registro em cartões e o Guia do jogo em linhas. */
  private indexBody(x: number, y: number, w: number, cols: number): Obj[] {
    const g = this.add.graphics();
    const t = registryTotals(this.cats);
    const out: Obj[] = [
      g,
      ...sectionHead(this, g, x, y, w, 'REGISTRO', `${Math.round((t.seen / t.total) * 100)}%`),
    ];
    let cy = y + 26;
    const reg = this.cats.filter((c) => c.group === 'reg');
    const gap = 10;
    const cw = Math.floor((w - gap * (cols - 1)) / cols);
    const ch = 62;
    reg.forEach((c, i) => {
      const cx = x + (i % cols) * (cw + gap);
      const ry = cy + Math.floor(i / cols) * (ch + gap);
      out.push(...categoryCard(this, g, c, cx, ry, cw, ch, false, () => this.openCategory(c)));
    });
    cy += Math.ceil(reg.length / cols) * (ch + gap) + 8;
    out.push(...sectionHead(this, g, x, cy, w, 'GUIA DO JOGO'));
    cy += 24;
    for (const c of this.cats.filter((k) => k.group === 'guide')) {
      out.push(...categoryCard(this, g, c, x, cy, w, 50, false, () => this.openCategory(c)));
      cy += 56;
    }
    return out;
  }

  /** Lista da categoria: a frase dela, os filtros (registro) e as linhas. */
  private listBody(x: number, y: number, w: number): Obj[] {
    const g = this.add.graphics();
    const c = this.cat();
    const out: Obj[] = [g];
    const blurb = this.add.text(x, y, c.blurb, {
      ...bodyText(12, PALETTE_CSS.text),
      wordWrap: { width: w },
    });
    out.push(blurb);
    let cy = Math.ceil(blurb.y + blurb.height) + 10;
    if (c.group === 'reg') {
      out.push(...this.filters(g, x, cy, w));
      cy += 42;
    }
    for (const e of this.filtered(c)) {
      const row = entryRow(this, g, e, e.tag, x, cy, w, false, () => this.open(c.id, e.id));
      out.push(...row.objects);
      cy += row.height + 8;
    }
    return out;
  }

  private filtered(c: CompendiumCategory): CompendiumEntry[] {
    return c.entries.filter(
      (e) => this.filter === 'all' || (this.filter === 'seen' ? e.seen : e.isNew),
    );
  }

  /** TODOS, VISTOS e NOVOS: o escolhido em madeira. */
  private filters(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number): Obj[] {
    const c = this.cat();
    const { seen, fresh } = categoryCount(c);
    const list: [Filter, string][] = [
      ['all', `TODOS ${c.entries.length}`],
      ['seen', `VISTOS ${seen}`],
      ['new', `NOVOS ${fresh}`],
    ];
    const bw = Math.floor((w - 16) / 3);
    const out: Obj[] = [];
    list.forEach(([id, label], i) => {
      const bx = x + i * (bw + 8);
      const on = id === this.filter;
      g.fillStyle(on ? PALETTE.outline : PALETTE.ink).fillRect(bx, y, bw, 32);
      g.fillStyle(on ? PALETTE.wood : PALETTE.panel).fillRect(bx + 3, y + 3, bw - 6, 26);
      g.fillStyle(on ? PALETTE.woodHi : PALETTE.panelHi).fillRect(bx + 3, y + 3, bw - 6, 3);
      g.fillStyle(on ? PALETTE.woodShade : PALETTE.panelShade).fillRect(bx + 3, y + 25, bw - 6, 4);
      out.push(
        this.add
          .text(bx + bw / 2, y + 16, label, labelText(8, on ? '#FFFFFF' : PALETTE_CSS.textSoft))
          .setOrigin(0.5),
        tapZone(this, bx, y, bw, 32, () => {
          this.filter = id;
          this.offsets = [];
          this.build();
        }),
      );
    });
    return out;
  }

  private entryBody(x: number, y: number, w: number, art: number): Obj[] {
    const g = this.add.graphics();
    const c = this.cat();
    const e = this.entry();
    const i = c.entries.indexOf(e);
    const d = entryDetail(this, g, c, e, x, y, w, {
      pos: `${i + 1}/${c.entries.length}`,
      artSize: art,
      onPrev: () => this.step(-1),
      onNext: () => this.step(1),
      find: this.find,
      onLink: (cat, id) => this.open(cat, id),
    });
    return [g, ...d.objects];
  }

  /** Resultados da busca, com a categoria no lugar da etiqueta. */
  private resultsBody(x: number, y: number, w: number): Obj[] {
    const g = this.add.graphics();
    const out: Obj[] = [g];
    const results = searchCompendium(this.cats, this.query);
    if (results.length === 0) {
      out.push(
        this.add.text(x, y, 'Nada encontrado. A busca só acha o que você já viu.', {
          ...bodyText(13, PALETTE_CSS.textSoft),
          wordWrap: { width: w },
        }),
      );
      return out;
    }
    let cy = y + 4;
    for (const { cat, entry } of results) {
      const row = entryRow(this, g, entry, cat.name.toUpperCase(), x, cy, w, false, () =>
        this.open(cat.id, entry.id),
      );
      out.push(...row.objects);
      cy += row.height + 8;
    }
    return out;
  }

  // ---------- PC ----------

  /** Compêndio no PC: categorias à esquerda, a grade no meio e a ficha à direita. */
  private buildWide(): Obj[] {
    const { w, h } = this.size;
    const g = this.add.graphics();
    const out: Obj[] = [g];
    const left = 48;
    const right = w - 48;
    out.push(
      this.add.text(
        left,
        28,
        'COMPÊNDIO',
        withShadow(impactText(40, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 3),
      ),
      this.add.text(left, 80, this.subtitle(), labelText(10, PALETTE_CSS.textSoft)),
    );
    const sw = 420;
    this.searchBox(g, right - sw, 30, sw, 42);
    out.push(
      this.add
        .text(
          right,
          80,
          '/ ABRE A BUSCA · BUSCA SÓ O QUE VOCÊ JÁ ENCONTROU',
          labelText(8, PALETTE_CSS.textMuted),
        )
        .setOrigin(1, 0),
    );
    const top = 108;
    const bottom = h - 96;
    const navW = 248;
    const detailW = 416;
    const gap = 24;
    const midX = left + navW + gap;
    const midW = right - detailW - gap - midX;
    const detailX = right - detailW;
    drawFramedPanel(g, left, top, navW, bottom - top);
    drawFramedPanel(g, midX, top, midW, bottom - top);
    drawFramedPanel(g, detailX, top, detailW, bottom - top);

    this.scrollArea(this.navBody(left + 16, top + 16, navW - 32), {
      x: left + 8,
      y: top + 8,
      width: navW - 16,
      height: bottom - top - 16,
    });
    const mid = this.query.trim()
      ? this.resultsBody(midX + 16, top + 16, midW - 32)
      : this.gridBody(midX + 16, top + 16, midW - 32);
    this.scrollArea(mid, { x: midX + 8, y: top + 8, width: midW - 16, height: bottom - top - 16 });
    this.scrollArea(this.entryBody(detailX + 18, top + 18, detailW - 36, 112), {
      x: detailX + 8,
      y: top + 8,
      width: detailW - 16,
      height: bottom - top - 16,
    });

    // Pé: o total descoberto, VOLTAR e as teclas.
    const t = registryTotals(this.cats);
    const fy = h - 72;
    out.push(
      this.add.text(
        left,
        fy + 4,
        `${t.seen} DE ${t.total} REGISTROS · ${t.fresh} NOVOS`,
        labelText(8, PALETTE_CSS.textMuted),
      ),
    );
    g.fillStyle(PALETTE.ink).fillRect(left, fy + 20, 300, 12);
    g.fillStyle(PALETTE.sulfur).fillRect(
      left + 2,
      fy + 22,
      Math.round((296 * t.seen) / t.total),
      8,
    );
    out.push(
      addButton(this, {
        x: Math.floor(w / 2 - 140),
        y: fy - 4,
        width: 280,
        height: 52,
        label: 'VOLTAR',
        fontSize: 20,
        onClick: () => this.back(),
      }),
      this.add
        .text(
          right,
          fy + 16,
          'ESC VOLTA · ← → NAVEGA · / BUSCA',
          labelText(8, PALETTE_CSS.textMuted),
        )
        .setOrigin(1, 0.5),
    );
    return out;
  }

  /** Coluna das categorias no PC: registro com a contagem e o Guia do jogo. */
  private navBody(x: number, y: number, w: number): Obj[] {
    const g = this.add.graphics();
    const t = registryTotals(this.cats);
    const out: Obj[] = [
      g,
      ...sectionHead(this, g, x, y, w, 'REGISTRO', `${Math.round((t.seen / t.total) * 100)}%`),
    ];
    let cy = y + 26;
    const row = (c: CompendiumCategory) => {
      const on = c.id === this.catId;
      const rh = 40;
      if (on) {
        g.fillStyle(PALETTE.outline).fillRect(x, cy, w, rh);
        g.fillStyle(PALETTE.wood).fillRect(x + 3, cy + 3, w - 6, rh - 6);
        g.fillStyle(PALETTE.woodHi).fillRect(x + 3, cy + 3, w - 6, 3);
        g.fillStyle(PALETTE.woodShade).fillRect(x + 3, cy + rh - 6, w - 6, 3);
      } else {
        drawInkBox(g, x, cy, w, rh, PALETTE.panelDeep);
      }
      drawSlot(g, x + 6, cy + 6, 28, true, c.group === 'reg' ? PALETTE.wood : PALETTE.woodHi);
      out.push(...drawArt(this, g, c.art, x + 11, cy + 11, 18, false));
      const { seen, fresh } = categoryCount(c);
      out.push(
        this.add
          .text(x + 42, cy + rh / 2, c.name, {
            ...bodyText(14, on ? '#FFFFFF' : PALETTE_CSS.text),
            fontStyle: '600',
            fixedWidth: w - 42 - 52,
          })
          .setOrigin(0, 0.5),
        this.add
          .text(
            x + w - 10,
            cy + rh / 2,
            c.group === 'reg' ? `${seen}/${c.entries.length}` : String(c.entries.length),
            labelText(
              8,
              on ? '#FFF2DC' : seen === c.entries.length ? PALETTE_CSS.gold : PALETTE_CSS.cyan,
            ),
          )
          .setOrigin(1, 0.5),
      );
      if (fresh > 0) {
        g.fillStyle(PALETTE.outline).fillRect(x + w - 58, cy + 14, 12, 12);
        g.fillStyle(PALETTE.interaction).fillRect(x + w - 56, cy + 16, 8, 8);
      }
      out.push(tapZone(this, x, cy, w, rh, () => this.openCategory(c)));
      cy += rh + 6;
    };
    this.cats.filter((c) => c.group === 'reg').forEach(row);
    cy += 10;
    out.push(...sectionHead(this, g, x, cy, w, 'GUIA DO JOGO'));
    cy += 24;
    this.cats.filter((c) => c.group === 'guide').forEach(row);
    return out;
  }

  /** Grade da categoria no PC: nome, frase, filtros e os cartões com o desenho grande. */
  private gridBody(x: number, y: number, w: number): Obj[] {
    const g = this.add.graphics();
    const c = this.cat();
    const out: Obj[] = [
      g,
      this.add.text(
        x,
        y,
        c.name,
        withShadow(impactText(24, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
      ),
    ];
    const fw = c.group === 'reg' ? 300 : 0;
    const blurb = this.add.text(x, y + 34, c.blurb, {
      ...bodyText(12, PALETTE_CSS.text),
      wordWrap: { width: w - fw - 16 },
    });
    out.push(blurb);
    if (c.group === 'reg') out.push(...this.filters(g, x + w - fw, y + 4, fw));
    let cy = Math.max(y + 56, Math.ceil(blurb.y + blurb.height) + 14);
    const list = this.filtered(c);
    if (c.group === 'guide') {
      for (const e of list) {
        const row = entryRow(this, g, e, '', x, cy, w, e.id === this.entry().id, () =>
          this.open(c.id, e.id),
        );
        out.push(...row.objects);
        cy += row.height + 8;
      }
      return out;
    }
    const cols = Math.max(2, Math.floor((w + 10) / 110));
    const gap = 10;
    const cw = Math.floor((w - gap * (cols - 1)) / cols);
    const ch = 134;
    const sel = this.entry().id;
    list.forEach((e, i) => {
      const cx = x + (i % cols) * (cw + gap);
      const ry = cy + Math.floor(i / cols) * (ch + gap);
      const on = e.id === sel;
      if (on) {
        g.fillStyle(PALETTE.sulfur).fillRect(cx, ry, cw, ch);
        g.fillStyle(PALETTE.panel).fillRect(cx + 3, ry + 3, cw - 6, ch - 6);
      } else {
        drawInkBox(g, cx, ry, cw, ch, e.seen ? PALETTE.panelDeep : PALETTE.night);
      }
      const slot = Math.min(72, cw - 20);
      const sx = Math.floor(cx + (cw - slot) / 2);
      drawSlot(g, sx, ry + 10, slot, e.seen, e.ring);
      out.push(...drawArt(this, g, e.art, sx + 8, ry + 18, slot - 16, !e.seen));
      out.push(
        this.add
          .text(cx + cw / 2, ry + slot + 18, e.seen ? e.name : '???', {
            ...bodyText(13, e.seen ? '#FFFFFF' : PALETTE_CSS.textMuted),
            fontStyle: '700',
            align: 'center',
            wordWrap: { width: cw - 10 },
          })
          .setOrigin(0.5, 0),
      );
      if (e.seen) {
        out.push(
          this.add
            .text(cx + cw / 2, ry + ch - 10, e.tag, {
              ...labelText(8, e.tagColor),
              align: 'center',
              wordWrap: { width: cw - 10 },
            })
            .setOrigin(0.5, 1),
        );
      }
      if (e.isNew) out.push(newTag(this, g, cx + cw + 2, ry - 4));
      out.push(tapZone(this, cx, ry, cw, ch, () => this.open(c.id, e.id)));
    });
    return out;
  }
}
