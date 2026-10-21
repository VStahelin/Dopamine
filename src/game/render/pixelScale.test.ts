import { describe, expect, it } from 'vitest';
import { integerZoom } from './pixelScale';

describe('integerZoom', () => {
  it('usa 1× num celular em pé', () => {
    expect(integerZoom(390, 844, 360)).toBe(1);
  });

  it('usa 3× num monitor 1080p', () => {
    expect(integerZoom(1920, 1080, 360)).toBe(3);
  });

  it('nunca fica abaixo de 1×', () => {
    expect(integerZoom(200, 300, 360)).toBe(1);
  });
});
