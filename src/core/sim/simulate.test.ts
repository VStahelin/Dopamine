import { describe, expect, it } from 'vitest';
import { simulate } from './simulate';

describe('simulador', () => {
  it('é determinístico e gasta o ATP entre as runs', () => {
    const a = simulate({ runs: 3, seed: 5, maxSeconds: 90 });
    const b = simulate({ runs: 3, seed: 5, maxSeconds: 90 });
    expect(a).toEqual(b);
    expect(a.runs).toHaveLength(3);
    expect(a.runs.every((r) => r.timeSeconds > 0 && r.kills > 0)).toBe(true);
  });
});
