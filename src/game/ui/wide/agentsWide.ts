import type * as Phaser from 'phaser';
import {
  AGENTS,
  IDLE,
  MAP,
  RUN,
  ORGANISM,
  WEAPONS,
  type AgentId,
  type MoleculeType,
  type PassiveId,
  type Sector,
  type WeaponId,
} from '../../../config';
import { isUnlocked, unlockCost } from '../../../core/meta/progress';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { addIcon, AGENT_TEXTURES, iconTexture, textureKey } from '../../render/textures';
import { addButton } from '../button';
import { KIND_NAMES, TYPE_NAMES, type Shop } from '../catalogViews';
import { drawCreamSlot, drawInkBox, drawWoodFrame } from '../icons';
import { addIconSlot, weaponIcon } from '../iconSlot';
import { SECTOR_ORDER, SECTOR_STYLE } from '../organismView';
import { bodyText, impactText, labelText, withShadow } from '../theme';
import { nativeGain } from '../upgradeText';
import { addZone, drawFocus, drawFramedPanel, type Obj } from './wideLayout';

const DETAIL_W = 372;
const fmt = (n: number) => n.toLocaleString('pt-BR');

export interface AgentsWideOptions {
  shop: Shop;
  /** Agente escolhido para a run. */
  selected: AgentId;
  /** Agente aberto na ficha. */
  view: AgentId;
  idleUnlocked: string[];
  onView: (id: AgentId) => void;
  onSelect: (id: AgentId) => void;
}

/** Sprite do agente encaixado numa caixa, na maior escala que couber. */
export function agentSprite(
  scene: Phaser.Scene,
  id: AgentId,
  cx: number,
  cy: number,
  w: number,
  h: number,
  locked = false,
): Phaser.GameObjects.Image {
  const img = scene.add.image(cx, cy, textureKey(AGENT_TEXTURES[id], 3));
  img.setScale(Math.min(w / img.width, h / img.height, 1));
  if (locked) img.setTint(0x5b6380).setAlpha(0.55);
  return img;
}

/** "FORTE CONTRA LIPÍDIOS" ou "MÉDIA CONTRA TUDO". */
export function affinityTag(id: AgentId): string {
  const strong = Object.entries(AGENTS[id].affinity)
    .filter(([, v]) => v === 'strong')
    .map(([t]) => TYPE_NAMES[t as MoleculeType]);
  return strong.length ? `FORTE CONTRA ${strong.join(', ')}` : 'MÉDIA CONTRA TUDO';
}

/**
 * Aba Agentes no PC (prancheta "Menu no PC: Agentes"): grade 3×3 dos agentes da run, os do campo
 * longo numa linha embaixo e a ficha do agente aberto à direita, com escolher ou desbloquear.
 */
export function renderAgentsWide(
  scene: Phaser.Scene,
  area: { x: number; y: number; w: number; h: number },
  o: AgentsWideOptions,
): Obj[] {
  const g = scene.add.graphics();
  const out: Obj[] = [g];
  const gridW = area.w - DETAIL_W - 20;
  const ids = Object.keys(AGENTS) as AgentId[];
  const open = ids.filter((id) => isUnlocked(o.shop.progress, 'agents', id)).length;
  out.push(
    scene.add.text(
      area.x,
      area.y,
      `AGENTES DA RUN · ${open}/${ids.length} LIBERADOS`,
      labelText(10, PALETTE_CSS.cyan),
    ),
    scene.add
      .text(area.x + gridW, area.y, 'CLIQUE PARA VER A FICHA', labelText(8, PALETTE_CSS.muted))
      .setOrigin(1, 0),
  );

  const idleH = 50;
  const cols = 3;
  const rows = Math.ceil(ids.length / cols);
  const gap = 10;
  const cardW = Math.floor((gridW - gap * (cols - 1)) / cols);
  const gridTop = area.y + 20;
  const cardH = Math.min(164, Math.floor((area.h - 20 - 26 - idleH - gap * (rows - 1) - 8) / rows));
  ids.forEach((id, i) => {
    const x = area.x + (i % cols) * (cardW + gap);
    const y = gridTop + Math.floor(i / cols) * (cardH + gap);
    out.push(...agentCard(scene, g, id, x, y, cardW, cardH, o));
  });

  // Agentes do campo longo: liberados lá, com o preço dos que faltam.
  const iy = gridTop + rows * (cardH + gap) + 6;
  out.push(
    scene.add.text(
      area.x,
      iy,
      'AGENTES DO IDLE · LIBERADOS NO CAMPO LONGO',
      labelText(10, PALETTE_CSS.cyan),
    ),
  );
  const idle = Object.entries(IDLE.agents);
  const chipW = Math.floor((gridW - 8 * (idle.length - 1)) / idle.length);
  idle.forEach(([id, a], i) => {
    const x = area.x + i * (chipW + 8);
    const on = o.idleUnlocked.includes(id) || !IDLE.unlockCost[id];
    drawInkBox(g, x, iy + 18, chipW, idleH - 8);
    out.push(
      scene.add.text(x + 10, iy + 24, a.name, {
        ...bodyText(13, on ? PALETTE_CSS.text : PALETTE_CSS.muted),
        fontStyle: '600',
      }),
      scene.add.text(
        x + 10,
        iy + 42,
        on ? 'LIBERADO' : `${fmt(IDLE.unlockCost[id] ?? 0)} ATP`,
        labelText(8, on ? PALETTE_CSS.numberHeal : PALETTE_CSS.muted),
      ),
    );
  });

  out.push(...agentDetail(scene, area.x + area.w - DETAIL_W, area.y, DETAIL_W, area.h, o));
  return out;
}

