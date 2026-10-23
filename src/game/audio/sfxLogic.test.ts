import { describe, expect, it } from 'vitest';
import { hurtSound, lowHealthTick, sfxLevel } from './sfxLogic';

const cfg = { heavyHurtRatio: 0.1, lowHealthRatio: 0.25, lowHealthRepeatSeconds: 4 };
const sound = {
  muted: false,
  masterVolume: 0.5,
  musicVolume: 1,
  sfxVolume: 0.8,
  muffleOnPause: true,
  playInBackground: false,
};

describe('sfxLevel', () => {
  it('multiplica Geral e Efeitos e zera no mudo', () => {
    expect(sfxLevel(sound)).toBeCloseTo(0.4);
    expect(sfxLevel({ ...sound, muted: true })).toBe(0);
  });
});

describe('hurtSound', () => {
  it('escolhe bloqueio, golpe pesado ou o comum', () => {
    expect(hurtSound(1, 3, 100, cfg)).toBe('shieldBlock');
    expect(hurtSound(12, 2, 100, cfg)).toBe('hurtHeavy');
    expect(hurtSound(5, 0, 100, cfg)).toBe('hurt');
  });
});

describe('lowHealthTick', () => {
  it('toca ao cair abaixo do limite e repete no intervalo', () => {
    let t = lowHealthTick(0.2, 0, 0.1, cfg);
    expect(t.play).toBe(true);
    t = lowHealthTick(0.2, t.timer, 1, cfg);
    expect(t.play).toBe(false);
    t = lowHealthTick(0.2, t.timer, 3.1, cfg);
    expect(t.play).toBe(true);
  });
  it('fica quieto com a vida acima do limite ou zerada', () => {
    expect(lowHealthTick(0.5, 0, 0.1, cfg).play).toBe(false);
    expect(lowHealthTick(0, 0, 0.1, cfg).play).toBe(false);
  });
});
