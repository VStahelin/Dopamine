import type { RunResult } from '../run/state';
import { IDLE, SECTORS, type SoundOptions } from '../../config';
import { defaultIdle, maxSlots, type IdleProgress } from '../idle/progress';
import { defaultProgress, type MetaProgress } from '../meta/progress';
import { defaultOrganism, type OrganismState } from '../organism/organism';

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
  /** Melhor tempo em cada local do corpo (fase 5.12). */
  bestTimeByLocal: Record<string, number>;
  /** Runs e melhor tempo do indivíduo atual (fase 5.16); zeram na ALTA. */
  caseRuns: number;
  caseBestSeconds: number;
}

/** Caso já curado (ALTA), para a lista de casos anteriores do hub (fase 5.16). */
export interface CaseRecord {
  individual: number;
  runs: number;
  bestTimeSeconds: number;
}

/**
 * Estatísticas acumuladas de todas as runs (fase 5.13): a base das conquistas da fase 5.16.
 * Nunca zeram, nem na ALTA.
 */
export interface LifetimeStats {
  /** Decompostas por molécula. */
  kills: Record<string, number>;
  /** Segundos de run e runs jogadas por agente. */
  agentSeconds: Record<string, number>;
  agentRuns: Record<string, number>;
  bosses: number;
  aggregates: number;
  ampoules: number;
  synapses: number;
  /** ATP ganho nas runs (não conta o idle). */
  runAtp: number;
}

export function defaultStats(): LifetimeStats {
  return {
    kills: {},
    agentSeconds: {},
    agentRuns: {},
    bosses: 0,
    aggregates: 0,
    ampoules: 0,
    synapses: 0,
    runAtp: 0,
  };
}

export interface Options {
  showFps: boolean;
  /** Números de dano no campo (docs/ui-cronico.md). */
  showDamageNumbers: boolean;
  /** Modo debug: hitboxes e números da run por cima do campo (para afinar o jogo). */
  debug?: boolean;
  /** Aba Som das Opções (docs/menu.md). */
  sound: SoundOptions;
}

export interface SaveData {
  version: number;
  records: Records;
  stats: LifetimeStats;
  options: Options;
  /** Agente escolhido para a próxima run. */
  selectedAgent: string;
  /** Local escolhido para a próxima run (fase 5.12): um ambiente de map.json ou 'random'. */
  selectedLocal: string;
  /** O aviso de que os locais abriram já apareceu no hub. */
  localsAnnounced: boolean;
  /** Moléculas já vistas em alguma run, para o Compêndio. */
  seen: string[];
  /** Itens do mapa já coletados, para o Compêndio (fase 5.5). */
  seenItems: string[];
  /** Suplementos já tomados, para o Compêndio (fase 5.9). */
  seenSupplements: string[];
  /** Moléculas que já vieram como agregado, para o Compêndio (fase 5.10). */
  seenAggregates: string[];
  /** Formações já vistas, para o Compêndio (fase 5.6). */
  seenFormations: string[];
  /** Cápsulas abertas no save, para a sorte de principiante. */
  capsulesOpened: number;
  /** ATP guardado, ganho nas runs e gasto no Laboratório e nos desbloqueios. */
  atp: number;
  /** Laboratório, desbloqueios e estrelas do caso (fase 3). */
  meta: MetaProgress;
  /** Campo longo: onda, pool, níveis, melhorias e ATP a coletar (fase 4). */
  idle: IdleProgress;
  /** Indivíduo atual, setores de saúde e pontos herdados (fase 5). */
  organism: OrganismState;
  /** Conquistas já ganhas (fase 5.16), pelo id de meta.json. */
  achievements: string[];
  /** Casos curados, do mais antigo ao mais recente (fase 5.16). */
  cases: CaseRecord[];
}

export type RecordKind = 'time' | 'level' | 'kills';

