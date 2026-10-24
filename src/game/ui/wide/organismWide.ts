import type * as Phaser from 'phaser';
import { MAP, ORGANISM, type MapEnvironment, type Sector } from '../../../config';
import {
  averageHealth,
  canDischarge,
  illnessName,
  inheritedPoints,
  type OrganismState,
} from '../../../core/organism/organism';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { addButton } from '../button';
import { BODY_MAP_SIZE, drawBodyMap, drawInkBox } from '../icons';
import { effectText, FAMILY_NAMES, SECTOR_ORDER, SECTOR_STYLE, sources } from '../organismView';
import { bodyText, impactText, labelText, withShadow } from '../theme';
import { drawFramedPanel, type Obj } from './wideLayout';

const SIDE_W = 300;
const fmt = (n: number) => Math.floor(n).toLocaleString('pt-BR');

/** Cor da saúde no corpo: vermelho abaixo de 40, laranja, amarelo e verde acima de 70. */
function healthColor(v: number): number {
  return v < 40
    ? PALETTE.interaction
    : v < 55
      ? PALETTE.stress
      : v < 70
        ? PALETTE.sulfur
        : PALETTE.buff;
}

/** Local do corpo de cada setor (o primeiro local de map.json com aquele setor). */
function localOf(sector: Sector): string {
  return Object.values(MAP.environments).find((e) => e.sector === sector)?.name ?? '';
}

/**
 * Organismo no PC (prancheta "Menu no PC: Organismo"): o corpo com cada local pintado pela saúde
 * do setor e a ALTA à esquerda; os quatro setores em cartões 2×2 à direita.
 */
export function renderOrganismWide(
  scene: Phaser.Scene,
  area: { x: number; y: number; w: number; h: number },
  o: OrganismState,
  confirming: boolean,
  onDischarge: () => void,
): Obj[] {
  const boxes = scene.add.graphics();
  const g = scene.add.graphics();
  const out: Obj[] = [boxes, g];
  const x = area.x;
  let cy = area.y;
  out.push(
    scene.add.text(
      x,
      cy,
      `INDIVÍDUO ${o.individual} · CASO ATUAL`,
      labelText(10, PALETTE_CSS.cyan),
    ),
  );
  cy += 18;

  // ALTA no pé da coluna; o caso e o corpo ocupam o resto.
  const altaH = 220;
  const caseH = area.y + area.h - altaH - 10 - cy;
  drawInkBox(boxes, x, cy, SIDE_W, caseH, PALETTE.panelDeep);
  out.push(
    scene.add.text(
      x + 12,
      cy + 10,
      illnessName(o.individual),
      withShadow(impactText(22, '#FFFFFF'), PALETTE_CSS.outline, 2),
    ),
    scene.add
      .text(x + SIDE_W - 12, cy + 14, `${Math.round(averageHealth(o))}%`, {
        ...bodyText(15, PALETTE_CSS.text),
        fontStyle: '700',
      })
      .setOrigin(1, 0),
  );
  const scanY = cy + 46;
  const scanH = caseH - 46 - 12;
  const pixel = Math.max(2, Math.min(5, Math.floor((scanH - 16) / BODY_MAP_SIZE.rows)));
  const scanW = BODY_MAP_SIZE.cols * pixel + 24;
  g.fillStyle(PALETTE.ink).fillRect(x + 12, scanY, scanW, scanH);
  g.fillStyle(PALETTE.scanEdge).fillRect(x + 16, scanY + 4, scanW - 8, scanH - 8);
  g.fillStyle(PALETTE.scanBg).fillRect(x + 18, scanY + 6, scanW - 12, scanH - 12);
  g.fillStyle(PALETTE.scanLine);
  for (let ly = scanY + 6; ly < scanY + scanH - 6; ly += 6) g.fillRect(x + 18, ly, scanW - 12, 2);
  const sectorOf = (env: MapEnvironment) => MAP.environments[env].sector;
  drawBodyMap(
    g,
    x + 12 + Math.floor((scanW - BODY_MAP_SIZE.cols * pixel) / 2),
    scanY + Math.floor((scanH - BODY_MAP_SIZE.rows * pixel) / 2),
    pixel,
    (env) => {
      const s = sectorOf(env);
      return s ? healthColor(o.sectors[s]) : PALETTE.wineHi;
    },
  );
  out.push(scene.add.text(x + 22, scanY + 9, 'SCAN', labelText(8, PALETTE_CSS.cyan)));

  // Legenda: local, setor e o valor, na cor do corpo.
  const lx = x + 12 + scanW + 12;
  const lw = x + SIDE_W - 12 - lx;
  const legend: [string, Sector][] = [
    ['Cérebro', 'mental'],
    ['Pulmão', 'executive'],
    ['Fígado', 'social'],
    ['Intestino', 'physical'],
  ];
  let ly = scanY + 4;
  for (const [place, sector] of legend) {
    const v = Math.round(o.sectors[sector]);
    g.fillStyle(PALETTE.ink).fillRect(lx, ly + 2, 12, 12);
    g.fillStyle(healthColor(v)).fillRect(lx + 2, ly + 4, 8, 8);
    out.push(
      scene.add.text(lx + 18, ly, place, bodyText(13, PALETTE_CSS.text)),
      scene.add.text(
        lx + 18,
        ly + 18,
        `${ORGANISM.sectors[sector].name.toUpperCase()} ${v}`,
        labelText(8, PALETTE_CSS.muted),
      ),
    );
    ly += 40;
  }
  out.push(
    scene.add.text(lx, ly + 4, 'Cada local cura mais o setor dele.', {
      ...bodyText(11, PALETTE_CSS.textMuted),
      wordWrap: { width: lw },
    }),
  );

  out.push(
    ...altaPanel(scene, x, area.y + area.h - altaH, SIDE_W, altaH, o, confirming, onDischarge),
  );

  // Os quatro setores.
  const rx = x + SIDE_W + 20;
  const rw = area.x + area.w - rx;
  out.push(
    scene.add.text(rx, area.y, 'OS QUATRO SETORES', labelText(10, PALETTE_CSS.cyan)),
    scene.add
      .text(
        rx + rw,
        area.y,
        'A RUN MEXE NA SAÚDE NO FIM · O CAMPO LONGO, POR HORA',
        labelText(8, PALETTE_CSS.muted),
      )
      .setOrigin(1, 0),
  );
  const gap = 12;
  const cw = Math.floor((rw - gap) / 2);
  const ch = Math.floor((area.h - 18 - gap) / 2);
  SECTOR_ORDER.forEach((sector, i) => {
    const cx = rx + (i % 2) * (cw + gap);
    const sy = area.y + 18 + Math.floor(i / 2) * (ch + gap);
    out.push(...sectorCard(scene, boxes, g, cx, sy, cw, ch, sector, o.sectors[sector]));
  });
  return out;
}

