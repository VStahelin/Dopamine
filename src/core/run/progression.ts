import type { EconomyConfig } from '../../config';

/** XP para sair do nível `level` (aba Economia, fórmula 1). */
export function xpToNextLevel(level: number, xp: EconomyConfig['xp']): number {
  let total = xp.base;
  for (let k = 1; k < level; k++) {
    total += xp.increment + xp.incrementStep * Math.floor((k - 1) / xp.incrementStepEveryLevels);
  }
  return total;
}

/** Dificuldade D(t), com t em segundos (aba Economia, fórmula 2). Multiplica vida e quantidade. */
export function difficultyAt(timeSeconds: number, d: EconomyConfig['difficulty']): number {
  const m = timeSeconds / 60;
  let value = 1 + d.linear * m + d.quadratic * m * m;
  if (m > d.thresholdMinute) value += d.cubic * (m - d.thresholdMinute) ** 3;
  return value;
}

/** Dente de serra: pico a cada N minutos, seguido de um respiro com menos inimigos. */
export function waveFactorAt(timeSeconds: number, d: EconomyConfig['difficulty']): number {
  const cycle = d.peakEveryMinutes * 60;
  if (timeSeconds < cycle) return 1;
  const phase = timeSeconds % cycle;
  if (phase < d.peakDurationSeconds) return d.peakMultiplier;
  if (phase < d.peakDurationSeconds + d.respiteSeconds) return d.respiteMultiplier;
  return 1;
}
