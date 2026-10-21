import type * as Phaser from 'phaser';
import { ICONS } from '../../assets/sprites';
import {
  META,
  PASSIVES,
  STATS,
  type LabNode,
  type PassiveId,
  type RunStatKey,
  type SpecialKind,
} from '../../config';
import { labCost, labLevel, labState, type MetaProgress } from '../../core/meta/progress';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { iconTexture, type IconRef } from '../render/textures';
import { addButton } from './button';
import { addIconSlot, slotSize } from './iconSlot';
import { statDelta } from './statText';
import { bodyText, impactText, labelText } from './theme';

type Obj = Phaser.GameObjects.GameObject;

const NODE_SCALE = 2;
const NODE = slotSize(NODE_SCALE);
const ROW_H = 64;
/** Altura do painel de detalhe, em cima da árvore. */
export const LAB_DETAIL_H = 92;

/** Ícone do nó: o modificador do mesmo atributo; os do especial usam o especial do agente. */
function nodeIcon(node: LabNode, special: SpecialKind): IconRef {
  if (node.stat.startsWith('special.')) return iconTexture('specials', special);
  const passive = (Object.keys(PASSIVES) as PassiveId[]).find(
    (id) => PASSIVES[id].stat === node.stat,
  );
  if (passive) return iconTexture('passives', passive);
  return ICONS.stats[node.stat]
    ? { group: 'stats', id: node.stat }
    : { group: 'ui', id: 'missing' };
}

function statName(node: LabNode): string {
  if (node.stat.startsWith('special.')) {
    return STATS.special[node.stat.slice('special.'.length)]?.name ?? node.stat;
  }
  for (const group of Object.values(STATS)) {
    const stat = group[node.stat];
    if (stat) return stat.name;
  }
  return node.stat;
}

/** Efeito de `levels` níveis do nó, curto: `+10%`, `−2%`, `+1`. */
function effect(node: LabNode, levels: number): string {
  const v = node.perLevel * levels;
  if (node.stat === 'special.charges') return `+${v}`;
  if (node.stat.startsWith('special.')) {
    const pct = Math.round(Math.abs(v) * 100);
    return `${v < 0 ? '−' : '+'}${pct}%`;
  }
  return statDelta(node.stat as RunStatKey, v);
}

function nodeXY(node: LabNode, x0: number, y0: number, cellW: number) {
  const x = Math.round(x0 + node.col * cellW + (cellW - NODE) / 2);
  const y = node.row === 0 ? y0 : y0 + NODE + 34 + (node.row - 1) * ROW_H;
  return { x, y };
}

/**
 * Árvore do Laboratório (meta.json): a raiz em cima e uma coluna por caminho, com as ligações
 * entre os nós. Nós liberados com moldura ciano, no máximo em dourado, bloqueados apagados.
 */
export function renderLabTree(
  scene: Phaser.Scene,
  x0: number,
  y0: number,
  width: number,
  progress: MetaProgress,
  special: SpecialKind,
  selected: string,
  onSelect: (id: string) => void,
): Obj[] {
  const cols = META.lab.columns.length;
  const cellW = Math.floor(width / cols);
  const nodes = Object.entries(META.lab.nodes);
  const g = scene.add.graphics();
  const out: Obj[] = [g];

  // Ligações: do pé do nó pedido ao topo do nó, em cotovelo quando muda de coluna.
  for (const [id, node] of nodes) {
    const to = nodeXY(node, x0, y0, cellW);
    for (const req of node.requires) {
      const from = nodeXY(META.lab.nodes[req]!, x0, y0, cellW);
      const color = labLevel(progress, req) > 0 ? PALETTE.wood : PALETTE.panelLight;
      g.fillStyle(color);
      const fx = from.x + NODE / 2 - 1;
      const tx = to.x + NODE / 2 - 1;
      const midY = to.y - 12;
      g.fillRect(fx, from.y + NODE, 3, midY - from.y - NODE);
      g.fillRect(Math.min(fx, tx), midY, Math.abs(tx - fx) + 3, 3);
      g.fillRect(tx, midY, 3, to.y - midY);
    }
    void id;
  }

  // Nome de cada caminho embaixo da raiz.
  META.lab.columns.forEach((name, i) => {
    out.push(
      scene.add
        .text(x0 + i * cellW + cellW / 2, y0 + NODE + 18, name, labelText(6, PALETTE_CSS.textSoft))
        .setOrigin(0.5, 0),
    );
  });

  for (const [id, node] of nodes) {
    const { x, y } = nodeXY(node, x0, y0, cellW);
    const state = labState(progress, id);
    const level = labLevel(progress, id);
    if (id === selected) {
      g.fillStyle(PALETTE.gold).fillRect(x - 4, y - 4, NODE + 8, NODE + 8);
    }
    const slot = addIconSlot(scene, x, y, NODE_SCALE, {
      frame: state === 'maxed' ? 'evolved' : state === 'available' ? 'passive' : 'empty',
      icon: nodeIcon(node, special),
      label: state === 'maxed' ? 'MAX' : `${level}/${node.maxLevel}`,
      gold: state === 'maxed',
      dim: state === 'locked',
    });
    const zone = scene.add
      .zone(x + NODE / 2, y + NODE / 2, NODE + 12, NODE + 12)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => onSelect(id));
    out.push(...slot.objects, zone);
  }
  return out;
}