function sectorCard(
  scene: Phaser.Scene,
  boxes: Phaser.GameObjects.Graphics,
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  sector: Sector,
  value: number,
): Obj[] {
  const v = Math.round(value);
  const low = v < 40;
  const def = ORGANISM.sectors[sector];
  const style = SECTOR_STYLE[sector];
  if (low) drawFramedPanel(boxes, x, y, w, h);
  else drawInkBox(boxes, x, y, w, h, PALETTE.panelDeep);
  const ix = x + 14;
  const iw = w - 28;
  const out: Obj[] = [];
  let cy = y + 12;
  g.fillStyle(PALETTE.ink).fillRect(ix, cy, 22, 22);
  g.fillStyle(style.color).fillRect(ix + 2, cy + 2, 18, 18);
  out.push(
    scene.add.text(ix + 11, cy + 11, style.label, labelText(10, PALETTE_CSS.ink)).setOrigin(0.5),
    scene.add.text(ix + 30, cy + 1, def.name, {
      ...bodyText(19, PALETTE_CSS.text),
      fontStyle: '700',
    }),
    scene.add
      .text(
        x + w - 14,
        cy - 4,
        String(v),
        withShadow(impactText(28, low ? PALETTE_CSS.numberHurt : '#FFFFFF'), PALETTE_CSS.ink, 3),
      )
      .setOrigin(1, 0),
  );
  if (low) {
    const t = scene.add.text(0, cy + 7, 'DOENÇA DO CASO', labelText(8, '#FFFFFF'));
    const name = out[out.length - 2] as Phaser.GameObjects.Text;
    const bx = name.x + name.width + 10;
    g.fillStyle(PALETTE.outline).fillRect(bx, cy + 2, t.width + 10, 18);
    g.fillStyle(PALETTE.interaction).fillRect(bx + 2, cy + 4, t.width + 6, 14);
    t.setX(bx + 5);
    out.push(t);
  }
  cy += 32;
  // Barra com o meio e a marca da ALTA.
  g.fillStyle(PALETTE.ink).fillRect(ix, cy, iw, 14);
  g.fillStyle(PALETTE.panel).fillRect(ix + 2, cy + 2, iw - 4, 10);
  g.fillStyle(style.color).fillRect(ix + 2, cy + 2, Math.round(((iw - 4) * value) / 100), 10);
  g.fillStyle(PALETTE.panelHi).fillRect(ix + Math.round(iw / 2), cy + 2, 2, 10);
  g.fillStyle(PALETTE.textLight).fillRect(
    ix + Math.round((iw * ORGANISM.healthyThreshold) / 100),
    cy - 4,
    2,
    22,
  );
  cy += 20;
  out.push(
    scene.add.text(
      ix,
      cy,
      `LOCAL: ${localOf(sector).toUpperCase()}`,
      labelText(8, PALETTE_CSS.muted),
    ),
    scene.add
      .text(
        ix + iw,
        cy,
        `ALTA A PARTIR DE ${ORGANISM.healthyThreshold}`,
        labelText(8, PALETTE_CSS.muted),
      )
      .setOrigin(1, 0),
  );
  cy += 18;
  const effect = effectText(sector, value);
  out.push(scene.add.text(ix, cy, 'EFEITO AGORA', labelText(8, PALETTE_CSS.cyan)));
  cy += 13;
  const eff = scene.add.text(ix, cy, effect || 'sem efeito (no meio)', {
    ...bodyText(
      13,
      !effect ? PALETTE_CSS.muted : v >= 50 ? PALETTE_CSS.numberHeal : PALETTE_CSS.numberHurt,
    ),
    fontStyle: '600',
    wordWrap: { width: iw },
  });
  out.push(eff);
  cy += eff.height + 6;
  const fam = scene.add.text(
    ix,
    cy,
    `Quanto mais baixo, mais ${def.families.map((f) => FAMILY_NAMES[f]).join(' e ')} aparecem na run.`,
    { ...bodyText(12, PALETTE_CSS.textSoft), wordWrap: { width: iw } },
  );
  out.push(fam);
  cy += fam.height + 6;
  const src = sources(sector);
  const lines: [string, string, string][] = [
    [
      `NA RUN · ${ORGANISM.run.minutesForFullEffect} MIN`,
      src.run || 'nenhum agente ainda',
      PALETTE_CSS.numberHeal,
    ],
    ['CAMPO LONGO', src.idle || 'nenhum agente ainda', PALETTE_CSS.gold],
    ['PIORAM', src.down || 'ninguém', PALETTE_CSS.numberHurt],
  ];
  for (const [label, text, color] of lines) {
    if (cy > y + h - 24) break;
    const l = scene.add.text(ix, cy + 2, label, labelText(8, color));
    const t = scene.add.text(ix + l.width + 8, cy, text, {
      ...bodyText(11, label === 'PIORAM' ? PALETTE_CSS.textMuted : PALETTE_CSS.text),
      wordWrap: { width: iw - l.width - 8 },
      maxLines: 2,
    });
    out.push(l, t);
    cy += t.height + 4;
  }
  return out;
}

function altaPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  o: OrganismState,
  confirming: boolean,
  onDischarge: () => void,
): Obj[] {
  const g = scene.add.graphics();
  drawFramedPanel(g, x, y, w, h);
  const ready = canDischarge(o);
  const points = inheritedPoints(o.atpEarned);
  const okCount = SECTOR_ORDER.filter((s) => o.sectors[s] >= ORGANISM.healthyThreshold).length;
  const ix = x + 16;
  const iw = w - 32;
  const out: Obj[] = [
    g,
    scene.add.text(
      ix,
      y + 14,
      'ALTA',
      impactText(20, ready ? PALETTE_CSS.goldIcon : PALETTE_CSS.numberHeal),
    ),
  ];
  const desc = scene.add.text(
    ix,
    y + 40,
    ready
      ? `Todos os setores passaram de ${ORGANISM.healthyThreshold}. O próximo indivíduo chega mais doente; você leva ${points} ponto(s) herdado(s). Zera o Laboratório, o campo longo e o ATP.`
      : `Abre quando os quatro setores passarem de ${ORGANISM.healthyThreshold}. O próximo indivíduo chega mais doente e herda pontos que rendem ATP.`,
    { ...bodyText(11, PALETTE_CSS.textSoft), wordWrap: { width: iw } },
  );
  out.push(desc);
  const rows: [string, string, string][] = [
    ['SETORES PRONTOS', `${okCount} de 4`, PALETTE_CSS.text],
    ['ATP NESTE INDIVÍDUO', fmt(o.atpEarned), PALETTE_CSS.text],
    [
      'HERDADOS',
      `${o.inherited} · +${Math.round(o.inherited * ORGANISM.inheritedAtpBonusPerPoint * 100)}% ATP`,
      PALETTE_CSS.gold,
    ],
  ];
  const by = y + h - 16 - 40;
  let ry = by - 6 - rows.length * 18;
  for (const [label, value, color] of rows) {
    out.push(
      scene.add.text(ix, ry + 2, label, labelText(8, PALETTE_CSS.muted)),
      scene.add
        .text(ix + iw, ry, value, { ...bodyText(13, color), fontStyle: '700' })
        .setOrigin(1, 0),
    );
    ry += 18;
  }
  out.push(
    addButton(scene, {
      x: ix,
      y: by,
      width: iw,
      height: 40,
      label: !ready ? 'DAR ALTA' : confirming ? 'CLIQUE DE NOVO PARA CONFIRMAR' : 'DAR ALTA',
      fontSize: confirming ? 12 : 16,
      variant: !ready ? 'secondary' : confirming ? 'danger' : 'primary',
      onClick: () => {
        if (ready) onDischarge();
      },
    }),
  );
  return out;
}
