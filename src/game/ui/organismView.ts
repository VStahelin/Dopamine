import type * as Phaser from 'phaser';
import { AGENTS, IDLE, MAP, ORGANISM, type MoleculeType, type Sector } from '../../config';
import {
  averageHealth,
  canDischarge,
  effectValue,
  illnessName,
  individualDifficulty,
  inheritedPoints,
  type OrganismState,
} from '../../core/organism/organism';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addButton } from './button';
import { drawInkBox } from './icons';
import { bodyText, impactText, labelText } from './theme';

type Obj = Phaser.GameObjects.GameObject;

/** Cor e letra de cada setor (as barras do topo do Hub). */
export const SECTOR_STYLE: Record<Sector, { label: string; color: number }> = {
  physical: { label: 'F', color: PALETTE.interaction },
  mental: { label: 'M', color: PALETTE.chlorine },
  social: { label: 'S', color: PALETTE.progress },
  executive: { label: 'E', color: PALETTE.sulfur },
};

/** Ordem das barras do topo: F, M, S, E, como no mockup do menu. */
export const SECTOR_ORDER: Sector[] = ['physical', 'mental', 'social', 'executive'];

const FAMILY_NAMES: Record<MoleculeType, string> = {
  sugar: 'açúcares',
  lipid: 'lipídios',
  stress: 'hormônios do estresse',
  radical: 'radicais livres',
  toxin: 'toxinas',
  inflammation: 'inflamação',
};

const pct = (v: number) => `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`;
const int = (v: number) => `${v > 0 ? '+' : '−'}${Math.abs(Math.round(v))}`;

/** Efeito atual de um setor, em texto: "+12 interações", "−10% de recarga do especial". */
function effectText(sector: Sector, value: number): string {
  return ORGANISM.sectors[sector].effects
    .map((e) => {
      const v = effectValue(e, value);
      if (Math.abs(v) < 0.005) return '';
      if (e.stat === 'maxInteractions') return `${int(v)} interações`;
      if (e.stat === 'special.cooldown') return `${pct(v)} na recarga do especial`;
      if (e.stat === 'idleProduction') return `${pct(v)} no ATP do campo longo`;
      if (e.stat === 'rerolls') return Math.floor(v) !== 0 ? `${int(Math.floor(v))} rerrolar` : '';
      if (e.stat === 'choices')
        return Math.trunc(v) !== 0 ? `${int(Math.trunc(v))} opção no level up` : '';
      return `${e.stat} ${v.toFixed(2)}`;
    })
    .filter(Boolean)
    .join(' · ');
}

const dec = (v: number): string => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** O que mexe num setor, com os números: na run (a cada 10 min), no campo longo (por hora). */
function sources(sector: Sector): { run: string; idle: string; down: string } {
  const run = Object.values(AGENTS)
    .filter((a) => (a.health?.[sector] ?? 0) > 0)
    .map((a) => `${a.name} +${dec(a.health![sector]!)}`);
  // Pares com sinergia (fase 5.12): o agente no local dele soma mais neste setor.
  for (const a of Object.values(AGENTS)) {
    if (a.synergy?.sector !== sector) continue;
    const where = MAP.environments[a.synergy.env].name;
    const prep = a.synergy.env === 'blood' ? 'na' : 'no';
    run.push(`✚ ${a.name} ${prep} ${where} +${dec(ORGANISM.synergy.health)}`);
  }
  const idle = Object.values(IDLE.agents)
    .filter((a) => (a.healthPerHour?.[sector] ?? 0) > 0)
    .map((a) => `${a.name} +${dec(a.healthPerHour![sector]!)}/h`);
  const down = Object.values(AGENTS)
    .filter((a) => (a.collateral?.[sector] ?? 0) < 0)
    .map((a) => `${a.name} −${dec(Math.abs(a.collateral![sector]!))}`);
  return { run: run.join(', '), idle: idle.join(', '), down: down.join(', ') };
}

/**
 * Aba Organismo (fase 5): o indivíduo, a doença, os quatro setores com o efeito de cada um, quem
 * ajuda cada setor e a ALTA quando todos estão saudáveis.
 */
