import { ECONOMY, IDLE, type IdleConfig } from '../../config';
import { createField, stepField } from './field';

/**
 * O que o campo longo guarda entre as sessões (fase 4, decisão 0022): onda, pool, níveis,
 * agentes liberados, melhorias e o ATP produzido esperando coleta. Funções puras: recebem o
 * progresso e devolvem um novo.
 */
export type IdleUpgradeKey = 'fireRate' | 'baseSlots' | 'offlineCapHours';

export interface IdleProgress {
  wave: number;
  bestWave: number;
  /** Agente em cada espaço do pool (até o máximo de espaços); `null` é espaço vazio. */
  pool: (string | null)[];
  /** Nível de cada agente liberado. */
  levels: Record<string, number>;
  agents: string[];
  upgrades: Record<IdleUpgradeKey, number>;
  /** ATP produzido e ainda não coletado. */
  pending: number;
  /** Última vez que o idle rodou (ms desde 1970), para o progresso offline. */
  lastSeen: number;
}

/** Número máximo de espaços do pool (o teto de Espaços na base). */
export function maxSlots(config: IdleConfig = IDLE): number {
  return config.baseSlots.runCap ?? config.baseSlots.base;
}

export function defaultIdle(now = 0, config: IdleConfig = IDLE): IdleProgress {
  const pool: (string | null)[] = Array.from({ length: maxSlots(config) }, () => null);
  config.start.forEach((id, i) => (pool[i] = id));
  return {
    wave: 1,
    bestWave: 1,
    pool,
    levels: Object.fromEntries(config.start.map((id) => [id, 1])),
    agents: [...config.start],
    upgrades: { fireRate: 0, baseSlots: 0, offlineCapHours: 0 },
    pending: 0,
    lastSeen: now,
  };
}

function capped(base: number, cap: number | null | undefined, value: number): number {
  return Math.min(cap ?? Infinity, base + value);
}

/** Espaços abertos do pool. */
export function openSlots(p: IdleProgress, config: IdleConfig = IDLE): number {
  const u = config.upgrades.baseSlots;
  return Math.floor(
    capped(config.baseSlots.base, maxSlots(config), u.perLevel * p.upgrades.baseSlots),
  );
}

export function fireRate(p: IdleProgress, config: IdleConfig = IDLE): number {
  const u = config.upgrades.fireRate;
  return capped(config.fireRate.base, config.fireRate.runCap, u.perLevel * p.upgrades.fireRate);
}

export function offlineCapHours(p: IdleProgress, config: IdleConfig = IDLE): number {
  const u = config.upgrades.offlineCapHours;
  return capped(
    config.offlineCapHours.base,
    config.offlineCapHours.runCap,
    u.perLevel * p.upgrades.offlineCapHours,
  );
}

/** Agentes que estão na base (espaços abertos e ocupados), com o nível e a posição. */
export function fieldSlots(p: IdleProgress, config: IdleConfig = IDLE) {
  const open = openSlots(p, config);
  return p.pool.flatMap((agent, pos) =>
    agent && pos < open ? [{ agent, level: p.levels[agent] ?? 1, pos }] : [],
  );
}

// --- Compras ---

/** Custo de subir um agente do nível `level` para o próximo. */
export function levelCost(level: number, config: IdleConfig = IDLE): number {
  return Math.round(config.levels.baseCost * config.levels.costRate ** (level - 1));
}

export function upgradeCost(key: IdleUpgradeKey, level: number, config: IdleConfig = IDLE): number {
  return Math.round(config.upgrades[key].baseCost * ECONOMY.upgrades.idleCostRate ** level);
}

type Bought = { idle: IdleProgress; atp: number } | null;

export function buyLevel(
  p: IdleProgress,
  atp: number,
  agent: string,
  config: IdleConfig = IDLE,
): Bought {
  const level = p.levels[agent];
  if (!level || level >= config.levels.maxLevel) return null;
  const cost = levelCost(level, config);
  if (atp < cost) return null;
  return { idle: { ...p, levels: { ...p.levels, [agent]: level + 1 } }, atp: atp - cost };
}

export function buyIdleAgent(
  p: IdleProgress,
  atp: number,
  agent: string,
  config: IdleConfig = IDLE,
): Bought {
  const cost = config.unlockCost[agent];
  if (cost === undefined || p.agents.includes(agent) || atp < cost) return null;
  return {
    idle: { ...p, agents: [...p.agents, agent], levels: { ...p.levels, [agent]: 1 } },
    atp: atp - cost,
  };
}

export function buyUpgrade(
  p: IdleProgress,
  atp: number,
  key: IdleUpgradeKey,
  config: IdleConfig = IDLE,
): Bought {
  const level = p.upgrades[key];
  if (level >= config.upgrades[key].maxLevel) return null;
  const cost = upgradeCost(key, level, config);
  if (atp < cost) return null;
  return { idle: { ...p, upgrades: { ...p.upgrades, [key]: level + 1 } }, atp: atp - cost };
}

/** Põe um agente num espaço (ou tira, com `null`); se ele estava em outro espaço, troca. */
export function placeAgent(p: IdleProgress, pos: number, agent: string | null): IdleProgress {
  if (agent !== null && !p.agents.includes(agent)) return p;
  const pool = [...p.pool];
  const from = agent === null ? -1 : pool.indexOf(agent);
  if (from >= 0) pool[from] = pool[pos] ?? null;
  pool[pos] = agent;
  return { ...p, pool };
}

/** Coleta o ATP pendente. */
export function collect(p: IdleProgress, atp: number): { idle: IdleProgress; atp: number } {
  return { idle: { ...p, pending: 0 }, atp: atp + Math.floor(p.pending) };
}

// --- Offline ---

export interface OfflineGain {
  /** Segundos que contaram (até o teto). */
  seconds: number;
  atp: number;
  ratePerHour: number;
}

/**
 * Produção com o jogo fechado: simula alguns minutos do campo na onda atual para medir o ATP por
 * segundo, e paga esse ritmo pelo tempo fora, até o teto de horas. A Melatonina na base soma o
 * bônus offline dela.
 */
export function offlineGain(
  p: IdleProgress,
  elapsedSeconds: number,
  seed: number,
  config: IdleConfig = IDLE,
): OfflineGain {
  if (elapsedSeconds < config.offline.minSeconds) return { seconds: 0, atp: 0, ratePerHour: 0 };
  const slots = fieldSlots(p, config);
  if (slots.length === 0) return { seconds: 0, atp: 0, ratePerHour: 0 };
  const field = createField(seed, p.wave, slots, fireRate(p, config), maxSlots(config), config);
  const dt = 1 / 30;
  for (let t = 0; t < config.offline.estimateSeconds; t += dt) stepField(field, dt);
  const bonus = slots.reduce((sum, s) => sum + (config.agents[s.agent]?.offlineBonus ?? 0), 0);
  const perSecond = (field.atp / config.offline.estimateSeconds) * (1 + bonus);
  const seconds = Math.min(elapsedSeconds, offlineCapHours(p, config) * 3600);
  return { seconds, atp: Math.floor(perSecond * seconds), ratePerHour: perSecond * 3600 };
}