export function defaultSave(options: Options): SaveData {
  return {
    version: SAVE_VERSION,
    records: {
      bestTimeSeconds: 0,
      bestLevel: 0,
      mostKills: 0,
      runs: 0,
      bestTimeByLocal: {},
      caseRuns: 0,
      caseBestSeconds: 0,
    },
    stats: defaultStats(),
    options: { ...options },
    selectedAgent: 'dopamine',
    selectedLocal: 'blood',
    localsAnnounced: false,
    seen: [],
    seenItems: [],
    seenSupplements: [],
    seenAggregates: [],
    seenFormations: [],
    capsulesOpened: 0,
    atp: 0,
    meta: defaultProgress(),
    idle: defaultIdle(),
    organism: defaultOrganism(),
    achievements: [],
    cases: [],
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
    stats: unknown;
    options: Partial<Options>;
    selectedAgent: unknown;
    selectedLocal: unknown;
    localsAnnounced: unknown;
    seen: unknown;
    seenItems: unknown;
    seenSupplements: unknown;
    seenAggregates: unknown;
    seenFormations: unknown;
    capsulesOpened: unknown;
    atp: unknown;
    meta: unknown;
    idle: unknown;
    organism: unknown;
    achievements: unknown;
    cases: unknown;
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
      bestTimeByLocal: counts(r.bestTimeByLocal),
      caseRuns: num(r.caseRuns, 0),
      caseBestSeconds: num(r.caseBestSeconds, 0),
    },
    stats: migrateStats(data.stats),
    options: {
      showFps: typeof o.showFps === 'boolean' ? o.showFps : base.options.showFps,
      showDamageNumbers:
        typeof o.showDamageNumbers === 'boolean'
          ? o.showDamageNumbers
          : base.options.showDamageNumbers,
      debug: o.debug === true,
      sound: migrateSound(o.sound, base.options.sound),
    },
    selectedAgent: typeof data.selectedAgent === 'string' ? data.selectedAgent : base.selectedAgent,
    selectedLocal: typeof data.selectedLocal === 'string' ? data.selectedLocal : base.selectedLocal,
    localsAnnounced: data.localsAnnounced === true,
    seen: Array.isArray(data.seen) ? data.seen.filter((k) => typeof k === 'string') : [],
    seenItems: strings(data.seenItems) ?? [],
    seenSupplements: strings(data.seenSupplements) ?? [],
    seenAggregates: strings(data.seenAggregates) ?? [],
    seenFormations: strings(data.seenFormations) ?? [],
    capsulesOpened: num(data.capsulesOpened, 0),
    atp: num(data.atp, 0),
    meta: migrateProgress(data.meta),
    idle: migrateIdle(data.idle),
    organism: migrateOrganism(data.organism),
    achievements: strings(data.achievements) ?? [],
    cases: migrateCases(data.cases),
  };
}

function migrateCases(raw: unknown): CaseRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      individual: Math.max(1, Math.floor(num(c.individual, 1))),
      runs: num(c.runs, 0),
      bestTimeSeconds: num(c.bestTimeSeconds, 0),
    }));
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
        bestTimeByLocal: {
          ...r.bestTimeByLocal,
          [result.env]: Math.max(r.bestTimeByLocal[result.env] ?? 0, result.timeSeconds),
        },
        caseRuns: r.caseRuns + 1,
        caseBestSeconds: Math.max(r.caseBestSeconds, result.timeSeconds),
      },
      seen: [...new Set([...save.seen, ...result.seen])],
      seenItems: [...new Set([...save.seenItems, ...result.seenItems])],
      seenSupplements: [...new Set([...save.seenSupplements, ...result.seenSupplements])],
      seenAggregates: [...new Set([...save.seenAggregates, ...result.seenAggregates])],
      seenFormations: [...new Set([...save.seenFormations, ...result.seenFormations])],
      capsulesOpened: save.capsulesOpened + result.capsulesOpened,
      atp: save.atp + result.atp,
      // Cápsula de agente: o agente libertado fica liberado de graça.
      meta:
        result.freedAgent && !save.meta.agents.includes(result.freedAgent)
          ? { ...save.meta, agents: [...save.meta.agents, result.freedAgent] }
          : save.meta,
      stats: addRunStats(save.stats, result),
    },
    newRecords,
  };
}

/** Soma uma run às estatísticas acumuladas. */
export function addRunStats(stats: LifetimeStats, result: RunResult): LifetimeStats {
  const kills = { ...stats.kills };
  for (const [kind, n] of Object.entries(result.tally.killsByKind))
    kills[kind] = (kills[kind] ?? 0) + (n ?? 0);
  const a = result.agentId;
  return {
    kills,
    agentSeconds: { ...stats.agentSeconds, [a]: (stats.agentSeconds[a] ?? 0) + result.timeSeconds },
    agentRuns: { ...stats.agentRuns, [a]: (stats.agentRuns[a] ?? 0) + 1 },
    bosses: stats.bosses + result.tally.bosses,
    aggregates: stats.aggregates + result.tally.aggregates,
    ampoules: stats.ampoules + result.tally.ampoules,
    synapses: stats.synapses + result.tally.synapses,
    runAtp: stats.runAtp + result.atp,
  };
}