export function renderOrganism(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  o: OrganismState,
  confirming: boolean,
  onDischarge: () => void,
): Obj[] {
  const width = Math.min(w - 24, 420);
  const left = Math.floor(x + (w - width) / 2);
  // Caixas atrás, barras e marcas na frente (a altura de cada caixa só sai depois do texto).
  const boxes = scene.add.graphics();
  const g = scene.add.graphics();
  const out: Obj[] = [boxes, g];
  let cy = y;

  out.push(
    scene.add.text(
      left,
      cy,
      `INDIVÍDUO ${o.individual} · ${illnessName(o.individual).toUpperCase()}`,
      labelText(10, PALETTE_CSS.water),
    ),
    scene.add
      .text(
        left + width,
        cy,
        `SAÚDE ${Math.round(averageHealth(o))}%`,
        labelText(10, PALETTE_CSS.text),
      )
      .setOrigin(1, 0),
  );
  cy += 18;

  for (const sector of SECTOR_ORDER) {
    const value = o.sectors[sector];
    const def = ORGANISM.sectors[sector];
    const low = value < 30;
    out.push(
      scene.add.text(
        left + 12,
        cy + 8,
        def.name,
        impactText(14, low ? PALETTE_CSS.alert : PALETTE_CSS.text),
      ),
      scene.add
        .text(
          left + width - 12,
          cy + 8,
          String(Math.round(value)),
          impactText(14, PALETTE_CSS.text),
        )
        .setOrigin(1, 0),
    );
    // Barra do setor, com a marca da ALTA.
    const bx = left + 12;
    const bw = width - 24;
    g.fillStyle(PALETTE.ink).fillRect(bx, cy + 30, bw, 10);
    g.fillStyle(PALETTE.panelDeep).fillRect(bx + 2, cy + 32, bw - 4, 6);
    g.fillStyle(SECTOR_STYLE[sector].color).fillRect(
      bx + 2,
      cy + 32,
      Math.round(((bw - 4) * value) / 100),
      6,
    );
    g.fillStyle(PALETTE.textLight).fillRect(
      bx + 2 + Math.round(((bw - 4) * ORGANISM.healthyThreshold) / 100),
      cy + 28,
      2,
      14,
    );
    const effect = effectText(sector, value) || 'sem efeito (no meio)';
    const families = def.families.map((f) => FAMILY_NAMES[f]).join(' e ');
    out.push(
      scene.add.text(
        bx,
        cy + 44,
        effect,
        bodyText(10, low ? PALETTE_CSS.numberHurt : PALETTE_CSS.numberHeal),
      ),
    );
    // O que sobe e o que derruba o setor, com os números; o resto da caixa cresce com o texto.
    const src = sources(sector);
    const minutes = ORGANISM.run.minutesForFullEffect;
    const lines: [string, string][] = [
      [`NA RUN (a cada ${minutes} min): ${src.run || 'nenhum agente ainda'}`, PALETTE_CSS.text],
      [`NO CAMPO LONGO: ${src.idle || 'nenhum agente ainda'}`, PALETTE_CSS.text],
      ...(src.down
        ? ([[`DESCE COMO COLATERAL: ${src.down}`, PALETTE_CSS.alert]] as [string, string][])
        : []),
      [`Setor baixo traz ${families}.`, PALETTE_CSS.textSoft],
    ];
    let ty = cy + 60;
    for (const [text, color] of lines) {
      const t = scene.add.text(bx, ty, text, { ...bodyText(9, color), wordWrap: { width: bw } });
      out.push(t);
      ty += t.height + 3;
    }
    const h = ty - cy + 6;
    drawInkBox(boxes, left, cy, width, h, PALETTE.panel);
    cy += h + 6;
  }

  // Herança e ALTA.
  const points = inheritedPoints(o.atpEarned);
  const ready = canDischarge(o);
  const h = 120;
  drawInkBox(g, left, cy + 4, width, h, ready ? PALETTE.woodDark : PALETTE.panelDeep);
  out.push(
    scene.add.text(
      left + 12,
      cy + 12,
      'ALTA',
      impactText(16, ready ? PALETTE_CSS.goldIcon : PALETTE_CSS.textSoft),
    ),
    scene.add.text(
      left + 12,
      cy + 34,
      ready
        ? `Todos os setores passaram de ${ORGANISM.healthyThreshold}. O próximo indivíduo é mais doente (×${individualDifficulty(
            { ...o, individual: o.individual + 1 },
          )
            .toFixed(2)
            .replace(
              '.',
              ',',
            )} de dificuldade) e você leva ${points} ponto(s) herdado(s): +${Math.round(points * ORGANISM.inheritedAtpBonusPerPoint * 100)}% de ATP para sempre. Zera o Laboratório, o campo longo e o ATP; agentes e armas continuam.`
        : `Abre quando os quatro setores passarem de ${ORGANISM.healthyThreshold}. ATP ganho neste indivíduo: ${Math.floor(o.atpEarned).toLocaleString('pt-BR')} (vale ${points} ponto(s) herdado(s)). Já herdados: ${o.inherited} (+${Math.round(o.inherited * ORGANISM.inheritedAtpBonusPerPoint * 100)}% de ATP).`,
      { ...bodyText(9, PALETTE_CSS.cream), wordWrap: { width: width - 24 } },
    ),
  );
  if (ready) {
    out.push(
      addButton(scene, {
        x: left + 12,
        y: cy + h - 38,
        width: width - 24,
        height: 32,
        label: confirming ? 'TOQUE DE NOVO PARA CONFIRMAR' : 'DAR ALTA',
        fontSize: 12,
        variant: confirming ? 'danger' : 'primary',
        onClick: onDischarge,
      }),
    );
  }
  return out;
}
