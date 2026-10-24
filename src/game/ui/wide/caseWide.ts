import type * as Phaser from 'phaser';
import { AGENTS, MAP, META, ORGANISM, WEAPONS, type AgentId, type WeaponId } from '../../../config';
import { achievementFraction, nextAchievement, rewardLabel } from '../../../core/meta/achievements';
import { isUnlocked, unlockCost } from '../../../core/meta/progress';
import type { SaveData } from '../../../core/save/saveData';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { iconTexture } from '../../render/textures';
import { achievementBadge, progressText } from '../achievementsView';
import { drawCreamSlot, drawInkBox, drawWoodFrame } from '../icons';
import { addIconSlot, weaponIcon } from '../iconSlot';
import { SECTOR_ORDER, SECTOR_STYLE } from '../organismView';
import { bodyText, formatTime, impactText, labelText, withShadow } from '../theme';
import { agentSprite } from './agentsWide';
import { addZone, drawFramedPanel, type Obj } from './wideLayout';

const fmt = (n: number) => n.toLocaleString('pt-BR');

export interface CaseAgentOptions {
  selected: AgentId;
  /** Clique num agente liberado: escolhe. Num bloqueado: abre a ficha na aba Agentes. */
  onPick: (id: AgentId) => void;
  onOpenSheet: () => void;
}

/** Coluna esquerda do Caso no PC: o agente escolhido em destaque e a lista para trocar. */
export function renderCaseAgent(
  scene: Phaser.Scene,
  area: { x: number; y: number; w: number; h: number },
  save: SaveData,
  o: CaseAgentOptions,
): Obj[] {
  const g = scene.add.graphics();
  const out: Obj[] = [g];
  const { x, w } = area;
  const id = o.selected;
  const a = AGENTS[id];
  out.push(
    scene.add.text(x, area.y, 'AGENTE DA RUN', labelText(10, PALETTE_CSS.cyan)),
    scene.add
      .text(x + w, area.y, 'FICHA COMPLETA ›', labelText(8, PALETTE_CSS.sectionOrange))
      .setOrigin(1, 0),
    addZone(scene, x + w - 110, area.y - 4, 110, 18, o.onOpenSheet),
  );

  // Cartão do escolhido.
  let cy = area.y + 18;
  const cardTop = cy;
  const ix = x + 14;
  const iw = w - 28;
  cy += 14;
  drawWoodFrame(g, ix, cy, iw, 84);
  drawCreamSlot(g, ix + 7, cy + 7, iw - 14, 70);
  const sprite = agentSprite(scene, id, ix + iw / 2, cy + 42, iw - 40, 60);
  cy += 92;
  const name = scene.add.text(
    ix,
    cy,
    a.name,
    withShadow(impactText(22, '#FFFFFF'), PALETTE_CSS.outline, 2),
  );
  const chosen = scene.add
    .text(ix + iw, cy + 8, 'ESCOLHIDO', labelText(8, PALETTE_CSS.gold))
    .setOrigin(1, 0);
  cy += 32;
  const rows: [Obj[], string][] = [];
  const act = addIconSlot(scene, ix, cy, 1, weaponIcon(a.action as WeaponId));
  rows.push([act.objects, `Ação: ${WEAPONS[a.action as WeaponId].name}`]);
  const sp = addIconSlot(scene, ix, cy + act.size + 6, 1, {
    frame: 'passive',
    icon: iconTexture('specials', a.special.kind),
  });
  rows.push([sp.objects, `Especial: ${a.special.name}`]);
  const lines = rows.map(([, text], i) =>
    scene.add
      .text(
        ix + act.size + 8,
        cy + i * (act.size + 6) + act.size / 2,
        text,
        bodyText(13, PALETTE_CSS.text),
      )
      .setOrigin(0, 0.5),
  );
  cy += 2 * (act.size + 6) + 2;
  out.push(sprite, name, chosen, ...rows.flatMap(([objs]) => objs), ...lines);
  if (a.synergy) {
    const env = MAP.environments[a.synergy.env].name.toUpperCase();
    const sector = ORGANISM.sectors[a.synergy.sector].name.toUpperCase();
    const barrier = a.crossesBloodBrainBarrier === false ? ' · ⊘ CÉREBRO' : '';
    const syn = scene.add.text(ix, cy, `✚ ${env}: ${sector}${barrier}`, {
      ...labelText(8, PALETTE_CSS.numberHeal),
      wordWrap: { width: iw },
      lineSpacing: 3,
    });
    out.push(syn);
    cy += syn.height + 4;
  }
  cy += 10;
  const cardG = scene.add.graphics();
  drawFramedPanel(cardG, x, cardTop, w, cy - cardTop);
  out.unshift(cardG);

  // Lista dos agentes: o escolhido em madeira, os bloqueados apagados com o preço.
  cy += 8;
  const ids = Object.keys(AGENTS) as AgentId[];
  const listH = area.y + area.h - cy;
  drawInkBox(g, x, cy, w, listH, PALETTE.panelDeep);
  const rowH = Math.max(26, Math.min(38, Math.floor((listH - 12) / ids.length) - 4));
  ids.forEach((aid, i) => {
    const ry = cy + 6 + i * (rowH + 4);
    const locked = !isUnlocked(save.meta, 'agents', aid);
    const on = aid === id;
    if (on) {
      g.fillStyle(PALETTE.outline).fillRect(x + 6, ry, w - 12, rowH);
      g.fillStyle(PALETTE.wood).fillRect(x + 8, ry + 2, w - 16, rowH - 4);
    } else {
      g.fillStyle(PALETTE.panel).fillRect(x + 6, ry, w - 12, rowH);
    }
    if (locked) g.fillStyle(PALETTE.panelDeep).fillRect(x + 12, ry + 3, 46, rowH - 6);
    else drawCreamSlot(g, x + 12, ry + 3, 46, rowH - 6);
    const cost = unlockCost('agents', aid);
    const right = on ? 'ATUAL' : locked ? `${fmt(cost)} ATP` : '';
    const rightColor = on
      ? '#FFFFFF'
      : save.atp >= cost
        ? PALETTE_CSS.sectionOrange
        : PALETTE_CSS.muted;
    const r = scene.add
      .text(x + w - 14, ry + rowH / 2, right, labelText(8, rightColor))
      .setOrigin(1, 0.5);
    out.push(
      agentSprite(scene, aid, x + 35, ry + rowH / 2, 40, rowH - 10, locked),
      scene.add
        .text(x + 66, ry + rowH / 2, AGENTS[aid].name, {
          ...bodyText(14, on ? '#FFFFFF' : locked ? PALETTE_CSS.muted : PALETTE_CSS.text),
          fontStyle: '600',
          fixedWidth: w - 66 - 20 - r.width,
        })
        .setOrigin(0, 0.5),
      r,
      addZone(scene, x + 6, ry, w - 12, rowH, () => o.onPick(aid)),
    );
  });
  return out;
}

