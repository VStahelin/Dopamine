import * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { addIcon, textureKey } from '../../render/textures';
import { drawIcon, drawInkBox } from '../icons';
import { floorColor } from '../locals';
import { bodyText, labelText, withShadow } from '../theme';
import type { CompendiumCategory, CompendiumEntry, EntryArt } from './model';

type Obj = Phaser.GameObjects.GameObject;
type G = Phaser.GameObjects.Graphics;

/** Silhueta do que ainda não foi encontrado. */
const SILHOUETTE = 0x0b0c1a;

/** Toque que não virou arrasto da rolagem. */
const TAP_PX = 8;

/** Área de toque que ignora o arrasto da rolagem. */
export function tapZone(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  onTap: () => void,
): Obj {
  const zone = scene.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
  zone.on('pointerup', (p: Phaser.Input.Pointer) => {
    if (p.getDistance() < TAP_PX) onTap();
  });
  return zone;
}

/**
 * Moldura do desenho (prancheta "Compêndio"): contorno escuro (dourado se escolhido), creme
 * quando encontrado e azul quando não, com o anel colorido por dentro.
 */
export function drawSlot(
  g: G,
  x: number,
  y: number,
  size: number,
  seen: boolean,
  ring: number,
  selected = false,
): void {
  g.fillStyle(selected ? PALETTE.sulfur : PALETTE.outline).fillRect(x, y, size, size);
  g.fillStyle(seen ? ring : PALETTE.panel).fillRect(x + 3, y + 3, size - 6, size - 6);
  g.fillStyle(seen ? PALETTE.cream : PALETTE.panelHi).fillRect(x + 5, y + 5, size - 10, size - 10);
}

/** O desenho do verbete centrado numa caixa de `size`; `sil` pinta tudo de silhueta. */
export function drawArt(
  scene: Phaser.Scene,
  g: G,
  art: EntryArt,
  x: number,
  y: number,
  size: number,
  sil: boolean,
): Obj[] {
  if (art.kind === 'molecule') {
    const img = scene.add.image(x + size / 2, y + size / 2, textureKey(art.key, 3));
    img.setScale(Math.min(size / img.width, size / img.height));
    if (sil) img.setTint(SILHOUETTE).setTintMode(Phaser.TintModes.FILL);
    return [img];
  }
  if (art.kind === 'icon') {
    const px = Math.max(16, Math.floor(size / 16) * 16);
    const off = Math.floor((size - px) / 2);
    const icon = addIcon(scene, x + off, y + off, art.ref, px);
    if (sil) icon.setTint(SILHOUETTE).setTintMode(Phaser.TintModes.FILL);
    return [icon];
  }
  if (art.kind === 'tile') {
    const cell = Math.floor(size / 3);
    const off = Math.floor((size - cell * 3) / 2);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const on = (i + j) % 2 === 0;
        const color =
          art.env === 'blood'
            ? on
              ? PALETTE.interaction
              : PALETTE.darkRed
            : floorColor(art.env, on ? 3 : 2);
        g.fillStyle(sil ? SILHOUETTE : color).fillRect(
          x + off + i * cell,
          y + off + j * cell,
          cell,
          cell,
        );
      }
    }
    return [];
  }
  const pixel = Math.max(1, Math.floor(size / 10));
  const off = Math.floor((size - 8 * pixel) / 2);
  drawIcon(g, 'book', x + off, y + off, sil ? SILHOUETTE : PALETTE.wood, pixel);
  return [];
}

/** Selo vermelho "NOVO" com o canto direito em `right`. */
export function newTag(scene: Phaser.Scene, g: G, right: number, y: number, text = 'NOVO'): Obj {
  const t = scene.add.text(0, y + 3, text, labelText(8, '#FFFFFF')).setOrigin(1, 0);
  const w = t.width + 10;
  g.fillStyle(PALETTE.outline).fillRect(right - w, y, w, 15);
  g.fillStyle(PALETTE.interaction).fillRect(right - w + 2, y + 2, w - 4, 11);
  t.setX(right - 5);
  return t;
}

/** Contagem de uma categoria: encontrados e novos. */
export function categoryCount(c: CompendiumCategory): { seen: number; fresh: number } {
  return {
    seen: c.entries.filter((e) => e.seen).length,
    fresh: c.entries.filter((e) => e.isNew).length,
  };
}

