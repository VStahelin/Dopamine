import { describe, expect, it } from 'vitest';
import { AUDIO } from '../../config';
import { musicLevel, runMusic, runTrack, stepVolume } from './musicLogic';

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

describe('volume', () => {
  it('o Geral multiplica a Música e o mudo zera', () => {
    const sound = { ...AUDIO.sound, masterVolume: 0.5, musicVolume: 0.8 };
    expect(musicLevel(sound)).toBeCloseTo(0.4);
    expect(musicLevel({ ...sound, muted: true })).toBe(0);
  });

  it('anda em passos de 10% sem sair de 0 a 1', () => {
    expect(stepVolume(0.7, 1)).toBe(0.8);
    expect(stepVolume(0.7, -1)).toBe(0.6);
    expect(stepVolume(1, 1)).toBe(1);
    expect(stepVolume(0, -1)).toBe(0);
  });
});