/** Coluna direita do Caso no PC: setores, próxima conquista e recordes. */
export function renderCaseGoals(
  scene: Phaser.Scene,
  area: { x: number; y: number; w: number; h: number },
  save: SaveData,
  onOrganism: () => void,
  onAchievements: () => void,
  onRecords: () => void,
): Obj[] {
  const boxes = scene.add.graphics();
  const g = scene.add.graphics();
  const out: Obj[] = [boxes, g];
  const { x, w } = area;
  let cy = area.y;
  out.push(
    scene.add.text(x, cy, 'ORGANISMO', labelText(10, PALETTE_CSS.cyan)),
    scene.add.text(x + w, cy, 'ABRIR ›', labelText(8, PALETTE_CSS.sectionOrange)).setOrigin(1, 0),
    addZone(scene, x + w - 70, cy - 4, 70, 18, onOrganism),
  );
  cy += 18;
  const boxTop = cy;
  cy += 12;
  for (const sector of SECTOR_ORDER) {
    const v = Math.round(save.organism.sectors[sector]);
    const bx = x + 12 + 80;
    const bw = w - 24 - 80 - 32;
    out.push(
      scene.add.text(x + 12, cy, ORGANISM.sectors[sector].name, {
        ...bodyText(14, PALETTE_CSS.text),
        fontStyle: '600',
      }),
      scene.add
        .text(x + w - 12, cy, String(v), {
          ...bodyText(14, v < 40 ? PALETTE_CSS.numberHurt : PALETTE_CSS.text),
          fontStyle: '700',
        })
        .setOrigin(1, 0),
    );
    g.fillStyle(PALETTE.ink).fillRect(bx, cy + 3, bw, 12);
    g.fillStyle(PALETTE.panel).fillRect(bx + 2, cy + 5, bw - 4, 8);
    g.fillStyle(SECTOR_STYLE[sector].color).fillRect(
      bx + 2,
      cy + 5,
      Math.round(((bw - 4) * v) / 100),
      8,
    );
    g.fillStyle(PALETTE.textLight).fillRect(
      bx + Math.round((bw * ORGANISM.healthyThreshold) / 100),
      cy,
      2,
      18,
    );
    cy += 26;
  }
  const note = scene.add.text(
    x + 12,
    cy,
    `A ALTA abre com os quatro acima da marca de ${ORGANISM.healthyThreshold}.`,
    { ...bodyText(11, PALETTE_CSS.textMuted), wordWrap: { width: w - 24 } },
  );
  out.push(note);
  cy += note.height + 12;
  drawInkBox(boxes, x, boxTop, w, cy - boxTop, PALETTE.panelDeep);
  out.push(addZone(scene, x, boxTop, w, cy - boxTop, onOrganism));

  // Próxima conquista.
  cy += 14;
  out.push(
    scene.add.text(
      x,
      cy,
      `PRÓXIMA CONQUISTA · ${save.achievements.length}/${META.achievements.length}`,
      labelText(10, PALETTE_CSS.cyan),
    ),
  );
  cy += 18;
  const next = nextAchievement(save);
  const achTop = cy;
  if (next) {
    const state = achievementFraction(next, save) > 0 ? 'progress' : 'none';
    out.push(achievementBadge(scene, g, next, x + 12, cy + 10, state, 26));
    const reward = scene.add
      .text(
        x + w - 12,
        cy + 14,
        rewardLabel(next, { agents: AGENTS, weapons: WEAPONS }),
        labelText(8, PALETTE_CSS.gold),
      )
      .setOrigin(1, 0);
    const name = scene.add.text(x + 52, cy + 10, next.name, {
      ...bodyText(15, PALETTE_CSS.text),
      fontStyle: '700',
      fixedWidth: w - 52 - 16 - reward.width,
    });
    const desc = scene.add.text(x + 52, cy + 30, next.description, {
      ...bodyText(12, PALETTE_CSS.textSoft),
      wordWrap: { width: w - 64 },
    });
    out.push(reward, name, desc);
    cy = Math.max(cy + 46, desc.y + desc.height + 6);
    const bw = w - 24;
    g.fillStyle(PALETTE.ink).fillRect(x + 12, cy, bw, 12);
    g.fillStyle(PALETTE.panel).fillRect(x + 14, cy + 2, bw - 4, 8);
    g.fillStyle(PALETTE.water).fillRect(
      x + 14,
      cy + 2,
      Math.round((bw - 4) * achievementFraction(next, save)),
      8,
    );
    cy += 16;
    out.push(
      scene.add
        .text(
          x + w - 12,
          cy,
          progressText(next, save).replace('/', ' de '),
          bodyText(11, PALETTE_CSS.textMuted),
        )
        .setOrigin(1, 0),
    );
    cy += 22;
  } else {
    out.push(
      scene.add.text(
        x + 12,
        cy + 12,
        'Todas as conquistas saíram.',
        bodyText(13, PALETTE_CSS.gold),
      ),
    );
    cy += 40;
  }
  drawInkBox(boxes, x, achTop, w, cy - achTop, PALETTE.panelDeep);
  out.push(addZone(scene, x, achTop, w, cy - achTop, onAchievements));

  // Recordes em 2×2.
  cy += 14;
  out.push(scene.add.text(x, cy, 'RECORDES', labelText(10, PALETTE_CSS.cyan)));
  cy += 18;
  const r = save.records;
  const cells: [string, string][] = [
    ['MELHOR TEMPO', formatTime(r.bestTimeSeconds)],
    ['NÍVEL', String(r.bestLevel)],
    ['DECOMPOSTAS', fmt(r.mostKills)],
    ['RUNS', fmt(r.runs)],
  ];
  const cw = Math.floor((w - 6) / 2);
  const ch = Math.min(52, Math.floor((area.y + area.h - cy - 6) / 2));
  cells.forEach(([label, value], i) => {
    const cx = x + (i % 2) * (cw + 6);
    const ry = cy + Math.floor(i / 2) * (ch + 6);
    drawInkBox(boxes, cx, ry, cw, ch, PALETTE.panelDeep);
    out.push(
      scene.add.text(cx + 10, ry + 8, label, labelText(8, PALETTE_CSS.muted)),
      scene.add.text(cx + 10, ry + 22, value, {
        ...bodyText(18, PALETTE_CSS.text),
        fontStyle: '700',
      }),
    );
  });
  out.push(addZone(scene, x, cy, w, 2 * ch + 6, onRecords));
  return out;
}
