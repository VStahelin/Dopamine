export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const ZERO: Vec2 = { x: 0, y: 0 };

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

/** Reduz o vetor para que o comprimento não passe de `max`, mantendo a direção. */
export function clampLength(v: Vec2, max: number): Vec2 {
  const len = length(v);
  if (len <= max || len === 0) return v;
  const scale = max / len;
  return { x: v.x * scale, y: v.y * scale };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
