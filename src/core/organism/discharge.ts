import { defaultIdle } from '../idle/progress';
import { defaultProgress } from '../meta/progress';
import type { SaveData } from '../save/saveData';
import { canDischarge, discharge } from './organism';

/**
 * ALTA (decisão 0023): o organismo passa para o próximo indivíduo, mais doente, com os pontos
 * herdados. Zera o Laboratório, as estrelas, o baú, o campo longo e o ATP; mantém os agentes e as
 * armas desbloqueados (run e idle) e os recordes. `null` se a ALTA ainda não abriu.
 */
export function dischargeSave(save: SaveData, now: number): SaveData | null {
  if (!canDischarge(save.organism)) return null;
  const meta = defaultProgress();
  const idle = defaultIdle(now);
  return {
    ...save,
    atp: 0,
    organism: discharge(save.organism),
    meta: { ...meta, agents: save.meta.agents, weapons: save.meta.weapons },
    idle: {
      ...idle,
      agents: save.idle.agents,
      levels: Object.fromEntries(save.idle.agents.map((id) => [id, 1])),
    },
  };
}
