import { ENEMIES, META, type AchievementDef, type EnemyKind, type MetaConfig } from '../../config';
import type { SaveData } from '../save/saveData';

/**
 * Conquistas (fase 5.16, decisão 0036): metas lidas das estatísticas acumuladas (fase 5.13) e dos
 * recordes. Cada uma dá ATP ou libera de graça um agente ou uma arma que também se compra; nada
 * sai da loja.
 */

/** Quanto falta: valor atual e meta, na unidade da conquista (moléculas, segundos, nível...). */
export function achievementProgress(
  def: AchievementDef,
  save: SaveData,
): { value: number; goal: number } {
  const g = def.goal;
  const s = save.stats;
  switch (g.kind) {
    case 'kills': {
      let value = 0;
      for (const [kind, n] of Object.entries(s.kills)) {
        const enemy = ENEMIES[kind as EnemyKind];
        if (g.molecule && kind !== g.molecule) continue;
        if (g.family && enemy?.type !== g.family) continue;
        value += n;
      }
      return { value, goal: g.count };
    }
    case 'bosses':
    case 'aggregates':
    case 'ampoules':
    case 'synapses':
      return { value: s[g.kind], goal: g.count };
    case 'runs':
      return { value: save.records.runs, goal: g.count };
    case 'agentsPlayed':
      return { value: Object.keys(s.agentRuns).length, goal: g.count };
    case 'discharges':
      return { value: save.organism.individual - 1, goal: g.count };
    case 'bestTime':
      return { value: save.records.bestTimeSeconds, goal: g.seconds };
    case 'bestLevel':
      return { value: save.records.bestLevel, goal: g.level };
  }
}

/** Fração cumprida, de 0 a 1. */
export function achievementFraction(def: AchievementDef, save: SaveData): number {
  const { value, goal } = achievementProgress(def, save);
  return goal <= 0 ? 1 : Math.min(1, value / goal);
}

/**
 * Marca as conquistas que acabaram de ser cumpridas e entrega a recompensa: ATP no saldo ou o
 * agente/arma liberado. Devolve o save novo e as conquistas ganhas agora, na ordem da config.
 */
export function claimAchievements(
  save: SaveData,
  meta: MetaConfig = META,
): { save: SaveData; earned: AchievementDef[] } {
  const earned = meta.achievements.filter(
    (a) => !save.achievements.includes(a.id) && achievementFraction(a, save) >= 1,
  );
  if (earned.length === 0) return { save, earned };
  let atp = save.atp;
  const progress = { ...save.meta, agents: [...save.meta.agents], weapons: [...save.meta.weapons] };
  for (const a of earned) {
    atp += a.reward.atp ?? 0;
    const unlock = a.reward.unlock;
    if (!unlock) continue;
    // Já comprado: a conquista devolve metade do preço em ATP.
    if (progress[unlock.group].includes(unlock.id)) {
      atp += Math.round((meta.unlockCost[unlock.group][unlock.id] ?? 0) / 2);
    } else {
      progress[unlock.group].push(unlock.id);
    }
  }
  return {
    save: {
      ...save,
      atp,
      meta: progress,
      achievements: [...save.achievements, ...earned.map((a) => a.id)],
    },
    earned,
  };
}

/** A próxima conquista: a que falta e está mais perto de sair. */
export function nextAchievement(
  save: SaveData,
  meta: MetaConfig = META,
): AchievementDef | undefined {
  let best: AchievementDef | undefined;
  let bestFraction = -1;
  for (const a of meta.achievements) {
    if (save.achievements.includes(a.id)) continue;
    const f = achievementFraction(a, save);
    if (f > bestFraction) {
      best = a;
      bestFraction = f;
    }
  }
  return best;
}

/** Texto curto da recompensa: "+300 ATP" ou "LIBERA A CAFEÍNA". */
export function rewardLabel(
  def: AchievementDef,
  names: { agents: Record<string, { name: string }>; weapons: Record<string, { name: string }> },
): string {
  const unlock = def.reward.unlock;
  if (unlock) return `LIBERA ${names[unlock.group][unlock.id]?.name.toUpperCase() ?? unlock.id}`;
  return `+${(def.reward.atp ?? 0).toLocaleString('pt-BR')} ATP`;
}
