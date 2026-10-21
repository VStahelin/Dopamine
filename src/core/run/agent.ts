import { clamp, clampLength, type Vec2 } from '../math/vec2';

export interface AgentState {
  readonly position: Vec2;
}

export interface Bounds {
  readonly width: number;
  readonly height: number;
}

export function createAgent(position: Vec2): AgentState {
  return { position };
}

/**
 * Move o agente na direção pedida pelo jogador.
 * `intent` vem do teclado ou do joystick, com comprimento de 0 a 1; acima de 1 é cortado,
 * para a diagonal não ser mais rápida. O agente não sai dos limites do mapa.
 */
export function moveAgent(
  agent: AgentState,
  intent: Vec2,
  dtSeconds: number,
  speed: number,
  bounds: Bounds,
): AgentState {
  const dir = clampLength(intent, 1);
  return {
    ...agent,
    position: {
      x: clamp(agent.position.x + dir.x * speed * dtSeconds, 0, bounds.width),
      y: clamp(agent.position.y + dir.y * speed * dtSeconds, 0, bounds.height),
    },
  };
}
