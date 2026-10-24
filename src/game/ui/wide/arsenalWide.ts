import type * as Phaser from 'phaser';
import { AGENTS, PASSIVES, WEAPONS, type PassiveId, type WeaponId } from '../../../config';
import { isUnlocked } from '../../../core/meta/progress';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { buyButton, KIND_NAMES, type Shop } from '../catalogViews';
import { drawInkBox } from '../icons';
import { addIconSlot, passiveSlot, slotSize, weaponIcon } from '../iconSlot';
import { bodyText, labelText } from '../theme';
import { receptorGain } from '../upgradeText';
import type { Obj } from './wideLayout';

const SIDE_W = 392;

/**
 * Arsenal no PC (prancheta "Menu no PC: Arsenal"): cada arma da run numa linha com a receita
 * "arma + reagente = evolução", as ações dos agentes embaixo e, à direita, receptores em duas
 * colunas e os reagentes.
 */
export function renderArsenalWide(
  scene: Phaser.Scene,
  area: { x: number; y: number; w: number; h: number },
  shop: Shop,
): Obj[] {
  const g = scene.add.graphics();
  const out: Obj[] = [g];
  const leftW = area.w - SIDE_W - 20;
  const pool = (Object.keys(WEAPONS) as WeaponId[]).filter((i) => WEAPONS[i].source === 'pool');
  const open = pool.filter((id) => isUnlocked(shop.progress, 'weapons', id)).length;
  out.push(
    scene.add.text(
      area.x,
      area.y,
      `ARMAS · ${open}/${pool.length} LIBERADAS · CHEGAM PELO LEVEL UP`,
      labelText(10, PALETTE_CSS.cyan),
    ),
    scene.add
      .text(
        area.x + leftW,
        area.y,
        'ARMA NO MÁXIMO + REAGENTE = EVOLUÇÃO',
        labelText(8, PALETTE_CSS.muted),
      )
      .setOrigin(1, 0),
  );

  // Ações dos agentes ficam no pé; as receitas dividem o resto.
  const actionsH = slotSize(2) + 48;
  const rowGap = 6;
  const rowH = Math.min(
    62,
    Math.floor((area.h - 20 - 26 - actionsH - rowGap * pool.length) / pool.length),
  );
  const scale = rowH >= slotSize(2) + 8 ? 2 : 1;
  let cy = area.y + 20;
  for (const id of pool) {
    const w = WEAPONS[id];
    const locked = !isUnlocked(shop.progress, 'weapons', id);
    drawInkBox(g, area.x, cy, leftW, rowH, PALETTE.panelDeep);
    const mid = cy + rowH / 2;
    let x = area.x + 8;
    const weapon = addIconSlot(scene, x, mid - slotSize(scale) / 2, scale, {
      ...weaponIcon(id),
      dim: locked,
    });
    out.push(...weapon.objects);
    x += weapon.size + 10;
    out.push(
      scene.add.text(x, mid - 16, w.name, {
        ...bodyText(15, locked ? PALETTE_CSS.muted : PALETTE_CSS.text),
        fontStyle: '700',
      }),
      scene.add.text(x, mid + 4, KIND_NAMES[w.kind], labelText(8, PALETTE_CSS.muted)),
    );
    x += 158;
    const right = area.x + leftW - 12;
    if (w.evolution) {
      const reagent = w.evolution.reagent as PassiveId;
      const into = w.evolution.into as WeaponId;
      out.push(scene.add.text(x, mid, '+', bodyText(20, PALETTE_CSS.muted)).setOrigin(0, 0.5));
      x += 20;
      const r = addIconSlot(scene, x, mid - slotSize(1) / 2, 1, {
        ...passiveSlot(reagent, 0),
        label: undefined,
        dim: locked,
      });
      out.push(...r.objects);
      x += r.size + 6;
      out.push(
        scene.add
          .text(x, mid, PASSIVES[reagent].name, {
            ...bodyText(12, locked ? '#5B6380' : PALETTE_CSS.textSoft),
            wordWrap: { width: 66 },
          })
          .setOrigin(0, 0.5),
      );
      x += 70;
      out.push(scene.add.text(x, mid, '=', bodyText(20, PALETTE_CSS.muted)).setOrigin(0, 0.5));
      x += 20;
      const e = addIconSlot(scene, x, mid - slotSize(scale) / 2, scale, {
        ...weaponIcon(into),
        dim: locked,
      });
      out.push(...e.objects);
      x += e.size + 10;
      out.push(
        scene.add
          .text(x, mid, WEAPONS[into].name, {
            ...bodyText(14, locked ? '#5B6380' : PALETTE_CSS.gold),
            fontStyle: '700',
            wordWrap: { width: Math.max(40, right - 96 - x) },
          })
          .setOrigin(0, 0.5),
      );
    } else {
      out.push(
        scene.add
          .text(x, mid, 'SEM EVOLUÇÃO AINDA', labelText(8, PALETTE_CSS.muted))
          .setOrigin(0, 0.5),
      );
    }
    out.push(
      locked
        ? buyButton(scene, shop, 'weapons', id, right - 86, mid - 13, 86)
        : scene.add
            .text(right, mid, 'LIBERADA', labelText(8, PALETTE_CSS.numberHeal))
            .setOrigin(1, 0.5),
    );
    cy += rowH + rowGap;
  }

  // Ações dos agentes: vêm com o agente e não evoluem.
  cy += 6;
  out.push(
    scene.add.text(
      area.x,
      cy,
      'AÇÕES DOS AGENTES · VÊM COM O AGENTE, NÃO EVOLUEM',
      labelText(10, PALETTE_CSS.cyan),
    ),
  );
  cy += 18;
  const agents = Object.values(AGENTS);
  const boxH = actionsH - 18;
  drawInkBox(g, area.x, cy, leftW, boxH, PALETTE.panelDeep);
  const cellW = (leftW - 24) / agents.length;
  agents.forEach((a, i) => {
    const cx = area.x + 12 + cellW * i + cellW / 2;
    const slot = addIconSlot(scene, cx - slotSize(2) / 2, cy + 6, 2, {
      frame: 'passive',
      icon: weaponIcon(a.action as WeaponId).icon,
    });
    out.push(
      ...slot.objects,
      scene.add
        .text(cx, cy + 12 + slot.size, a.name.split(' ')[0]!, bodyText(11, PALETTE_CSS.textMuted))
        .setOrigin(0.5, 0),
    );
  });

  out.push(...sideColumn(scene, g, area.x + area.w - SIDE_W, area.y, SIDE_W, area.h, shop));
  return out;
}

