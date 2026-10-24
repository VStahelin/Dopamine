import type * as Phaser from 'phaser';
import { META, type SpecialKind } from '../../../config';
import { labCost, labLevel, labState, type MetaProgress } from '../../../core/meta/progress';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { addButton } from '../button';
import { addIconSlot, slotSize } from '../iconSlot';
import { effect, nodeIcon, nodeStat, statName } from '../labView';
import { bodyText, impactText, labelText, withShadow } from '../theme';
import { drawInkBox } from '../icons';
import { drawFramedPanel, type Obj } from './wideLayout';
import { sfx } from '../../audio/sfx';

/** Cor do nome de cada trilha (as colunas de meta.json, na ordem). */
const LANE_COLORS = [
  PALETTE_CSS.alert,
  '#B072F0',
  PALETTE_CSS.numberHeal,
  PALETTE_CSS.gold,
  PALETTE_CSS.cyan,
  '#FF6FA8',
];
const DETAIL_W = 320;

export interface LabWideOptions {
  progress: MetaProgress;
  atp: number;
  special: SpecialKind;
  selected: string;
  onSelect: (id: string) => void;
  onBuy: (id: string) => void;
}

/**
 * Laboratório no PC (prancheta "Menu no PC: Laboratório"): a árvore deitada, com a raiz à
 * esquerda e uma trilha por coluna de meta.json, e o detalhe do nó numa coluna à direita.
 */
