import { TUTORIAL, type TutorialConfig, type TutorialStepDef } from '../../config';
import type { RunState } from './state';

/**
 * Primeira run guiada (fase 6, prancheta "Primeira run guiada"): cartões de dica que não pausam
 * o jogo. Cada passo some quando o jogador faz o que ele pede; o do especial só aparece com uma
 * carga pronta.
 */
export interface TutorialProgress {
  /** Passo atual em `TUTORIAL.steps`; igual ao total quando acabou. */
  index: number;
  /** Como a run estava quando o passo começou: posição, decompostas, especiais usados e tempo. */
  startX: number;
  startY: number;
  startKills: number;
  startSpecials: number;
  startTime: number;
}

export function createTutorial(state: RunState): TutorialProgress {
  const t = { index: 0, startX: 0, startY: 0, startKills: 0, startSpecials: 0, startTime: 0 };
  mark(t, state);
  return t;
}

function mark(t: TutorialProgress, state: RunState): void {
  t.startX = state.agent.x;
  t.startY = state.agent.y;
  t.startKills = state.kills;
  t.startSpecials = state.used.specials;
  t.startTime = state.time;
}

export function tutorialDone(t: TutorialProgress, cfg: TutorialConfig = TUTORIAL): boolean {
  return t.index >= cfg.steps.length;
}

/** O passo atual já foi cumprido? */
function stepDone(def: TutorialStepDef, t: TutorialProgress, state: RunState): boolean {
  switch (def.id) {
    case 'move':
      return Math.hypot(state.agent.x - t.startX, state.agent.y - t.startY) >= (def.movePx ?? 0);
    case 'act':
      return state.kills - t.startKills >= (def.kills ?? 0);
    case 'gems':
      return state.level >= 2;
    case 'special':
      return state.used.specials > t.startSpecials;
    case 'survive':
      return state.time - t.startTime >= (def.seconds ?? 0);
  }
}

/** Avança os passos cumpridos (vários de uma vez, se o jogador se adiantou). */
export function updateTutorial(
  t: TutorialProgress,
  state: RunState,
  cfg: TutorialConfig = TUTORIAL,
): void {
  while (!tutorialDone(t, cfg) && stepDone(cfg.steps[t.index]!, t, state)) {
    t.index++;
    mark(t, state);
  }
}

/** Cartão a mostrar agora, ou `null`: acabou, ou o especial ainda não tem carga. */
export function tutorialCard(
  t: TutorialProgress,
  state: RunState,
  cfg: TutorialConfig = TUTORIAL,
): { def: TutorialStepDef; number: number; total: number } | null {
  const def = cfg.steps[t.index];
  if (!def) return null;
  if (def.id === 'special' && state.special.charges <= 0) return null;
  return { def, number: t.index + 1, total: cfg.steps.length };
}

/** Pular: o tutorial acaba na hora. */
export function skipTutorial(t: TutorialProgress, cfg: TutorialConfig = TUTORIAL): void {
  t.index = cfg.steps.length;
}
