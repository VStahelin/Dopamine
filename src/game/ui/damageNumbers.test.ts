import { describe, expect, it } from 'vitest';
import { hitKind, hitLabel } from './damageNumbers';

describe('números de dano', () => {
  it('escolhe o tipo pelo crítico e pela afinidade', () => {
    expect(hitKind({ crit: false, affinity: 1 })).toBe('damage');
    expect(hitKind({ crit: true, affinity: 0.5 })).toBe('crit');
    expect(hitKind({ crit: false, affinity: 1.5 })).toBe('strong');
    expect(hitKind({ crit: false, affinity: 0.5 })).toBe('weak');
    expect(hitKind({ crit: true, affinity: 0 })).toBe('immune');
  });

  it('crítico ganha "!" e dano pequeno aparece como 1', () => {
    expect(hitLabel('crit', 37.6)).toBe('38!');
    expect(hitLabel('damage', 0.2)).toBe('1');
    expect(hitLabel('immune', 5)).toBe('IMUNE');
  });
});