/** Altura da árvore desenhada por `renderLabTree`. */
export function labTreeHeight(): number {
  const rows = Math.max(...Object.values(META.lab.nodes).map((n) => n.row));
  return NODE + 34 + (rows - 1) * ROW_H + NODE + 16;
}

/** Painel do nó escolhido: ícone, nome, efeito, nível e o botão de comprar. */
export function renderLabDetail(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  id: string,
  progress: MetaProgress,
  atp: number,
  special: SpecialKind,
  onBuy: (id: string) => void,
): Obj[] {
  const node = META.lab.nodes[id]!;
  const level = labLevel(progress, id);
  const state = labState(progress, id);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.ink).fillRect(x, y, w, LAB_DETAIL_H);
  g.fillStyle(PALETTE.panel).fillRect(x + 3, y + 3, w - 6, LAB_DETAIL_H - 6);
  const slot = addIconSlot(scene, x + 10, y + 10, NODE_SCALE, {
    frame: state === 'maxed' ? 'evolved' : 'passive',
    icon: nodeIcon(node, special),
  });
  const tx = x + 10 + NODE + 10;
  const now = level > 0 ? ` · agora ${effect(node, level)}` : '';
  const out: Obj[] = [
    g,
    ...slot.objects,
    scene.add.text(tx, y + 9, statName(node), impactText(13)),
    scene.add
      .text(x + w - 10, y + 12, `NV ${level}/${node.maxLevel}`, labelText(8, PALETTE_CSS.textSoft))
      .setOrigin(1, 0),
    scene.add.text(
      tx,
      y + 30,
      `${effect(node, 1)} por nível${now}`,
      bodyText(10, PALETTE_CSS.cream),
    ),
  ];
  const by = y + LAB_DETAIL_H - 40;
  if (state === 'maxed') {
    out.push(scene.add.text(tx, by + 10, 'NO MÁXIMO', labelText(9, PALETTE_CSS.goldIcon)));
  } else if (state === 'locked') {
    const need = node.requires
      .filter((r) => labLevel(progress, r) === 0)
      .map((r) => statName(META.lab.nodes[r]!))
      .join(' e ');
    out.push(
      scene.add.text(tx, by + 6, `Precisa de ${need}`, {
        ...bodyText(10, PALETTE_CSS.textMuted),
        wordWrap: { width: x + w - 10 - tx },
      }),
    );
  } else {
    const cost = labCost(node, level);
    const can = atp >= cost;
    out.push(
      addButton(scene, {
        x: tx,
        y: by,
        width: x + w - 10 - tx,
        height: 32,
        label: can ? `COMPRAR · ${cost} ATP` : `FALTAM ${cost - Math.floor(atp)} ATP`,
        fontSize: 11,
        variant: can ? 'primary' : 'secondary',
        onClick: () => {
          if (can) onBuy(id);
        },
      }),
    );
  }
  return out;
}
