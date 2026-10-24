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
function progressText(def: AchievementDef, save: SaveData): string {
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

/** Cartão de uma conquista: ícone, nome, recompensa, meta, progresso e a barra. */
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
  const textLeft = left + 10 + BADGE + 8;
  const name = scene.add.text(
    textLeft,
    y + 6,
    done ? `${def.name} ✓` : def.name,
    withShadow(bodyText(13, done ? PALETTE_CSS.gold : PALETTE_CSS.text), PALETTE_CSS.ink, 1),
  );
  const reward = scene.add
    .text(left + width - 10, y + 9, rewardLabel(def, NAMES), labelText(8, PALETTE_CSS.gold))
    .setOrigin(1, 0);
  const desc = scene.add.text(textLeft, y + 26, `${def.description} · ${progressText(def, save)}`, {
    ...bodyText(9, PALETTE_CSS.textSoft),
    wordWrap: { width: left + width - 10 - textLeft },
  });
  out.push(name, reward, desc);
  const barY = Math.ceil(desc.y + desc.height) + 4;
  const height = Math.max(barY - y + 12, BADGE + 16);
  drawInkBox(g, left, y, width, height, highlight ? PALETTE.panelDeep : PALETTE.panel);
  const state = done ? 'done' : achievementProgress(def, save).value > 0 ? 'progress' : 'none';
  out.push(achievementBadge(scene, g, def, left + 10, y + Math.floor((height - BADGE) / 2), state));
  const bw = left + width - 10 - textLeft;
  g.fillStyle(PALETTE.ink).fillRect(textLeft, barY, bw, 6);
  g.fillStyle(done ? PALETTE.gold : PALETTE.water).fillRect(
    textLeft + 1,
    barY + 1,
    Math.round((bw - 2) * achievementFraction(def, save)),
    4,
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
    scene.add.text(
      left,
      y,
      `${save.achievements.length} DE ${total} · CADA UMA DÁ ATP OU LIBERA ALGO DE GRAÇA`,
      { ...labelText(8, PALETTE_CSS.textMuted), wordWrap: { width } },
    ),
  ];
  let cy = y + 22;
  const next = nextAchievement(save);
  if (next) {
    out.push(scene.add.text(left, cy, 'PRÓXIMA', labelText(10, PALETTE_CSS.sectionOrange)));
    const c = card(scene, g, next, save, left, cy + 16, width, true);
    out.push(...c.objects);
    cy += 16 + c.height + 14;
  }
  out.push(scene.add.text(left, cy, 'TODAS', labelText(10, PALETTE_CSS.water)));
  cy += 16;
  for (const def of META.achievements) {
    const c = card(scene, g, def, save, left, cy, width, false);
    out.push(...c.objects);
    cy += c.height + 4;
  }
  return out;
}
