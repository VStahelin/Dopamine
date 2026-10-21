import type * as Phaser from 'phaser';
import { PASSIVES, STATS, WEAPONS, type PassiveId, type RunStatKey } from '../../config';
import type { RunState } from '../../core/run/state';
import { statDef } from '../../core/run/stats';
import { weaponMaxLevel } from '../../core/run/weaponParams';
import { paramsOf } from '../../core/run/weapons';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { iconTexture } from '../render/textures';
import { addIconSlot, passiveSlot, rowSlots, weaponSlot, type SlotContent } from './iconSlot';
import { statDelta, statTrend, statValue } from './statText';
import { bodyText, formatTime, labelText, withShadow, impactText } from './theme';

/**
 * Conteúdo das abas da pausa (docs/ui-cronico.md, prancheta "Crônico: pausa e status"). Cada
 * linha vira um container próprio, para a pausa rolar a lista mostrando só as linhas inteiras.
 */
export interface PauseRow {
  container: Phaser.GameObjects.Container;
  height: number;
}

type Build = (scene: Phaser.Scene, width: number) => PauseRow;

const ROW_GAP = 6;
const SLOTS = 6;

const num = (v: number) => Math.round(v).toLocaleString('pt-BR');
const dec = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function row(
  scene: Phaser.Scene,
  height: number,
  children: Phaser.GameObjects.GameObject[],
): PauseRow {
  return { container: scene.add.container(0, 0, children), height: height + ROW_GAP };
}

/** Título de seção com contagem à direita. */
function header(text: string, color: string, right = ''): Build {
  return (scene, width) =>
    row(scene, 14, [
      scene.add.text(0, 0, text, labelText(10, color)),
      scene.add.text(width, 0, right, labelText(10, color)).setOrigin(1, 0),
    ]);
}

/** Caixa escura das linhas de item. */
function box(scene: Phaser.Scene, width: number, height: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.ink).fillRect(0, 0, width, height);
  g.fillStyle(PALETTE.panelDeep).fillRect(2, 2, width - 4, height - 4);
  return g;
}

function pips(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  level: number,
  max: number,
  size: { w: number; h: number },
  color: number,
): void {
  for (let i = 0; i < max; i++) {
    g.fillStyle(i < level ? (level >= max ? PALETTE.sulfur : color) : PALETTE.panel);
    g.fillRect(x + i * (size.w + 2), y, size.w, size.h);
  }
}