/** Mapa de contagens lido de um save; o que não for número fica de fora. */
function counts(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}

function migrateStats(raw: unknown): LifetimeStats {
  if (typeof raw !== 'object' || raw === null) return defaultStats();
  const m = raw as Partial<Record<keyof LifetimeStats, unknown>>;
  return {
    kills: counts(m.kills),
    agentSeconds: counts(m.agentSeconds),
    agentRuns: counts(m.agentRuns),
    bosses: num(m.bosses, 0),
    aggregates: num(m.aggregates, 0),
    ampoules: num(m.ampoules, 0),
    synapses: num(m.synapses, 0),
    runAtp: num(m.runAtp, 0),
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
    receptors: [...new Set([...base.receptors, ...(strings(m.receptors) ?? [])])],
    stars: Math.min(3, num(m.stars, 0)),
    chest: num(m.chest, 0),
  };
}

/** Campo longo lido de um save; agentes e espaços que não existem mais caem fora. */
function migrateIdle(raw: unknown): IdleProgress {
  const base = defaultIdle();
  if (typeof raw !== 'object' || raw === null) return base;
  const m = raw as Partial<Record<keyof IdleProgress, unknown>>;
  const agents = [...new Set([...base.agents, ...(strings(m.agents) ?? [])])].filter(
    (id) => id in IDLE.agents,
  );
  const levels: Record<string, number> = {};
  for (const id of agents) {
    const level = (m.levels as Record<string, unknown> | undefined)?.[id];
    levels[id] = typeof level === 'number' && level >= 1 ? Math.floor(level) : 1;
  }
  const rawPool = Array.isArray(m.pool) ? m.pool : base.pool;
  const pool = Array.from({ length: maxSlots() }, (_, i) => {
    const id = rawPool[i];
    return typeof id === 'string' && agents.includes(id) ? id : null;
  });
  const u = (m.upgrades ?? {}) as Partial<Record<keyof IdleProgress['upgrades'], unknown>>;
  const wave = Math.max(1, Math.floor(num(m.wave, 1)));
  return {
    wave,
    bestWave: Math.max(wave, Math.floor(num(m.bestWave, 1))),
    pool,
    levels,
    agents,
    upgrades: {
      fireRate: Math.floor(num(u.fireRate, 0)),
      baseSlots: Math.floor(num(u.baseSlots, 0)),
      offlineCapHours: Math.floor(num(u.offlineCapHours, 0)),
    },
    pending: num(m.pending, 0),
    lastSeen: num(m.lastSeen, 0),
  };
}

/** Organismo lido de um save; setor que faltar volta ao começo do indivíduo 1. */
function migrateOrganism(raw: unknown): OrganismState {
  const base = defaultOrganism();
  if (typeof raw !== 'object' || raw === null) return base;
  const m = raw as Partial<Record<keyof OrganismState, unknown>>;
  const sectors = { ...base.sectors };
  const rawSectors = (m.sectors ?? {}) as Record<string, unknown>;
  for (const s of SECTORS) {
    const v = rawSectors[s];
    if (typeof v === 'number' && Number.isFinite(v)) sectors[s] = Math.max(0, Math.min(100, v));
  }
  return {
    individual: Math.max(1, Math.floor(num(m.individual, 1))),
    sectors,
    atpEarned: num(m.atpEarned, 0),
    inherited: Math.floor(num(m.inherited, 0)),
  };
}

function migrateSound(data: unknown, base: SoundOptions): SoundOptions {
  const o = (data ?? {}) as Partial<Record<keyof SoundOptions, unknown>>;
  const vol = (v: unknown, fallback: number) =>
    typeof v === 'number' && v >= 0 && v <= 1 ? v : fallback;
  const flag = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  return {
    muted: flag(o.muted, base.muted),
    masterVolume: vol(o.masterVolume, base.masterVolume),
    musicVolume: vol(o.musicVolume, base.musicVolume),
    sfxVolume: vol(o.sfxVolume, base.sfxVolume),
    muffleOnPause: flag(o.muffleOnPause, base.muffleOnPause),
    playInBackground: flag(o.playInBackground, base.playInBackground),
  };
}
