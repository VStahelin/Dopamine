import { breakSolid, pushOut, updateMap } from '../map/world';
import { weaponHitTest } from './items';
import type { RunState } from './state';
import { coinValue } from './upgrades';

/**
 * O mapa gerado dentro da run (fase 5.7): blocos em volta do agente, ninhos de vesículas,
 * colisão com os obstáculos e os destrutíveis que quebram com golpes.
 */

/** Gera os blocos em volta do agente e põe as vesículas dos ninhos novos no chão. */
export function updateRunMap(state: RunState): void {
  const nests = updateMap(state.rules.map, state.map, state.agent.x, state.agent.y);
  for (const n of nests) state.vesicles.push({ x: n.x, y: n.y });
}

/**
 * Tira o agente e as moléculas de dentro dos obstáculos: eles deslizam pela borda. O chefe e as
 * moléculas das formações atravessam (docs/mapas.md).
 */
export function collideWithMap(state: RunState): void {
  const { map, agent } = state;
  if (map.solids.length === 0) return;
  const a = pushOut(map, agent.x, agent.y, state.rules.run.agent.radiusPx);
  agent.x = a.x;
  agent.y = a.y;
  for (const e of state.enemies) {
    if (e.boss || e.formation || e.hp <= 0) continue;
    const p = pushOut(map, e.x, e.y, e.radius);
    e.x = p.x;
    e.y = p.y;
  }
}

/**
 * Destrutíveis: cada passo com golpe conta um; com os golpes do ambiente ele quebra e solta o que
 * a tabela diz. O chefe quebra os que encosta.
 */
export function updateDestructibles(state: RunState, firstEvent: number): void {
  const { map, rules, agent } = state;
  const env = rules.map.environments[map.params.env];
  const reach = state.viewRadius;
  const hit = weaponHitTest(state, firstEvent);
  const bosses = state.enemies.filter((e) => e.boss && e.hp > 0);
  const broken: { chunk: string; index: number; x: number; y: number }[] = [];
  for (const { chunk, object: o } of map.solids) {
    if (o.kind !== 'destructible') continue;
    if ((o.x - agent.x) ** 2 + (o.y - agent.y) ** 2 > reach * reach) continue;
    const crushed = bosses.some(
      (b) => (b.x - o.x) ** 2 + (b.y - o.y) ** 2 <= (b.radius + o.radius) ** 2,
    );
    if (!crushed && !hit(o.x, o.y, o.radius)) continue;
    const key = `${chunk}:${o.index}`;
    const hits = (map.hits.get(key) ?? 0) + 1;
    map.hits.set(key, hits);
    if (crushed || hits >= env.destructible.hits)
      broken.push({ chunk, index: o.index, x: o.x, y: o.y });
  }
  for (const b of broken) {
    breakSolid(rules.map, map, b.chunk, b.index);
    state.events.push({ type: 'destructible', x: b.x, y: b.y });
    switch (env.destructible.drop) {
      case 'atp':
        state.coins.push({ x: b.x, y: b.y, value: coinValue(state), attracted: false });
        break;
      case 'gem':
        state.gems.push({ x: b.x, y: b.y, value: 1, attracted: false });
        break;
      case 'vesicle':
        state.vesicles.push({ x: b.x, y: b.y });
        break;
    }
  }
}
