import { describe, expect, it } from 'vitest';
import { defaultSave, migrateSave, recordRun, SAVE_VERSION } from './saveData';
import { AUDIO } from '../../config';

const defaults = { showFps: true, showDamageNumbers: true, sound: AUDIO.sound };
const tally = { killsByKind: {}, bosses: 0, aggregates: 0, ampoules: 0, synapses: 0 };
const noTally = { agentId: 'dopamine' as const, tally };

describe('migrateSave', () => {
  it('devolve o padrão para save vazio ou inválido', () => {
    expect(migrateSave(undefined, defaults)).toEqual(defaultSave(defaults));
    expect(migrateSave('lixo', defaults)).toEqual(defaultSave(defaults));
  });

  it('mantém os campos válidos e corrige os inválidos', () => {
    const save = migrateSave(
      {
        records: { bestTimeSeconds: 90, bestLevel: -3, mostKills: 'x' },
        options: { showFps: false },
      },
      defaults,
    );
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.records).toEqual({
      bestTimeSeconds: 90,
      bestLevel: 0,
      mostKills: 0,
      runs: 0,
      bestTimeByLocal: {},
      caseRuns: 0,
      caseBestSeconds: 0,
    });
    expect(save.options.showFps).toBe(false);
  });

  it('marca o Compêndio como não visitado só em save de antes do campo', () => {
    expect(defaultSave(defaults).compendiumRead).toEqual([]);
    expect(migrateSave({ seen: ['glucose'] }, defaults).compendiumRead).toBeNull();
    expect(migrateSave({ compendiumRead: ['molecules:glucose'] }, defaults).compendiumRead).toEqual(
      ['molecules:glucose'],
    );
  });
});

describe('recordRun', () => {
  it('atualiza recordes e diz quais foram batidos', () => {
    const start = recordRun(defaultSave(defaults), {
      timeSeconds: 100,
      level: 5,
      kills: 50,
      atp: 12,
      seen: ['glucose'],
      seenItems: [],
      seenSupplements: [],
      seenAggregates: [],
      seenFormations: [],
      mapName: '',
      env: 'blood',
      capsulesOpened: 0,
      freedAgent: null,
      ...noTally,
    }).save;
    const { save, newRecords } = recordRun(start, {
      timeSeconds: 80,
      level: 7,
      kills: 50,
      atp: 30,
      seen: ['ldl', 'glucose'],
      seenItems: [],
      seenSupplements: [],
      seenAggregates: [],
      seenFormations: [],
      mapName: '',
      env: 'blood',
      capsulesOpened: 0,
      freedAgent: null,
      ...noTally,
    });
    expect(newRecords).toEqual(['level']);
    expect(save.records).toEqual({
      bestTimeSeconds: 100,
      bestLevel: 7,
      mostKills: 50,
      runs: 2,
      bestTimeByLocal: { blood: 100 },
      caseRuns: 2,
      caseBestSeconds: 100,
    });
    expect(save.seen.sort()).toEqual(['glucose', 'ldl']);
    expect(save.atp).toBe(42);
  });
});

describe('estatísticas acumuladas', () => {
  const run = {
    timeSeconds: 300,
    level: 10,
    kills: 7,
    atp: 20,
    seen: [],
    seenItems: [],
    seenSupplements: [],
    seenAggregates: [],
    seenFormations: [],
    mapName: '',
    env: 'blood' as const,
    capsulesOpened: 0,
    freedAgent: null,
    agentId: 'lipase' as const,
    tally: {
      killsByKind: { glucose: 5, ldl: 2 },
      bosses: 2,
      aggregates: 1,
      ampoules: 3,
      synapses: 1,
    },
  };

  it('somam as runs por molécula, por agente e no total', () => {
    const once = recordRun(defaultSave(defaults), run).save;
    const twice = recordRun(once, run).save;
    expect(twice.stats.kills).toEqual({ glucose: 10, ldl: 4 });
    expect(twice.stats.agentSeconds).toEqual({ lipase: 600 });
    expect(twice.stats.agentRuns).toEqual({ lipase: 2 });
    expect(twice.stats).toMatchObject({
      bosses: 4,
      aggregates: 2,
      ampoules: 6,
      synapses: 2,
      runAtp: 40,
    });
  });

  it('sobrevivem ao save e descartam valores inválidos', () => {
    const saved = recordRun(defaultSave(defaults), run).save;
    const loaded = migrateSave(JSON.parse(JSON.stringify(saved)), defaults);
    expect(loaded.stats).toEqual(saved.stats);
    const bad = migrateSave({ stats: { kills: { glucose: 'x', ldl: 3 }, bosses: -1 } }, defaults);
    expect(bad.stats.kills).toEqual({ ldl: 3 });
    expect(bad.stats.bosses).toBe(0);
  });
});