function agentCard(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  id: AgentId,
  x: number,
  y: number,
  w: number,
  h: number,
  o: AgentsWideOptions,
): Obj[] {
  const a = AGENTS[id];
  const locked = !isUnlocked(o.shop.progress, 'agents', id);
  const chosen = id === o.selected && !locked;
  const viewed = id === o.view;
  if (chosen) {
    g.fillStyle(PALETTE.outline).fillRect(x, y, w, h);
    g.fillStyle(PALETTE.wood).fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle(viewed ? PALETTE.panel : PALETTE.panelDeep).fillRect(x + 5, y + 5, w - 10, h - 10);
  } else {
    drawInkBox(g, x, y, w, h, viewed ? PALETTE.panel : PALETTE.panelDeep);
  }
  if (viewed) drawFocus(g, x - 4, y - 4, w + 8, h + 8);
  const slotH = Math.max(36, Math.min(70, h - 94));
  if (locked) drawInkBox(g, x + 8, y + 8, w - 16, slotH, PALETTE.panel);
  else {
    g.fillStyle(PALETTE.outline).fillRect(x + 8, y + 8, w - 16, slotH);
    drawCreamSlot(g, x + 11, y + 11, w - 22, slotH - 6);
  }
  const out: Obj[] = [
    agentSprite(scene, id, x + w / 2, y + 8 + slotH / 2, w - 40, slotH - 14, locked),
  ];
  const badge = chosen ? 'ESCOLHIDO' : locked ? `${fmt(unlockCost('agents', id))} ATP` : 'LIBERADO';
  const badgeColor = chosen
    ? PALETTE_CSS.gold
    : locked
      ? o.shop.atp >= unlockCost('agents', id)
        ? PALETTE_CSS.sectionOrange
        : PALETTE_CSS.muted
      : PALETTE_CSS.numberHeal;
  const badgeText = scene.add
    .text(x + w - 10, y + slotH + 18, badge, labelText(8, badgeColor))
    .setOrigin(1, 0);
  const name = scene.add.text(x + 10, y + slotH + 14, a.name, {
    ...bodyText(15, locked ? PALETTE_CSS.muted : PALETTE_CSS.text),
    fontStyle: '700',
    wordWrap: { width: w - 24 - badgeText.width },
  });
  const tag = scene.add.text(x + 10, name.y + name.height + 4, affinityTag(id), {
    ...labelText(8, locked ? '#5B6380' : PALETTE_CSS.cyan),
    wordWrap: { width: w - 20 },
    lineSpacing: 3,
  });
  out.push(name, badgeText, tag);
  if (a.synergy) {
    out.push(
      scene.add.text(
        x + 10,
        y + h - 20,
        `✚ ${MAP.environments[a.synergy.env].name.toUpperCase()}`,
        labelText(8, PALETTE_CSS.numberHeal),
      ),
    );
  }
  out.push(addZone(scene, x, y, w, h, () => o.onView(id)));
  return out;
}

