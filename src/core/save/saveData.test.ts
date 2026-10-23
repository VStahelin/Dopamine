import { describe, expect, it } from 'vitest';
import { defaultSave, migrateSave, recordRun, SAVE_VERSION } from './saveData';

const defaults = { showFps: true, showDamageNumbers: true };

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
    expect(save.records).toEqual({ bestTimeSeconds: 90, bestLevel: 0, mostKills: 0, runs: 0 });
    expect(save.options.showFps).toBe(false);
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
      capsulesOpened: 0,
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
      capsulesOpened: 0,
    });
    expect(newRecords).toEqual(['level']);
    expect(save.records).toEqual({ bestTimeSeconds: 100, bestLevel: 7, mostKills: 50, runs: 2 });
    expect(save.seen.sort()).toEqual(['glucose', 'ldl']);
    expect(save.atp).toBe(42);
  });
});
