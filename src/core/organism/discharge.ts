import { defaultIdle } from '../idle/progress';
import { defaultProgress } from '../meta/progress';
import type { SaveData } from '../save/saveData';
import { canDischarge, discharge } from './organism';

/**
 * ALTA (decisão 0023): o organismo passa para o próximo indivíduo, mais doente, com os pontos
 * herdados. Zera o Laboratório, as estrelas, o baú, o campo longo e o ATP; mantém os agentes e as
 * armas desbloqueados (run e idle), os recordes e as conquistas, e guarda o caso curado na lista de
 * casos anteriores. `null` se a ALTA ainda não abriu.
 */
export function dischargeSave(save: SaveData, now: number): SaveData | null {
  if (!canDischarge(save.organism)) return null;
  const meta = defaultProgress();
  const idle = defaultIdle(now);
  const r = save.records;
  return {
    ...save,
    atp: 0,
    records: { ...r, caseRuns: 0, caseBestSeconds: 0 },
    cases: [
      ...save.cases,
      {
        individual: save.organism.individual,
        runs: r.caseRuns,
        bestTimeSeconds: r.caseBestSeconds,
      },
    ],
    organism: discharge(save.organism),
    meta: { ...meta, agents: save.meta.agents, weapons: save.meta.weapons },
    idle: {
      ...idle,
      agents: save.idle.agents,
      levels: Object.fromEntries(save.idle.agents.map((id) => [id, 1])),
    },
  };
}
