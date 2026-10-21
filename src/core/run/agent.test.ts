import { describe, expect, it } from 'vitest';
import { length } from '../math/vec2';
import { createAgent, moveAgent } from './agent';

const bounds = { width: 1000, height: 1000 };

describe('moveAgent', () => {
  it('anda na direção pedida, na velocidade dada', () => {
    const agent = moveAgent(createAgent({ x: 100, y: 100 }), { x: 1, y: 0 }, 0.5, 80, bounds);
    expect(agent.position).toEqual({ x: 140, y: 100 });
  });

  it('não anda mais rápido na diagonal', () => {
    const start = { x: 500, y: 500 };
    const agent = moveAgent(createAgent(start), { x: 1, y: 1 }, 1, 80, bounds);
    const moved = { x: agent.position.x - start.x, y: agent.position.y - start.y };
    expect(length(moved)).toBeCloseTo(80);
  });

  it('respeita a intensidade do joystick analógico', () => {
    const agent = moveAgent(createAgent({ x: 100, y: 100 }), { x: 0, y: 0.5 }, 1, 80, bounds);
    expect(agent.position).toEqual({ x: 100, y: 140 });
  });

  it('não sai dos limites do mapa', () => {
    const agent = moveAgent(createAgent({ x: 5, y: 995 }), { x: -1, y: 1 }, 1, 80, bounds);
    expect(agent.position.x).toBe(0);
    expect(agent.position.y).toBe(1000);
  });
});