/** Linha de arma: ícone, nome, nível, pips, números atuais e a dica de evolução. */
function weaponRow(run: RunState, index: number): Build {
  return (scene, width) => {
    const w = run.weapons[index]!;
    const def = WEAPONS[w.id];
    const max = weaponMaxLevel(def);
    const evolved = def.source === 'evolution';
    const p = paramsOf(run, w, index);
    const numbers = [
      `Dano ${dec(p.damage)}`,
      p.count > 1 ? `${p.count}×` : '',
      p.cooldownSeconds > 0 ? `${dec(p.cooldownSeconds)} s` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const reagent = def.evolution ? PASSIVES[def.evolution.reagent as PassiveId] : undefined;
    const into = def.evolution ? WEAPONS[def.evolution.into as keyof typeof WEAPONS] : undefined;
    const hint = evolved
      ? 'ARMA EVOLUÍDA'
      : reagent && into
        ? `NV ${max} + ${reagent.name.toUpperCase()} → ${into.name.toUpperCase()}`
        : '';
    const height = hint ? 64 : 54;
    const g = box(scene, width, height);
    const slot = addIconSlot(scene, 6, 6, 2, weaponSlot(w));
    const tx = 6 + slot.size + 8;
    if (!evolved) pips(g, tx, 22, w.level, max, { w: 10, h: 4 }, PALETTE.wood);
    const level = evolved ? 'EVO' : w.level >= max ? 'MAX' : `NV ${w.level}/${max}`;
    const gold = evolved || w.level >= max;
    const children: Phaser.GameObjects.GameObject[] = [
      g,
      ...slot.objects,
      scene.add.text(
        tx,
        4,
        def.name,
        bodyText(13, evolved ? PALETTE_CSS.goldHi : PALETTE_CSS.text),
      ),
      scene.add
        .text(width - 6, 6, level, labelText(9, gold ? PALETTE_CSS.goldIcon : PALETTE_CSS.textSoft))
        .setOrigin(1, 0),
      scene.add.text(tx, evolved ? 22 : 30, numbers, bodyText(10, PALETTE_CSS.textSoft)),
    ];
    if (hint) {
      children.push(scene.add.text(tx, height - 16, hint, labelText(7, PALETTE_CSS.goldIcon)));
    }
    return row(scene, height, children);
  };
}

/** Espaço vazio ou bloqueado, dizendo como liberar. */
function slotRow(content: SlotContent, kind: 'arma' | 'modificador', scale: number): Build {
  return (scene, width) => {
    const locked = content.frame === 'locked';
    const height = scale === 2 ? 52 : 34;
    const slot = addIconSlot(scene, 6, 5, scale, content);
    const tx = 6 + slot.size + 8;
    const title = locked ? 'Bloqueado' : 'Espaço livre';
    const text = locked
      ? `Libera com Espaços de ${kind}`
      : kind === 'arma'
        ? 'Uma arma nova pode entrar no próximo level up'
        : 'Um modificador novo pode entrar no próximo level up';
    return row(scene, height, [
      box(scene, width, height),
      ...slot.objects,
      scene.add.text(tx, scale === 2 ? 8 : 4, title, bodyText(12, PALETTE_CSS.muted)),
      scene.add.text(tx, scale === 2 ? 26 : 18, text, bodyText(9, PALETTE_CSS.muted)),
    ]);
  };
}

/** Linha de reagente: ícone, nome, pips e o efeito somado. */
function passiveRow(run: RunState, id: PassiveId): Build {
  return (scene, width) => {
    const state = run.passives[id]!;
    const def = PASSIVES[id];
    const height = 34;
    const g = box(scene, width, height);
    const slot = addIconSlot(scene, 6, 5, 1, { ...passiveSlot(id, state.level), label: undefined });
    const pipsW = def.maxLevel * 8;
    pips(g, width - 70 - pipsW, 14, state.level, def.maxLevel, { w: 6, h: 6 }, PALETTE.water);
    return row(scene, height, [
      g,
      ...slot.objects,
      scene.add.text(6 + slot.size + 8, 9, def.name, bodyText(12, PALETTE_CSS.text)),
      scene.add
        .text(width - 8, 9, statDelta(def.stat, state.bonus), bodyText(11, PALETTE_CSS.numberHeal))
        .setOrigin(1, 0),
    ]);
  };
}

/** Efeitos ativos: o especial e a queda depois dele. */
function effectRows(run: RunState): Build[] {
  const def = run.rules.agents[run.agentId].special;
  const icon = iconTexture('specials', def.kind);
  const list: { frame: 'buff' | 'debuff'; name: string; left: number }[] = [];
  if (run.special.active > 0)
    list.push({ frame: 'buff', name: def.name, left: run.special.active });
  if (run.special.crash > 0) list.push({ frame: 'debuff', name: 'Queda', left: run.special.crash });
  return list.map((e) => (scene, width) => {
    const slot = addIconSlot(scene, 6, 5, 1, { frame: e.frame, icon });
    const color = e.frame === 'buff' ? PALETTE_CSS.numberHeal : PALETTE_CSS.numberHurt;
    return row(scene, 34, [
      box(scene, width, 34),
      ...slot.objects,
      scene.add.text(6 + slot.size + 8, 9, e.name, bodyText(12, PALETTE_CSS.text)),
      scene.add.text(width - 8, 9, `${Math.ceil(e.left)} s`, bodyText(11, color)).setOrigin(1, 0),
    ]);
  });
}

/** Aba Arsenal: armas, reagentes e efeitos, com os espaços livres e bloqueados. */
export function arsenalRows(run: RunState): Build[] {
  const weaponOpen = Math.floor(run.stats.weaponSlots);
  const held = (Object.keys(run.passives) as PassiveId[]).filter(
    (id) => (run.passives[id]?.level ?? 0) > 0,
  );
  const passiveOpen =
    Math.floor(run.stats.modifierSlots) + held.filter((id) => PASSIVES[id].freeSlot).length;
  const weaponFill = rowSlots(
    run.weapons.map((w) => weaponSlot(w)),
    weaponOpen,
    SLOTS,
  ).slice(run.weapons.length);
  const passiveFill = rowSlots(
    held.map((id) => passiveSlot(id, run.passives[id]!.level)),
    passiveOpen,
    SLOTS,
  ).slice(held.length);
  const effects = effectRows(run);
  return [
    header('ARMAS', PALETTE_CSS.sectionOrange, `${run.weapons.length}/${weaponOpen}`),
    ...run.weapons.map((_, i) => weaponRow(run, i)),
    ...weaponFill.map((c) => slotRow(c, 'arma', 2)),
    header('REAGENTES', PALETTE_CSS.cyan, `${held.length}/${passiveOpen}`),
    ...held.map((id) => passiveRow(run, id)),
    ...passiveFill.map((c) => slotRow(c, 'modificador', 1)),
    ...(effects.length > 0
      ? [header('EFEITOS ATIVOS', PALETTE_CSS.textSoft, String(effects.length)), ...effects]
      : []),
  ];
}

const STAT_GROUPS: [keyof typeof STATS, string][] = [
  ['offense', 'OFENSIVOS'],
  ['defense', 'DEFENSIVOS'],
  ['mobility', 'MOBILIDADE E COLETA'],
  ['levelUp', 'LEVEL UP'],
  ['risk', 'RISCO'],
];

/** Aba Atributos: valor atual, base em cinza; verde se melhor, vermelho se pior. */
export function statRows(run: RunState): Build[] {
  const out: Build[] = [];
  for (const [group, title] of STAT_GROUPS) {
    out.push((scene, width) => {
      const g = scene.add.graphics();
      g.fillStyle(PALETTE.panel).fillRect(0, 15, width, 2);
      return row(scene, 18, [
        g,
        scene.add.text(0, 0, title, labelText(10, PALETTE_CSS.sectionOrange)),
      ]);
    });
    for (const key of Object.keys(STATS[group]) as RunStatKey[]) {
      out.push((scene, width) => {
        const value = run.stats[key];
        const base = statDef(run.rules, key).base;
        const trend = statTrend(key, value, base);
        const color =
          trend === 'better'
            ? PALETTE_CSS.numberHeal
            : trend === 'worse'
              ? PALETTE_CSS.numberHurt
              : PALETTE_CSS.text;
        const shown =
          key === 'maxInteractions'
            ? `${Math.ceil(run.agent.interactions)}/${Math.round(value)}`
            : statValue(key, value);
        const children: Phaser.GameObjects.GameObject[] = [
          scene.add.text(0, 0, statDef(run.rules, key).name, bodyText(12, PALETTE_CSS.text)),
          scene.add.text(width, 0, shown, bodyText(12, color)).setOrigin(1, 0),
        ];
        if (trend !== 'same') {
          children.push(
            scene.add
              .text(width - 70, 3, `base ${statValue(key, base)}`, labelText(7, PALETTE_CSS.muted))
              .setOrigin(1, 0),
          );
        }
        return { container: scene.add.container(0, 0, children), height: 18 };
      });
    }
    out.push((scene) => ({ container: scene.add.container(0, 0), height: 6 }));
  }
  return out;
}

/** Aba Run: números da run, dano por arma e quanto falta para o recorde. */
export function runRows(run: RunState, bestTimeSeconds: number): Build[] {
  const tiles: [string, string, string][] = [
    ['TEMPO', formatTime(run.time), PALETTE_CSS.white],
    ['NÍVEL', String(run.level), PALETTE_CSS.cyan],
    ['DECOMPOSTAS', num(run.kills), PALETTE_CSS.white],
    ['CRÍTICOS', num(run.tally.crits), PALETTE_CSS.goldIcon],
    ['INTERAÇÕES PERDIDAS', num(run.tally.interactionsLost), PALETTE_CSS.numberHurt],
    ['ARMAS', String(run.weapons.length), PALETTE_CSS.white],
  ];
  const out: Build[] = [];
  for (let i = 0; i < tiles.length; i += 2) {
    const pair = tiles.slice(i, i + 2);
    out.push((scene, width) => {
      const tw = Math.floor((width - 6) / 2);
      const children = pair.flatMap(([label, value, color], k) => {
        const x = k * (tw + 6);
        const g = scene.add.graphics();
        g.fillStyle(PALETTE.ink).fillRect(x, 0, tw, 46);
        g.fillStyle(PALETTE.panelDeep).fillRect(x + 2, 2, tw - 4, 42);
        return [
          g,
          scene.add.text(x + 8, 7, label, labelText(7, PALETTE_CSS.textSoft)),
          scene.add.text(x + 8, 18, value, withShadow(impactText(18, color), PALETTE_CSS.ink, 2)),
        ];
      });
      return row(scene, 46, children);
    });
  }

  const damage = run.weapons
    .map((w) => ({ name: WEAPONS[w.id].name, value: run.tally.damageByWeapon[w.id] ?? 0 }))
    .sort((a, b) => b.value - a.value);
  const top = Math.max(1, damage[0]?.value ?? 0);
  out.push(header('DANO POR ARMA', PALETTE_CSS.sectionOrange));
  for (const d of damage) {
    out.push((scene, width) => {
      const g = scene.add.graphics();
      g.fillStyle(PALETTE.ink).fillRect(0, 17, width, 10);
      g.fillStyle(PALETTE.panelDeep).fillRect(2, 19, width - 4, 6);
      g.fillStyle(PALETTE.water).fillRect(2, 19, Math.round(((width - 4) * d.value) / top), 6);
      return row(scene, 27, [
        g,
        scene.add.text(0, 0, d.name, bodyText(11, PALETTE_CSS.text)),
        scene.add.text(width, 0, num(d.value), bodyText(11, PALETTE_CSS.text)).setOrigin(1, 0),
      ]);
    });
  }

  const record =
    bestTimeSeconds <= 0
      ? 'Ainda não há recorde de tempo.'
      : run.time >= bestTimeSeconds
        ? `Recorde de ${formatTime(bestTimeSeconds)} batido!`
        : `Recorde: ${formatTime(bestTimeSeconds)}. Faltam ${formatTime(bestTimeSeconds - run.time)} para bater.`;
  out.push((scene, width) =>
    row(scene, 30, [
      scene.add.text(0, 6, record, {
        ...bodyText(11, PALETTE_CSS.textSoft),
        wordWrap: { width },
      }),
    ]),
  );
  return out;
}