export function renderLabWide(
  scene: Phaser.Scene,
  area: { x: number; y: number; w: number; h: number },
  o: LabWideOptions,
): Obj[] {
  const g = scene.add.graphics();
  const out: Obj[] = [g];
  const treeW = area.w - DETAIL_W - 20;
  out.push(
    scene.add.text(
      area.x,
      area.y,
      'LABORATÓRIO · UPGRADES PERMANENTES DA RUN',
      labelText(10, PALETTE_CSS.cyan),
    ),
    scene.add
      .text(area.x + treeW, area.y, 'CLIQUE NUM NÓ PARA VER', labelText(8, PALETTE_CSS.muted))
      .setOrigin(1, 0),
  );

  const lanes = META.lab.columns.length;
  const rows = Math.max(...Object.values(META.lab.nodes).map((n) => n.row));
  const scale = 2;
  const node = slotSize(scale);
  const top = area.y + 24;
  const legendH = 22;
  const laneH = Math.min(96, Math.floor((area.h - 24 - legendH) / lanes));
  const rootX = area.x + 4;
  const trunkX = rootX + node + 22;
  const labelX = trunkX + 12;
  const labelW = 84;
  const x0 = labelX + labelW + 10;
  const step = Math.min(96, Math.floor((area.x + treeW - x0 - node) / Math.max(1, rows - 1)));
  const centerY = (lane: number) => top + lane * laneH + Math.floor((laneH - 14) / 2);
  const pos = (id: string) => {
    const n = META.lab.nodes[id]!;
    if (n.row === 0) {
      return { x: rootX, y: Math.round((centerY(0) + centerY(lanes - 1)) / 2 - node / 2) };
    }
    return { x: x0 + (n.row - 1) * step, y: centerY(n.col) - Math.floor(node / 2) };
  };

  // Ligações: raiz → tronco → primeiro nó de cada trilha, e entre os nós da trilha.
  const owned = (id: string) => labLevel(o.progress, id) > 0;
  const root = Object.keys(META.lab.nodes).find((id) => META.lab.nodes[id]!.row === 0)!;
  const rp = pos(root);
  g.fillStyle(owned(root) ? PALETTE.water : PALETTE.panelLight);
  g.fillRect(rp.x + node, rp.y + node / 2 - 2, trunkX - rp.x - node, 4);
  g.fillRect(trunkX, centerY(0) - 2, 4, centerY(lanes - 1) - centerY(0) + 4);
  for (let lane = 0; lane < lanes; lane++) {
    g.fillStyle(owned(root) ? PALETTE.water : PALETTE.panelLight);
    g.fillRect(trunkX, centerY(lane) - 2, x0 - trunkX, 4);
    const ids = Object.keys(META.lab.nodes)
      .filter((id) => META.lab.nodes[id]!.col === lane && META.lab.nodes[id]!.row > 0)
      .sort((a, b) => META.lab.nodes[a]!.row - META.lab.nodes[b]!.row);
    for (let i = 0; i < ids.length - 1; i++) {
      const a = pos(ids[i]!);
      g.fillStyle(owned(ids[i]!) ? PALETTE.water : PALETTE.panelLight);
      g.fillRect(a.x + node, centerY(lane) - 2, step - node, 4);
    }
    // Nome da trilha numa plaquinha por cima da linha.
    drawInkBox(g, labelX, centerY(lane) - 13, labelW, 26, PALETTE.panelDeep);
    out.push(
      scene.add
        .text(
          labelX + labelW / 2,
          centerY(lane),
          META.lab.columns[lane]!,
          labelText(8, LANE_COLORS[lane] ?? PALETTE_CSS.text),
        )
        .setOrigin(0.5),
    );
  }

  for (const [id, n] of Object.entries(META.lab.nodes)) {
    const { x, y } = pos(id);
    const state = labState(o.progress, id);
    const level = labLevel(o.progress, id);
    if (id === o.selected) g.fillStyle(PALETTE.stress).fillRect(x - 5, y - 5, node + 10, node + 10);
    const slot = addIconSlot(scene, x, y, scale, {
      frame:
        state === 'maxed'
          ? 'evolved'
          : level > 0
            ? 'passive'
            : state === 'available'
              ? 'buff'
              : 'empty',
      icon: nodeIcon(n, o.special),
      dim: state === 'locked',
    });
    out.push(
      ...slot.objects,
      scene.add
        .text(
          x + node / 2,
          y + node + 3,
          state === 'maxed' ? 'MAX' : `${level}/${n.maxLevel}`,
          labelText(
            8,
            state === 'maxed'
              ? PALETTE_CSS.goldIcon
              : state === 'locked'
                ? PALETTE_CSS.muted
                : PALETTE_CSS.textSoft,
          ),
        )
        .setOrigin(0.5, 0),
    );
    const zone = scene.add
      .zone(x + node / 2, y + node / 2, node + 12, node + 12)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => {
      sfx.play('uiTap');
      o.onSelect(id);
    });
    out.push(zone);
  }

  // Legenda dos estados.
  const legend: [string, number][] = [
    ['NO MÁXIMO', PALETTE.sulfur],
    ['COMPRADO', PALETTE.water],
    ['DISPONÍVEL', PALETTE.buff],
    ['BLOQUEADO', PALETTE.panelLight],
  ];
  let lx = area.x;
  const ly = area.y + area.h - 12;
  for (const [text, color] of legend) {
    g.fillStyle(color).fillRect(lx, ly - 1, 12, 12);
    g.fillStyle(PALETTE.night).fillRect(lx + 3, ly + 2, 6, 6);
    const t = scene.add.text(lx + 18, ly, text, labelText(8, PALETTE_CSS.textMuted));
    out.push(t);
    lx += 18 + t.width + 18;
  }

  out.push(...labDetail(scene, area.x + area.w - DETAIL_W, area.y, DETAIL_W, area.h, o));
  return out;
}

