import type * as Phaser from 'phaser';
import { AGENTS, META, WEAPONS, type AchievementDef } from '../../config';
import {
  achievementFraction,
  achievementProgress,
  nextAchievement,
  rewardLabel,
} from '../../core/meta/achievements';
import type { SaveData } from '../../core/save/saveData';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIcon, iconTexture } from '../render/textures';
import { drawInkBox } from './icons';
import { bodyText, formatTime, labelText, withShadow } from './theme';

type Obj = Phaser.GameObjects.GameObject;

const NAMES = { agents: AGENTS, weapons: WEAPONS };

/** "7:12 de 10:00" nas metas de tempo; "1.240/2.000" nas outras. */
export function progressText(def: AchievementDef, save: SaveData): string {
  const { value, goal } = achievementProgress(def, save);
  const shown = Math.min(value, goal);
  if (def.goal.kind === 'bestTime') return `${formatTime(shown)}/${formatTime(goal)}`;
  return `${shown.toLocaleString('pt-BR')}/${goal.toLocaleString('pt-BR')}`;
}

const BADGE = 38;

/**
 * Ícone da conquista numa moldura (prancheta "Ícones das conquistas"): dourada quando feita,
 * escura em andamento, e o ícone cinza e apagado enquanto não houver progresso nenhum.
 */
export function achievementBadge(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  def: AchievementDef,
  x: number,
  y: number,
  state: 'done' | 'progress' | 'none',
  iconPx = 32,
): Phaser.GameObjects.Image {
  const size = iconPx + 6;
  g.fillStyle(state === 'done' ? PALETTE.gold : PALETTE.ink).fillRect(x, y, size, size);
  g.fillStyle(state === 'done' ? PALETTE.goldDark : PALETTE.panelDeep).fillRect(
    x + 3,
    y + 3,
    iconPx,
    iconPx,
  );
  const icon = addIcon(scene, x + 3, y + 3, iconTexture(def.icon.group, def.icon.id), iconPx);
  if (state === 'none') icon.setTint(PALETTE.stone).setAlpha(0.6);
  return icon;
}

/**
 * Cartão de uma conquista (prancheta "Conquistas"): ícone, nome, recompensa, meta e progresso, e a
 * barra (verde quando feita, azul em andamento). A próxima ganha moldura e barra douradas, com a
 * recompensa embaixo da barra.
 */
function card(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  def: AchievementDef,
  save: SaveData,
  left: number,
  y: number,
  width: number,
  highlight: boolean,
): { objects: Obj[]; height: number } {
  const done = save.achievements.includes(def.id);
  const out: Obj[] = [];
  const pad = highlight ? 12 : 10;
  const textLeft = left + pad + BADGE + 8;
  const right = left + width - pad;
  const reward = highlight
    ? undefined
    : scene.add
        .text(
          right,
          y + 10,
          rewardLabel(def, NAMES),
          labelText(8, done ? PALETTE_CSS.numberHeal : PALETTE_CSS.gold),
        )
        .setOrigin(1, 0);
  const name = scene.add.text(
    textLeft,
    y + (highlight ? 10 : 7),
    done ? `${def.name} ✓` : def.name,
    {
      ...withShadow(
        {
          ...bodyText(highlight ? 15 : 13, done ? PALETTE_CSS.textSoft : '#FFFFFF'),
          fontStyle: '700',
        },
        PALETTE_CSS.ink,
        1,
      ),
      wordWrap: { width: right - (reward ? reward.width + 8 : 0) - textLeft },
    },
  );
  const progress = progressText(def, save);
  const desc = scene.add.text(
    textLeft,
    Math.ceil(name.y + name.height) + 2,
    `${def.description} · ${highlight ? progress.replace('/', ' de ') : progress}`,
    { ...bodyText(10, PALETTE_CSS.textSoft), wordWrap: { width: right - textLeft } },
  );
  out.push(name, desc);
  if (reward) out.push(reward);
  const barY = Math.ceil(desc.y + desc.height) + 5;
  let bottom = barY + 10;
  if (highlight) {
    const r = scene.add.text(
      textLeft,
      bottom + 6,
      rewardLabel(def, NAMES),
      labelText(8, PALETTE_CSS.gold),
    );
    out.push(r);
    bottom = Math.ceil(r.y + r.height);
  }
  const height = Math.max(bottom - y + (highlight ? 12 : 9), BADGE + 2 * pad);
  if (highlight) {
    g.fillStyle(PALETTE.gold).fillRect(left, y, width, height);
    g.fillStyle(0x3a2a0c).fillRect(left + 3, y + 3, width - 6, height - 6);
  } else {
    drawInkBox(g, left, y, width, height, PALETTE.panel);
  }
  const state = done ? 'done' : achievementProgress(def, save).value > 0 ? 'progress' : 'none';
  out.push(
    achievementBadge(scene, g, def, left + pad, y + Math.floor((height - BADGE) / 2), state),
  );
  const bw = right - textLeft;
  g.fillStyle(PALETTE.ink).fillRect(textLeft, barY, bw, 10);
  g.fillStyle(PALETTE.panelDeep).fillRect(textLeft + 2, barY + 2, bw - 4, 6);
  g.fillStyle(highlight ? PALETTE.gold : done ? PALETTE.buff : PALETTE.progress).fillRect(
    textLeft + 2,
    barY + 2,
    Math.round((bw - 4) * achievementFraction(def, save)),
    6,
  );
  return { objects: out, height };
}

/**
 * Tela de conquistas (fase 5.16, prancheta "Conquistas"): a contagem, a próxima a sair em
 * destaque e a lista inteira na ordem da config.
 */
export function renderAchievements(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  save: SaveData,
): Obj[] {
  const width = Math.min(w - 24, 420);
  const left = Math.floor(x + (w - width) / 2);
  const g = scene.add.graphics();
  const total = META.achievements.length;
  const out: Obj[] = [
    g,
    scene.add
      .text(
        left + width / 2,
        y,
        `${save.achievements.length} DE ${total} · CADA UMA DÁ ATP OU LIBERA ALGO DE GRAÇA`,
        { ...labelText(8, PALETTE_CSS.textMuted), wordWrap: { width }, align: 'center' },
      )
      .setOrigin(0.5, 0),
  ];
  let cy = y + 22;
  const next = nextAchievement(save);
  if (next) {
    out.push(scene.add.text(left, cy, 'PRÓXIMA', labelText(10, PALETTE_CSS.water)));
    const c = card(scene, g, next, save, left, cy + 16, width, true);
    out.push(...c.objects);
    cy += 16 + c.height + 14;
  }
  out.push(scene.add.text(left, cy, 'TODAS', labelText(10, PALETTE_CSS.water)));
  cy += 16;
  for (const def of META.achievements) {
    const c = card(scene, g, def, save, left, cy, width, false);
    out.push(...c.objects);
    cy += c.height + 6;
  }
  return out;
}
