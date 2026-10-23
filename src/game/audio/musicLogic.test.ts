import { describe, expect, it } from 'vitest';
import { AUDIO } from '../../config';
import { nextVolume, runMusic, runTrack } from './musicLogic';

const base = { time: 0, crisis: false, bossAlive: false, overlay: false, over: false };

describe('música da run', () => {
  it('fica mais pesada nos minutos de audio.json', () => {
    expect(runTrack(0, AUDIO)).toBe('run1');
    expect(runTrack(AUDIO.runTrackMinutes.run2 * 60, AUDIO)).toBe('run2');
    expect(runTrack(AUDIO.runTrackMinutes.run3 * 60 + 1, AUDIO)).toBe('run3');
  });

  it('toca a crise por cima da faixa da run', () => {
    expect(runMusic({ ...base, crisis: true }, AUDIO)).toEqual({
      main: 'run1',
      layer: 'crisis',
      muffled: false,
    });
  });

  it('o chefe vivo troca a faixa e ganha da crise', () => {
    expect(runMusic({ ...base, crisis: true, bossAlive: true }, AUDIO)).toEqual({
      main: 'boss',
      layer: null,
      muffled: false,
    });
  });

  it('abafa com a pausa e silencia no fim da run', () => {
    expect(runMusic({ ...base, overlay: true }, AUDIO).muffled).toBe(true);
    expect(runMusic({ ...base, over: true }, AUDIO).main).toBeNull();
  });
});

describe('botão Música', () => {
  it('passa pelos valores e volta ao zero', () => {
    expect(nextVolume(0.6, [0, 0.2, 0.4, 0.6, 0.8, 1])).toBe(0.8);
    expect(nextVolume(1, [0, 0.2, 0.4, 0.6, 0.8, 1])).toBe(0);
    expect(nextVolume(0.7, [0, 0.2, 0.4, 0.6, 0.8, 1])).toBe(0.8);
  });
});