/** Ficha do agente aberto: retrato, ação, especial, afinidade, perfil, sinergia e saúde. */
function agentDetail(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  o: AgentsWideOptions,
): Obj[] {
  const id = o.view;
  const a = AGENTS[id];
  const locked = !isUnlocked(o.shop.progress, 'agents', id);
  const chosen = id === o.selected && !locked;
  const g = scene.add.graphics();
  drawFramedPanel(g, x, y, w, h);
  const out: Obj[] = [g];
  const ix = x + 20;
  const iw = w - 40;
  let cy = y + 18;

  const badge = chosen ? 'ESCOLHIDO' : locked ? 'BLOQUEADO' : 'LIBERADO';
  out.push(
    scene.add.text(
      ix,
      cy,
      a.name,
      withShadow(impactText(26, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 3),
    ),
    scene.add
      .text(
        x + w - 20,
        cy + 10,
        badge,
        labelText(
          8,
          chosen ? PALETTE_CSS.gold : locked ? PALETTE_CSS.muted : PALETTE_CSS.numberHeal,
        ),
      )
      .setOrigin(1, 0),
  );
  cy += 38;
  const desc = scene.add.text(ix, cy, a.description, {
    ...bodyText(12, PALETTE_CSS.textSoft),
    wordWrap: { width: iw },
  });
  out.push(desc);
  cy += desc.height + 10;

  const portraitH = h >= 680 ? 112 : 84;
  drawWoodFrame(g, ix, cy, iw, portraitH);
  drawCreamSlot(g, ix + 7, cy + 7, iw - 14, portraitH - 14);
  out.push(
    agentSprite(scene, id, ix + iw / 2, cy + portraitH / 2, iw - 40, portraitH - 24, locked),
  );
  cy += portraitH + 12;

  // Ação e especial, com o ícone em moldura.
  const action = WEAPONS[a.action as WeaponId];
  const slot = addIconSlot(scene, ix, cy, 2, weaponIcon(a.action as WeaponId));
  out.push(
    ...slot.objects,
    scene.add.text(
      ix + slot.size + 10,
      cy + 4,
      `AÇÃO · ${KIND_NAMES[action.kind]}`,
      labelText(8, PALETTE_CSS.muted),
    ),
    scene.add.text(ix + slot.size + 10, cy + 18, action.name, {
      ...bodyText(15, PALETTE_CSS.text),
      fontStyle: '700',
    }),
  );
  cy += slot.size + 8;
  const sp = addIconSlot(scene, ix, cy, 2, {
    frame: 'passive',
    icon: iconTexture('specials', a.special.kind),
  });
  const spDesc = scene.add.text(ix + sp.size + 10, cy + 34, a.special.description, {
    ...bodyText(11, PALETTE_CSS.textSoft),
    wordWrap: { width: iw - sp.size - 10 },
  });
  out.push(
    ...sp.objects,
    scene.add.text(ix + sp.size + 10, cy + 4, 'ESPECIAL · ESPAÇO', labelText(8, PALETTE_CSS.muted)),
    scene.add.text(ix + sp.size + 10, cy + 16, a.special.name, {
      ...bodyText(15, PALETTE_CSS.text),
      fontStyle: '700',
    }),
    spDesc,
  );
  cy = Math.max(cy + sp.size, spDesc.y + spDesc.height) + 10;

  // Afinidade: forte em verde, média em azul, fraca apagada.
  const aff = Object.entries(a.affinity) as [MoleculeType, string][];
  const chips: [string, number, string][] = aff.length
    ? [
        ...aff
          .filter(([, v]) => v === 'strong')
          .map(
            ([t]) => [`FORTE · ${TYPE_NAMES[t]}`, 0x2e7a1e, '#FFFFFF'] as [string, number, string],
          ),
        ...aff
          .filter(([, v]) => v === 'neutral')
          .map(
            ([t]) =>
              [`MÉDIA · ${TYPE_NAMES[t]}`, PALETTE.panel, PALETTE_CSS.text] as [
                string,
                number,
                string,
              ],
          ),
        ...aff
          .filter(([, v]) => v === 'weak')
          .map(
            ([t]) =>
              [`FRACA · ${TYPE_NAMES[t]}`, PALETTE.panelDeep, PALETTE_CSS.muted] as [
                string,
                number,
                string,
              ],
          ),
      ]
    : [['MÉDIA CONTRA TUDO', PALETTE.panel, PALETTE_CSS.text]];
  let chipX = ix;
  for (const [text, fill, color] of chips) {
    const t = scene.add.text(0, 0, text, labelText(8, color));
    const cw = t.width + 12;
    if (chipX + cw > ix + iw) {
      chipX = ix;
      cy += 22;
    }
    drawInkBox(g, chipX, cy, cw, 19, fill);
    t.setPosition(chipX + 6, cy + 6);
    out.push(t);
    chipX += cw + 4;
  }
  cy += 28;

  // Perfil (receptor nativo) e sinergia.
  const native = a.nativeReceptor;
  out.push(addIcon(scene, ix, cy - 2, iconTexture('passives', native.icon as PassiveId), 16));
  const typeName = native.type ? TYPE_NAMES[native.type].toLowerCase() : '';
  const profile = scene.add.text(
    ix + 22,
    cy,
    `PERFIL: ${native.name.toUpperCase()} · ${nativeGain(native, typeName).toUpperCase()} A CADA ${RUN.nativeReceptor.everyLevels} NÍVEIS`,
    { ...labelText(8, PALETTE_CSS.gold), wordWrap: { width: iw - 22 }, lineSpacing: 3 },
  );
  out.push(profile);
  cy += profile.height + 8;
  if (a.synergy) {
    const env = MAP.environments[a.synergy.env].name.toUpperCase();
    const sector = ORGANISM.sectors[a.synergy.sector].name.toUpperCase();
    const barrier = a.crossesBloodBrainBarrier === false ? ' · ⊘ NÃO ENTRA NO CÉREBRO' : '';
    const syn = scene.add.text(
      ix,
      cy,
      `✚ ${env}: +${ORGANISM.synergy.health} ${sector}, COLATERAL PELA METADE${barrier}`,
      { ...labelText(8, PALETTE_CSS.numberHeal), wordWrap: { width: iw }, lineSpacing: 3 },
    );
    out.push(syn);
    cy += syn.height + 8;
  }
  // Saúde a cada 10 minutos de run: o que sobe e o colateral.
  const health = SECTOR_ORDER.flatMap((s: Sector) => {
    const parts: [string, string][] = [];
    const up = a.health?.[s] ?? 0;
    const down = a.collateral?.[s] ?? 0;
    if (up > 0) parts.push([`+${up} ${SECTOR_STYLE[s].label}`, colorOf(SECTOR_STYLE[s].color)]);
    if (down < 0) parts.push([`−${Math.abs(down)} ${SECTOR_STYLE[s].label}`, PALETTE_CSS.muted]);
    return parts;
  });
  const hl = scene.add.text(ix, cy + 2, 'SAÚDE A CADA 10 MIN', labelText(8, PALETTE_CSS.muted));
  out.push(hl);
  let hx = ix + hl.width + 10;
  for (const [text, color] of health) {
    const t = scene.add.text(hx, cy - 2, text, { ...bodyText(13, color), fontStyle: '700' });
    out.push(t);
    hx += t.width + 8;
  }

  // Botão do pé: escolher, escolhido, desbloquear ou quanto falta.
  const cost = unlockCost('agents', id);
  const can = locked && o.shop.atp >= cost;
  const label = chosen
    ? 'ESCOLHIDO'
    : !locked
      ? 'ESCOLHER · ENTER'
      : can
        ? `DESBLOQUEAR · ${fmt(cost)} ATP`
        : `FALTAM ${fmt(cost - Math.floor(o.shop.atp))} ATP`;
  out.push(
    addButton(scene, {
      x: ix,
      y: y + h - 20 - 50,
      width: iw,
      height: 50,
      label,
      fontSize: 16,
      variant: chosen || (locked && !can) ? 'secondary' : 'primary',
      sound: chosen ? null : !locked ? 'uiConfirm' : can ? 'uiUnlock' : 'uiError',
      onClick: () => {
        if (chosen) return;
        if (!locked) o.onSelect(id);
        else if (can) o.shop.onBuy('agents', id);
      },
    }),
  );
  return out;
}

const colorOf = (n: number) => `#${n.toString(16).padStart(6, '0').toUpperCase()}`;