/** Coluna do nó escolhido: ícone grande, níveis, agora e próximo, requisito e COMPRAR. */
function labDetail(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  o: LabWideOptions,
): Obj[] {
  const id = o.selected in META.lab.nodes ? o.selected : Object.keys(META.lab.nodes)[0]!;
  const n = META.lab.nodes[id]!;
  const level = labLevel(o.progress, id);
  const state = labState(o.progress, id);
  const g = scene.add.graphics();
  drawFramedPanel(g, x, y, w, h);
  const out: Obj[] = [g];
  const ix = x + 20;
  let cy = y + 20;
  const lane = n.row === 0 ? 'RAIZ' : (META.lab.columns[n.col] ?? '');
  out.push(scene.add.text(ix, cy, lane, labelText(8, LANE_COLORS[n.col] ?? PALETTE_CSS.text)));
  cy += 18;
  const slot = addIconSlot(scene, ix, cy, 3, {
    frame: state === 'maxed' ? 'evolved' : 'passive',
    icon: nodeIcon(n, o.special),
    dim: state === 'locked',
  });
  out.push(...slot.objects);
  const tx = ix + slot.size + 14;
  const name = scene.add.text(tx, cy + 4, statName(n), {
    ...withShadow(impactText(20, '#FFFFFF'), PALETTE_CSS.outline, 2),
    wordWrap: { width: x + w - 20 - tx },
  });
  out.push(name);
  const pipY = name.y + name.height + 8;
  for (let i = 0; i < n.maxLevel; i++) {
    const px = tx + i * 18;
    g.fillStyle(PALETTE.ink).fillRect(px, pipY, 15, 11);
    g.fillStyle(
      i < level ? (state === 'maxed' ? PALETTE.sulfur : PALETTE.water) : PALETTE.panel,
    ).fillRect(px + 2, pipY + 2, 11, 7);
  }
  out.push(
    scene.add.text(
      tx,
      pipY + 18,
      `NÍVEL ${level}/${n.maxLevel}`,
      labelText(8, PALETTE_CSS.textSoft),
    ),
  );
  cy += Math.max(slot.size, pipY + 30 - cy) + 14;

  const desc = scene.add.text(ix, cy, nodeStat(n)?.description ?? '', {
    ...bodyText(13, PALETTE_CSS.textSoft),
    wordWrap: { width: w - 40 },
  });
  out.push(desc);
  cy += desc.height + 14;

  const boxW = Math.floor((w - 40 - 8) / 2);
  const boxes: [string, string, string][] = [
    ['AGORA', level > 0 ? effect(n, level) : '—', PALETTE_CSS.cyan],
    ['PRÓXIMO NÍVEL', level < n.maxLevel ? effect(n, level + 1) : 'MÁXIMO', PALETTE_CSS.numberHeal],
  ];
  boxes.forEach(([label, value, color], i) => {
    const bx = ix + i * (boxW + 8);
    drawInkBox(g, bx, cy, boxW, 58, PALETTE.panelDeep);
    out.push(
      scene.add.text(bx + 10, cy + 10, label, labelText(8, PALETTE_CSS.muted)),
      scene.add.text(bx + 10, cy + 24, value, impactText(20, color)),
    );
  });
  cy += 58 + 12;

  if (n.requires.length > 0) {
    const missing = n.requires.filter((r) => labLevel(o.progress, r) === 0);
    const names = (missing.length ? missing : n.requires).map((r) => statName(META.lab.nodes[r]!));
    out.push(
      scene.add.text(
        ix,
        cy,
        `${missing.length ? 'PRECISA DE' : 'VEM DEPOIS DE'}: ${names.join(' E ').toUpperCase()}`,
        {
          ...labelText(8, missing.length ? PALETTE_CSS.alert : PALETTE_CSS.muted),
          wordWrap: { width: w - 40 },
          lineSpacing: 3,
        },
      ),
    );
  }

  const by = y + h - 20 - 50;
  const note = scene.add.text(
    ix,
    by - 8,
    'Vale para toda run, com qualquer agente.',
    bodyText(11, PALETTE_CSS.textMuted),
  );
  note.setY(by - 8 - note.height);
  out.push(note);
  const cost = labCost(n, level);
  const can = state === 'available' && o.atp >= cost;
  const label =
    state === 'maxed'
      ? 'NO MÁXIMO'
      : state === 'locked'
        ? 'BLOQUEADO'
        : can
          ? `COMPRAR · ${cost.toLocaleString('pt-BR')} ATP`
          : `FALTAM ${(cost - Math.floor(o.atp)).toLocaleString('pt-BR')} ATP`;
  out.push(
    addButton(scene, {
      x: ix,
      y: by,
      width: w - 40,
      height: 50,
      label,
      fontSize: 16,
      variant: can ? 'primary' : 'secondary',
      sound: can ? 'uiBuy' : 'uiError',
      onClick: () => {
        if (can) o.onBuy(id);
      },
    }),
  );
  return out;
}