/** Receptores em duas colunas e a grade de reagentes. */
function sideColumn(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  shop: Shop,
): Obj[] {
  const passives = Object.keys(PASSIVES) as PassiveId[];
  const receptors = passives.filter((p) => PASSIVES[p].kind === 'receptor');
  const reagents = passives.filter((p) => PASSIVES[p].kind === 'reagent');
  const open = receptors.filter((id) => isUnlocked(shop.progress, 'receptors', id)).length;
  const out: Obj[] = [
    scene.add.text(
      x,
      y,
      `RECEPTORES · ${open}/${receptors.length}`,
      labelText(10, PALETTE_CSS.cyan),
    ),
    scene.add.text(x + w, y, 'GANHO POR NÍVEL', labelText(8, PALETTE_CSS.muted)).setOrigin(1, 0),
  ];
  const reagentRows = Math.ceil(reagents.length / 4);
  const reagentH = reagentRows * (slotSize(1) + 6) + 10;
  const rows = Math.ceil(receptors.length / 2);
  const cellW = Math.floor((w - 6) / 2);
  const cellH = Math.min(46, Math.floor((h - 20 - 28 - reagentH - 6 * rows) / rows));
  receptors.forEach((id, i) => {
    const def = PASSIVES[id];
    const locked = !isUnlocked(shop.progress, 'receptors', id);
    const cx = x + (i % 2) * (cellW + 6);
    const cy = y + 20 + Math.floor(i / 2) * (cellH + 6);
    drawInkBox(g, cx, cy, cellW, cellH, PALETTE.panelDeep);
    const slot = addIconSlot(scene, cx + 6, cy + (cellH - slotSize(1)) / 2, 1, {
      ...passiveSlot(id, 0),
      label: undefined,
      dim: locked,
    });
    const tx = cx + 6 + slot.size + 8;
    out.push(
      ...slot.objects,
      scene.add.text(tx, locked ? cy + 4 : cy + cellH / 2 - 15, def.name, {
        ...bodyText(13, locked ? PALETTE_CSS.muted : PALETTE_CSS.text),
        fontStyle: '600',
      }),
    );
    if (locked) {
      out.push(buyButton(scene, shop, 'receptors', id, cx + cellW - 76, cy + cellH - 24, 70, 20));
    } else {
      out.push(
        scene.add.text(tx, cy + cellH / 2 + 4, receptorGain(def, def.perLevel), {
          ...bodyText(11, PALETTE_CSS.cyan),
          fixedWidth: cx + cellW - 6 - tx,
        }),
      );
    }
  });

  const ry = y + 20 + rows * (cellH + 6) + 26;
  out.push(
    scene.add.text(x, ry - 18, 'REAGENTES · SAEM DAS AMPOLAS', labelText(10, PALETTE_CSS.cyan)),
  );
  drawInkBox(g, x, ry, w, reagentH, PALETTE.panelDeep);
  const rw = (w - 16) / 4;
  reagents.forEach((id, i) => {
    const cx = x + 8 + (i % 4) * rw;
    const cy = ry + 8 + Math.floor(i / 4) * (slotSize(1) + 6);
    const slot = addIconSlot(scene, cx, cy, 1, { ...passiveSlot(id, 0), label: undefined });
    out.push(
      ...slot.objects,
      scene.add
        .text(cx + slot.size + 6, cy + slot.size / 2, PASSIVES[id].name, {
          ...bodyText(12, PALETTE_CSS.textSoft),
          wordWrap: { width: rw - slot.size - 10 },
        })
        .setOrigin(0, 0.5),
    );
  });
  return out;
}
