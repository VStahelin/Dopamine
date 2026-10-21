import { describe, expect, it } from 'vitest';
import { integerZoom, worldScale } from './pixelScale';

describe('integerZoom', () => {
  it('usa 3× num celular de tela 3× em pé (1170 px de largura)', () => {
    expect(integerZoom(1170, 2532, 320)).toBe(3);
  });

  it('nunca fica abaixo de 1×', () => {
    expect(integerZoom(200, 300, 320)).toBe(1);
  });
});

describe('worldScale', () => {
  const details = [2, 3];
  const view = (w: number, h: number) => {
    const s = worldScale(w, h, 360, details);
    return { ...s, visible: Math.min(w, h) / s.zoom };
  };

  it('pixel de arte é sempre um número inteiro de pixels da tela', () => {
    for (const [w, h] of [
      [1170, 2532],
      [750, 1334],
      [1920, 1080],
      [2560, 1440],
      [2400, 1350],
      [3840, 2160],
    ] as const) {
      const s = view(w, h);
      expect(Number.isInteger(s.pixelSize)).toBe(true);
      expect(s.zoom).toBe(s.detail * s.pixelSize);
      expect(s.visible).toBeGreaterThan(250);
      expect(s.visible).toBeLessThan(520);
    }
  });

  it('celular 3× em pé mostra 390 unidades com detalhe 3', () => {
    expect(view(1170, 2532)).toMatchObject({ detail: 3, pixelSize: 1, visible: 390 });
  });

  it('monitor 1080p mostra 360 unidades', () => {
    expect(view(1920, 1080).visible).toBe(360);
  });
});
