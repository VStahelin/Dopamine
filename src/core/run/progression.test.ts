import { describe, expect, it } from 'vitest';
import { ECONOMY } from '../../config';
import {
  difficultyAt,
  enemyDamageAt,
  enemyHpAt,
  enemySpeedAt,
  waveAt,
  waveFactorAt,
  xpToNextLevel,
} from './progression';

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

describe('waveAt', () => {
  const d = ECONOMY.difficulty;
  const cycle = d.peakEveryMinutes * 60;

  it('conta uma onda por ciclo e marca o pico no começo de cada ciclo depois do primeiro', () => {
    expect(waveAt(0, d)).toEqual({ wave: 1, peak: false });
    expect(waveAt(cycle + 1, d)).toEqual({ wave: 2, peak: true });
    expect(waveAt(cycle + d.peakDurationSeconds + 1, d)).toEqual({ wave: 2, peak: false });
  });
});

describe('curva contínua do fim de jogo (decisão 0038)', () => {
  const d = ECONOMY.difficulty;
  it('o dano de contato dobra a cada damageDoublingMinutes', () => {
    expect(enemyDamageAt(0, d)).toBe(1);
    expect(enemyDamageAt(d.damageDoublingMinutes * 60, d)).toBeCloseTo(2);
    expect(enemyDamageAt(d.damageDoublingMinutes * 120, d)).toBeCloseTo(4);
  });

  it('depois de lateMinute, a vida também dobra a cada hpDoublingMinutes', () => {
    const at = (m: number) => enemyHpAt(m * 60, d) / difficultyAt(m * 60, d);
    const base = (m: number) => d.hpStart * (1 + d.hpLinear * m + d.hpQuadratic * m * m);
    expect(at(d.lateMinute) / base(d.lateMinute)).toBeCloseTo(1);
    const later = d.lateMinute + d.hpDoublingMinutes;
    expect(at(later) / base(later)).toBeCloseTo(2);
  });

  it('a velocidade sobe até o teto', () => {
    expect(enemySpeedAt(0, d)).toBe(1);
    expect(enemySpeedAt(600 * 60, d)).toBe(d.maxSpeedMultiplier);
  });
});
