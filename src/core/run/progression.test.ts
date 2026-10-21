import { describe, expect, it } from 'vitest';
import { ECONOMY } from '../../config';
import { difficultyAt, waveFactorAt, xpToNextLevel } from './progression';

describe('xpToNextLevel', () => {
  it('segue a tabela da aba Economia até o nível 20', () => {
    expect(xpToNextLevel(1, ECONOMY.xp)).toBe(5);
    expect(xpToNextLevel(5, ECONOMY.xp)).toBe(45);
    expect(xpToNextLevel(10, ECONOMY.xp)).toBe(95);
    expect(xpToNextLevel(20, ECONOMY.xp)).toBe(195);
  });

  it('o incremento sobe depois do nível 20', () => {
    const step20 = xpToNextLevel(21, ECONOMY.xp) - xpToNextLevel(20, ECONOMY.xp);
    const step21 = xpToNextLevel(22, ECONOMY.xp) - xpToNextLevel(21, ECONOMY.xp);
    expect(step21).toBe(step20 + ECONOMY.xp.incrementStep);
  });
});

describe('difficultyAt', () => {
  it('segue a tabela da aba Economia', () => {
    const d = (minutes: number) => difficultyAt(minutes * 60, ECONOMY.difficulty);
    expect(d(0)).toBeCloseTo(1);
    expect(d(5)).toBeCloseTo(2);
    expect(d(10)).toBeCloseTo(3.5);
    expect(d(20)).toBeCloseTo(8);
  });

  it('acelera depois do limiar t*', () => {
    const t = ECONOMY.difficulty.thresholdMinute;
    const quad = (m: number) =>
      1 + ECONOMY.difficulty.linear * m + ECONOMY.difficulty.quadratic * m * m;
    expect(difficultyAt((t + 5) * 60, ECONOMY.difficulty)).toBeGreaterThan(quad(t + 5));
  });
});

describe('waveFactorAt', () => {
  const d = ECONOMY.difficulty;
  const cycle = d.peakEveryMinutes * 60;

  it('não tem pico antes do primeiro ciclo', () => {
    expect(waveFactorAt(cycle - 1, d)).toBe(1);
  });

  it('tem pico, depois respiro, depois volta ao normal', () => {
    expect(waveFactorAt(cycle + 1, d)).toBe(d.peakMultiplier);
    expect(waveFactorAt(cycle + d.peakDurationSeconds + 1, d)).toBe(d.respiteMultiplier);
    expect(waveFactorAt(cycle + d.peakDurationSeconds + d.respiteSeconds + 1, d)).toBe(1);
  });
});