/**
 * Cartão de categoria do índice: desenho, nome, a contagem e a barra (registro) ou "N VERBETES"
 * (guia), com o selo NOVO quando há novidade.
 */
export function categoryCard(
  scene: Phaser.Scene,
  g: G,
  c: CompendiumCategory,
  x: number,
  y: number,
  w: number,
  h: number,
  selected: boolean,
  onTap: () => void,
): Obj[] {
  const { seen, fresh } = categoryCount(c);
  const all = c.entries.length;
  const reg = c.group === 'reg';
  if (selected) {
    g.fillStyle(PALETTE.outline).fillRect(x, y, w, h);
    g.fillStyle(PALETTE.wood).fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle(PALETTE.woodHi).fillRect(x + 3, y + 3, w - 6, 3);
    g.fillStyle(PALETTE.woodShade).fillRect(x + 3, y + h - 6, w - 6, 3);
  } else {
    drawInkBox(g, x, y, w, h, PALETTE.panelDeep);
  }
  const slot = Math.min(38, h - 14);
  const sy = y + Math.floor((h - slot) / 2);
  drawSlot(g, x + 8, sy, slot, true, reg ? PALETTE.wood : PALETTE.woodHi);
  const out: Obj[] = drawArt(scene, g, c.art, x + 13, sy + 5, slot - 10, false);
  const tx = x + 8 + slot + 8;
  const complete = seen === all;
  if (reg) {
    out.push(
      scene.add.text(tx, sy + 1, c.name, {
        ...bodyText(13, '#FFFFFF'),
        fontStyle: '700',
        wordWrap: { width: x + w - 8 - tx },
      }),
    );
    out.push(
      scene.add.text(
        tx,
        sy + slot - 18,
        `${seen}/${all}`,
        labelText(8, selected ? '#FFF2DC' : complete ? PALETTE_CSS.gold : PALETTE_CSS.cyan),
      ),
    );
    const bx = tx;
    const bw = x + w - 10 - bx;
    const by = sy + slot - 7;
    g.fillStyle(PALETTE.ink).fillRect(bx, by, bw, 6);
    g.fillStyle(complete ? PALETTE.sulfur : PALETTE.water).fillRect(
      bx + 1,
      by + 1,
      Math.round(((bw - 2) * seen) / all),
      4,
    );
  } else {
    out.push(
      scene.add
        .text(tx, y + h / 2, c.name, { ...bodyText(14, '#FFFFFF'), fontStyle: '700' })
        .setOrigin(0, 0.5),
      scene.add
        .text(x + w - 10, y + h / 2, `${all} VERBETES`, labelText(8, PALETTE_CSS.textMuted))
        .setOrigin(1, 0.5),
    );
  }
  if (fresh > 0) out.push(newTag(scene, g, x + w + 2, y - 4));
  out.push(tapZone(scene, x, y, w, h, onTap));
  return out;
}

/** Linha da lista: desenho, nome (ou ???), etiqueta, a linha curta e o selo NOVO. */
export function entryRow(
  scene: Phaser.Scene,
  g: G,
  e: CompendiumEntry,
  tag: string,
  x: number,
  y: number,
  w: number,
  selected: boolean,
  onTap: () => void,
): { objects: Obj[]; height: number } {
  const slot = 42;
  const tx = x + 8 + slot + 10;
  const tagText = scene.add
    .text(x + w - 10, y + 10, e.seen ? tag : 'NÃO ENCONTRADO', {
      ...labelText(8, e.seen ? e.tagColor : PALETTE_CSS.textMuted),
      align: 'right',
    })
    .setOrigin(1, 0);
  const name = scene.add.text(tx, y + 7, e.seen ? e.name : '???', {
    ...withShadow(
      { ...bodyText(14, e.seen ? '#FFFFFF' : PALETTE_CSS.textMuted), fontStyle: '700' },
      PALETTE_CSS.ink,
      1,
    ),
    wordWrap: { width: x + w - 16 - tagText.width - tx },
  });
  const sub = scene.add.text(tx, name.y + name.height + 2, e.seen ? e.sub : e.hint, {
    ...bodyText(10, e.seen ? PALETTE_CSS.textSoft : PALETTE_CSS.textMuted),
    wordWrap: { width: x + w - 10 - tx },
    maxLines: 2,
  });
  const height = Math.max(slot + 12, Math.ceil(sub.y + sub.height - y) + 8);
  if (selected) {
    g.fillStyle(PALETTE.sulfur).fillRect(x, y, w, height);
    g.fillStyle(PALETTE.panel).fillRect(x + 3, y + 3, w - 6, height - 6);
  } else {
    drawInkBox(g, x, y, w, height, e.seen ? PALETTE.panelDeep : PALETTE.night);
  }
  const sy = y + Math.floor((height - slot) / 2);
  drawSlot(g, x + 8, sy, slot, e.seen, e.ring);
  const out: Obj[] = [
    ...drawArt(scene, g, e.art, x + 13, sy + 5, slot - 10, !e.seen),
    name,
    tagText,
    sub,
  ];
  if (e.isNew) out.push(newTag(scene, g, x + w + 2, y - 4));
  out.push(tapZone(scene, x, y, w, height, onTap));
  return { objects: out, height };
}

