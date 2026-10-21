import { describe, expect, it } from 'vitest';
import { clamp, clampLength, length } from './vec2';

describe('clampLength', () => {
  it('mantém vetores menores que o limite', () => {
    expect(clampLength({ x: 0.3, y: 0.4 }, 1)).toEqual({ x: 0.3, y: 0.4 });
  });

  it('reduz vetores maiores mantendo a direção', () => {
    const v = clampLength({ x: 1, y: 1 }, 1);
    expect(length(v)).toBeCloseTo(1);
    expect(v.x).toBeCloseTo(v.y);
  });

  it('não quebra com o vetor zero', () => {
    expect(clampLength({ x: 0, y: 0 }, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe('clamp', () => {
  it('limita ao intervalo', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
