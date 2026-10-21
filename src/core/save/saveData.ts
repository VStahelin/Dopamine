import type { RunResult } from '../run/state';

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
}

export interface SaveData {
  version: number;
  records: Records;
  options: Options;
}

export type RecordKind = 'time' | 'level' | 'kills';

export function defaultSave(options: Options): SaveData {
  return {
    version: SAVE_VERSION,
    records: { bestTimeSeconds: 0, bestLevel: 0, mostKills: 0, runs: 0 },
    options: { ...options },
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Lê um save de origem desconhecida; o que faltar ou vier errado volta ao padrão. */
export function migrateSave(raw: unknown, defaults: Options): SaveData {
  const base = defaultSave(defaults);
  if (typeof raw !== 'object' || raw === null) return base;
  const data = raw as Partial<{ records: Partial<Records>; options: Partial<Options> }>;
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
    },
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
    },
    newRecords,
  };
}