/** Cabeçalho de seção: rótulo e o traço embaixo. */
export function sectionHead(
  scene: Phaser.Scene,
  g: G,
  x: number,
  y: number,
  w: number,
  text: string,
  right?: string,
): Obj[] {
  g.fillStyle(PALETTE.panel).fillRect(x, y + 14, w, 2);
  const out: Obj[] = [scene.add.text(x, y, text, labelText(8, PALETTE_CSS.sectionOrange))];
  if (right) {
    out.push(scene.add.text(x + w, y, right, labelText(8, PALETTE_CSS.gold)).setOrigin(1, 0));
  }
  return out;
}

export interface DetailOptions {
  /** Posição na categoria ("5/15"). */
  pos: string;
  artSize: number;
  onPrev: () => void;
  onNext: () => void;
  /** Verbete de uma ligação, para o nome e o desenho. */
  find: (cat: string, id: string) => CompendiumEntry | undefined;
  onLink: (cat: string, id: string) => void;
}

/**
 * Ficha do verbete (prancheta "Compêndio", tela verbete): desenho grande, etiqueta, nome e a
 * posição com ANTERIOR e PRÓXIMO; FICHA em caixas, SEU REGISTRO, NO JOGO e as LIGAÇÕES.
 */
export function entryDetail(
  scene: Phaser.Scene,
  g: G,
  cat: CompendiumCategory,
  e: CompendiumEntry,
  x: number,
  y: number,
  w: number,
  o: DetailOptions,
): { objects: Obj[]; height: number } {
  const out: Obj[] = [];
  const art = o.artSize;
  g.fillStyle(PALETTE.outline).fillRect(x, y, art, art);
  drawSlot(g, x, y, art, e.seen, e.ring);
  out.push(...drawArt(scene, g, e.art, x + 10, y + 10, art - 20, !e.seen));
  const tx = x + art + 14;
  const tw = x + w - tx;
  const tag = scene.add.text(tx, y + 4, e.seen ? e.tag : 'NÃO ENCONTRADO', {
    ...labelText(8, e.seen ? e.tagColor : PALETTE_CSS.textMuted),
    wordWrap: { width: tw },
  });
  const name = scene.add.text(tx, tag.y + tag.height + 4, e.seen ? e.name : '???', {
    ...withShadow({ ...bodyText(20, '#FFFFFF'), fontStyle: '700' }, PALETTE_CSS.ink, 2),
    wordWrap: { width: tw },
  });
  const pos = scene.add.text(
    tx,
    name.y + name.height + 4,
    `${cat.name.toUpperCase()} · ${o.pos}`,
    labelText(8, PALETTE_CSS.textMuted),
  );
  out.push(tag, name, pos);
  if (e.isNew) out.push(newTag(scene, g, x + w, y));
  // ANTERIOR e PRÓXIMO, embaixo do nome.
  const by = Math.max(pos.y + pos.height + 8, y + art - 36);
  const bw = Math.floor((tw - 8) / 2);
  const nav: [string, number, () => void][] = [
    ['‹ ANTERIOR', tx, o.onPrev],
    ['PRÓXIMO ›', tx + bw + 8, o.onNext],
  ];
  for (const [label, bx, onTap] of nav) {
    g.fillStyle(PALETTE.ink).fillRect(bx, by, bw, 36);
    g.fillStyle(PALETTE.panel).fillRect(bx + 3, by + 3, bw - 6, 30);
    g.fillStyle(PALETTE.panelHi).fillRect(bx + 3, by + 3, bw - 6, 3);
    g.fillStyle(PALETTE.panelShade).fillRect(bx + 3, by + 29, bw - 6, 4);
    out.push(
      scene.add.text(bx + bw / 2, by + 18, label, labelText(8, PALETTE_CSS.text)).setOrigin(0.5),
      tapZone(scene, bx, by, bw, 36, onTap),
    );
  }
  let cy = Math.max(y + art, by + 36) + 16;

  if (!e.seen) {
    out.push(...sectionHead(scene, g, x, cy, w, 'COMO ENCONTRAR'));
    const hint = scene.add.text(x, cy + 24, e.hint || 'Continue jogando.', {
      ...bodyText(13, PALETTE_CSS.textSoft),
      wordWrap: { width: w },
    });
    out.push(hint);
    return { objects: out, height: Math.ceil(hint.y + hint.height - y) };
  }

  const boxes = (title: string, list: [string, string][]) => {
    if (list.length === 0) return;
    out.push(...sectionHead(scene, g, x, cy, w, title));
    cy += 24;
    const bw2 = Math.floor((w - 6) / 2);
    for (let i = 0; i < list.length; i += 2) {
      const row = list.slice(i, i + 2);
      const texts = row.map(([label, value], k) => {
        const bx = x + k * (bw2 + 6);
        return [
          scene.add.text(bx + 10, cy + 8, label, labelText(8, PALETTE_CSS.textMuted)),
          scene.add.text(bx + 10, cy + 22, value, {
            ...bodyText(14, '#FFFFFF'),
            fontStyle: '700',
            wordWrap: { width: bw2 - 20 },
          }),
        ] as const;
      });
      const rh = Math.max(...texts.map(([, v]) => Math.ceil(v.y + v.height - cy) + 8));
      texts.forEach(([l, v], k) => {
        drawInkBox(g, x + k * (bw2 + 6), cy, bw2, rh, PALETTE.panelDeep);
        out.push(l, v);
      });
      cy += rh + 6;
    }
    cy += 10;
  };
  boxes('FICHA', e.stats);
  boxes('SEU REGISTRO', e.mine);

  if (e.text) {
    out.push(...sectionHead(scene, g, x, cy, w, cat.group === 'guide' ? 'VERBETE' : 'NO JOGO'));
    const text = scene.add.text(x, cy + 24, e.text, {
      ...bodyText(13, PALETTE_CSS.text),
      wordWrap: { width: w },
      lineSpacing: 4,
    });
    out.push(text);
    cy = Math.ceil(text.y + text.height) + 18;
  }

  const links = e.links.map((l) => ({ ...l, target: o.find(l.cat, l.id) })).filter((l) => l.target);
  if (links.length > 0) {
    out.push(...sectionHead(scene, g, x, cy, w, 'LIGAÇÕES'));
    cy += 24;
    for (const l of links) {
      const t = l.target!;
      const rh = 44;
      drawInkBox(g, x, cy, w, rh, PALETTE.panelDeep);
      drawSlot(g, x + 6, cy + 5, 34, t.seen, t.ring);
      out.push(
        ...drawArt(scene, g, t.art, x + 11, cy + 10, 24, !t.seen),
        scene.add
          .text(x + 50, cy + rh / 2, l.label, labelText(8, PALETTE_CSS.gold))
          .setOrigin(0, 0.5),
        scene.add
          .text(x + Math.max(150, w * 0.42), cy + rh / 2, t.seen ? t.name : '???', {
            ...bodyText(14, '#FFFFFF'),
            fontStyle: '700',
          })
          .setOrigin(0, 0.5),
        scene.add
          .text(x + w - 14, cy + rh / 2, '›', bodyText(18, PALETTE_CSS.cyan))
          .setOrigin(1, 0.5),
        tapZone(scene, x, cy, w, rh, () => o.onLink(l.cat, l.id)),
      );
      cy += rh + 6;
    }
  }
  return { objects: out, height: cy - y };
}
