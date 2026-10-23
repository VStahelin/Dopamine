import {
  ECONOMY,
  META,
  type AgentId,
  type EconomyConfig,
  type LabNode,
  type MetaConfig,
  type PassiveId,
  type WeaponId,
} from '../../config';
import { withStatBonuses, type RunRules } from '../run/rules';

/**
 * Meta-progressão (fase 3): o que o jogador guarda entre as runs. Laboratório em árvore,
 * desbloqueios de agentes e armas com ATP e o baú das estrelas do caso. Funções puras: recebem
 * o progresso e devolvem um novo, sem mexer no original.
 */
export interface MetaProgress {
  /** Nível comprado de cada nó do Laboratório. */
  lab: Record<string, number>;
  /** Agentes, armas do pool e receptores liberados. */
  agents: string[];
  weapons: string[];
  receptors: string[];
  /** Estrelas do caso já conquistadas (0 a 3). */
  stars: number;
  /** ATP das estrelas novas esperando no baú. */
  chest: number;
}

export function defaultProgress(meta: MetaConfig = META): MetaProgress {
  return {
    lab: {},
    agents: [...meta.start.agents],
    weapons: [...meta.start.weapons],
    receptors: [...meta.start.receptors],
    stars: 0,
    chest: 0,
  };
}

// --- Laboratório ---

export type LabState = 'locked' | 'available' | 'maxed';

export function labLevel(progress: MetaProgress, id: string): number {
  return progress.lab[id] ?? 0;
}

/** Custo do próximo nível: baseCost × taxa^nível (aba Economia, fórmula 3). */
export function labCost(
  node: LabNode,
  level: number,
  rate: number = ECONOMY.upgrades.runCostRate,
): number {
  return Math.round(node.baseCost * rate ** level);
}

/** Bloqueado até ter um nível em cada nó pedido; depois disponível até o nível máximo. */
export function labState(progress: MetaProgress, id: string, meta: MetaConfig = META): LabState {
  const node = meta.lab.nodes[id]!;
  if (labLevel(progress, id) >= node.maxLevel) return 'maxed';
  return node.requires.every((r) => labLevel(progress, r) > 0) ? 'available' : 'locked';
}

/** Compra o próximo nível de um nó; `null` se não pode (bloqueado, no máximo ou sem ATP). */
export function buyLab(
  progress: MetaProgress,
  atp: number,
  id: string,
  meta: MetaConfig = META,
  economy: EconomyConfig = ECONOMY,
): { progress: MetaProgress; atp: number } | null {
  const node = meta.lab.nodes[id];
  if (!node || labState(progress, id, meta) !== 'available') return null;
  const cost = labCost(node, labLevel(progress, id), economy.upgrades.runCostRate);
  if (atp < cost) return null;
  return {
    progress: { ...progress, lab: { ...progress.lab, [id]: labLevel(progress, id) + 1 } },
    atp: atp - cost,
  };
}

/** Quanto o Laboratório soma a cada atributo (chave do nó: `damage`, `special.cooldown`...). */
export function labBonuses(
  progress: MetaProgress,
  meta: MetaConfig = META,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, node] of Object.entries(meta.lab.nodes)) {
    const level = labLevel(progress, id);
    if (level > 0) out[node.stat] = (out[node.stat] ?? 0) + node.perLevel * level;
  }
  return out;
}

// --- Desbloqueios ---

export type UnlockKind = 'agents' | 'weapons' | 'receptors';

export function isUnlocked(progress: MetaProgress, kind: UnlockKind, id: string): boolean {
  return progress[kind].includes(id);
}

export function unlockCost(kind: UnlockKind, id: string, meta: MetaConfig = META): number {
  return meta.unlockCost[kind][id] ?? 0;
}

export function buyUnlock(
  progress: MetaProgress,
  atp: number,
  kind: UnlockKind,
  id: string,
  meta: MetaConfig = META,
): { progress: MetaProgress; atp: number } | null {
  if (isUnlocked(progress, kind, id)) return null;
  const cost = unlockCost(kind, id, meta);
  if (cost <= 0 || atp < cost) return null;
  return { progress: { ...progress, [kind]: [...progress[kind], id] }, atp: atp - cost };
}

// --- Estrelas e baú ---

/** Estrelas que um tempo de run alcança (metas de `caseStarMinutes`). */
export function starsFor(timeSeconds: number, economy: EconomyConfig = ECONOMY): number {
  return economy.meta.caseStarMinutes.filter((m) => timeSeconds >= m * 60).length;
}

/** Soma as estrelas novas de uma run; o ATP delas vai para o baú, esperando o jogador abrir. */
export function addRunStars(
  progress: MetaProgress,
  timeSeconds: number,
  meta: MetaConfig = META,
  economy: EconomyConfig = ECONOMY,
): { progress: MetaProgress; newStars: number; reward: number } {
  const reached = starsFor(timeSeconds, economy);
  if (reached <= progress.stars) return { progress, newStars: 0, reward: 0 };
  const reward = meta.starRewards.slice(progress.stars, reached).reduce((a, b) => a + b, 0);
  return {
    progress: { ...progress, stars: reached, chest: progress.chest + reward },
    newStars: reached - progress.stars,
    reward,
  };
}

/** Abre o baú: o ATP guardado passa para o jogador. */
export function openChest(
  progress: MetaProgress,
  atp: number,
): { progress: MetaProgress; atp: number } {
  return { progress: { ...progress, chest: 0 }, atp: atp + progress.chest };
}

// --- Regras da run com a meta-progressão ---

/**
 * Regras da run com o Laboratório somado à base dos atributos e só as armas e os receptores
 * liberados no pool.
 */
export function rulesWithProgress(
  rules: RunRules,
  progress: MetaProgress,
  meta: MetaConfig = META,
): RunRules {
  return {
    ...withStatBonuses(rules, labBonuses(progress, meta), 'lab'),
    unlockedWeapons: progress.weapons as WeaponId[],
    unlockedReceptors: progress.receptors as PassiveId[],
  };
}

/** Agente liberado para jogar; se o escolhido não estiver, volta para o primeiro liberado. */
export function playableAgent(progress: MetaProgress, chosen: string): AgentId {
  return (
    progress.agents.includes(chosen) ? chosen : (progress.agents[0] ?? 'dopamine')
  ) as AgentId;
}

// --- Selos do menu ---

/** Algum nó do Laboratório disponível cabe no ATP? */
export function labAffordable(
  progress: MetaProgress,
  atp: number,
  meta: MetaConfig = META,
): boolean {
  return Object.entries(meta.lab.nodes).some(
    ([id, node]) =>
      labState(progress, id, meta) === 'available' && labCost(node, labLevel(progress, id)) <= atp,
  );
}

/** Algum agente, arma ou receptor bloqueado cabe no ATP? */
export function unlockAffordable(
  progress: MetaProgress,
  atp: number,
  kind: UnlockKind,
  meta: MetaConfig = META,
): boolean {
  return Object.entries(meta.unlockCost[kind]).some(
    ([id, cost]) => !isUnlocked(progress, kind, id) && cost <= atp,
  );
}
