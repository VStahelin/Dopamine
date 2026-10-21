import type { RunResult } from '../run/state';
import { defaultProgress, type MetaProgress } from '../meta/progress';

/**
 * Formato do save (decisão 0005). Na v0.1 guarda só recordes e opções; a fase 3 soma moeda e
 * upgrades. Ao mudar o formato, suba `SAVE_VERSION` e trate a versão antiga em `migrateSave`.
 */
export const SAVE_VERSION = 1;

export interface Records {
  bestTimeSeconds: number;
  bestLevel: number;
  mostKills: number;
  runs: number;
}

export interface Options {
  showFps: boolean;
  /** Números de dano no campo (docs/ui-cronico.md). */
  showDamageNumbers: boolean;
}

export interface SaveData {
  version: number;
  records: Records;
  options: Options;
  /** Agente escolhido para a próxima run. */
  selectedAgent: string;
  /** Moléculas já vistas em alguma run, para o Compêndio. */
  seen: string[];
  /** ATP guardado, ganho nas runs e gasto no Laboratório e nos desbloqueios. */
  atp: number;
  /** Laboratório, desbloqueios e estrelas do caso (fase 3). */
  meta: MetaProgress;
}

export type RecordKind = 'time' | 'level' | 'kills';

export function defaultSave(options: Options): SaveData {
  return {
    version: SAVE_VERSION,
    records: { bestTimeSeconds: 0, bestLevel: 0, mostKills: 0, runs: 0 },
    options: { ...options },
    selectedAgent: 'dopamine',
    seen: [],
    atp: 0,
    meta: defaultProgress(),
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Lê um save de origem desconhecida; o que faltar ou vier errado volta ao padrão. */
export function migrateSave(raw: unknown, defaults: Options): SaveData {
  const base = defaultSave(defaults);
  if (typeof raw !== 'object' || raw === null) return base;
  const data = raw as Partial<{
    records: Partial<Records>;
    options: Partial<Options>;
    selectedAgent: unknown;
    seen: unknown;
    atp: unknown;
    meta: unknown;
  }>;
  const r = data.records ?? {};
  const o = data.options ?? {};
  return {
    version: SAVE_VERSION,
    records: {
      bestTimeSeconds: num(r.bestTimeSeconds, 0),
      bestLevel: num(r.bestLevel, 0),
      mostKills: num(r.mostKills, 0),
      runs: num(r.runs, 0),
    },
    options: {
      showFps: typeof o.showFps === 'boolean' ? o.showFps : base.options.showFps,
      showDamageNumbers:
        typeof o.showDamageNumbers === 'boolean'
          ? o.showDamageNumbers
          : base.options.showDamageNumbers,
    },
    selectedAgent: typeof data.selectedAgent === 'string' ? data.selectedAgent : base.selectedAgent,
    seen: Array.isArray(data.seen) ? data.seen.filter((k) => typeof k === 'string') : [],
    atp: num(data.atp, 0),
    meta: migrateProgress(data.meta),
  };
}

/** Soma uma run aos recordes e diz quais foram batidos. */
export function recordRun(
  save: SaveData,
  result: RunResult,
): { save: SaveData; newRecords: RecordKind[] } {
  const r = save.records;
  const newRecords: RecordKind[] = [];
  if (result.timeSeconds > r.bestTimeSeconds) newRecords.push('time');
  if (result.level > r.bestLevel) newRecords.push('level');
  if (result.kills > r.mostKills) newRecords.push('kills');
  return {
    save: {
      ...save,
      records: {
        bestTimeSeconds: Math.max(r.bestTimeSeconds, result.timeSeconds),
        bestLevel: Math.max(r.bestLevel, result.level),
        mostKills: Math.max(r.mostKills, result.kills),
        runs: r.runs + 1,
      },
      seen: [...new Set([...save.seen, ...result.seen])],
      atp: save.atp + result.atp,
    },
    newRecords,
  };
}

const strings = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined;

/** Progresso da meta lido de um save; o que faltar volta ao começo (só os liberados no início). */
function migrateProgress(raw: unknown): MetaProgress {
  const base = defaultProgress();
  if (typeof raw !== 'object' || raw === null) return base;
  const m = raw as Partial<Record<keyof MetaProgress, unknown>>;
  const lab: Record<string, number> = {};
  if (typeof m.lab === 'object' && m.lab !== null) {
    for (const [id, level] of Object.entries(m.lab)) {
      if (typeof level === 'number' && level > 0) lab[id] = Math.floor(level);
    }
  }
  return {
    lab,
    agents: [...new Set([...base.agents, ...(strings(m.agents) ?? [])])],
    weapons: [...new Set([...base.weapons, ...(strings(m.weapons) ?? [])])],
    stars: Math.min(3, num(m.stars, 0)),
    chest: num(m.chest, 0),
  };
}
