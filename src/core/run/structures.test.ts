import { describe, expect, it } from 'vitest';
import { createRun, type RunState } from './state';
import { stepRun } from './step';
import { chooseSynapse, synapseOffer } from './structures';
import { DT, rulesWithoutSpawn, STILL } from './testRules';

function run(seed = 1): RunState {
  const base = rulesWithoutSpawn();
  return createRun(seed, {
    ...base,
    run: {
      ...base.run,
      aggregates: { ...base.run.aggregates, minGapSeconds: 1e9, maxGapSeconds: 1e9 },
      formations: { ...base.run.formations, firstAtSeconds: 1e9 },
    },
  });
}

function advance(r: RunState, seconds: number) {
  const until = r.time + seconds;
  while (r.time < until && !r.synapseOffer) {
    r.pendingLevelUps = 0;
    stepRun(r, STILL, DT);
  }
}

describe('sinapses e estruturas (fase 5.11)', () => {
  it('a run começa com uma sinapse perto do agente', () => {
    const r = run();
    stepRun(r, STILL, DT);
    expect(r.structures).toHaveLength(1);
    const s = r.structures[0]!;
    expect(s.kind).toBe('synapse');
    expect(Math.hypot(s.x, s.y)).toBeCloseTo(r.rules.structures.firstSynapseDistancePx);
  });

  it('dentro do círculo a sinapse enche e abre 3 cartões; a run para até escolher', () => {
    const r = run();
    stepRun(r, STILL, DT);
    const s = r.structures[0]!;
    s.x = 0;
    s.y = 10;
    advance(r, r.rules.structures.synapse.fillSeconds + 1);
    expect(r.synapseOffer).toHaveLength(3);
    const t = r.time;
    stepRun(r, STILL, DT);
    expect(r.time).toBe(t);
    const before = { ...r.stats };
    chooseSynapse(r, r.synapseOffer![0]!);
    expect(r.synapseOffer).toBeNull();
    expect(JSON.stringify(r.stats)).not.toBe(JSON.stringify(before));
  });

  it('fora do círculo a barra esvazia devagar, sem zerar de vez', () => {
    const r = run();
    stepRun(r, STILL, DT);
    const s = r.structures[0]!;
    s.progress = 0.5;
    advance(r, 1);
    const drain =
      (1 / r.rules.structures.synapse.fillSeconds) * r.rules.structures.synapse.drainFactor;
    expect(s.progress).toBeCloseTo(0.5 - drain, 1);
  });

  it('a potenciada só oferece as raridades mais altas', () => {
    const r = run();
    for (let i = 0; i < 50; i++) {
      for (const c of synapseOffer(r, true)) {
        expect(
          c.kind === 'boost' && c.rarity! >= r.rules.structures.synapse.potentiatedMinRarity,
        ).toBe(true);
      }
    }
  });

  it('a Glândula adrenal dá ATP e Estresse a cada entrada, até 3 vezes', () => {
    const r = run();
    stepRun(r, STILL, DT);
    r.structures = [{ id: 99, kind: 'adrenal', x: 0, y: 0, progress: 0, inside: false, uses: 3 }];
    stepRun(r, STILL, DT);
    expect(r.atp).toBeGreaterThan(0);
    expect(r.stats.curse).toBeCloseTo(r.rules.structures.adrenal.stress);
    // Ficar dentro não conta de novo; sair e voltar conta.
    stepRun(r, STILL, DT);
    expect(r.structures[0]!.uses).toBe(2);
  });

  it('o Coágulo chama um agregado que solta duas ampolas', () => {
    const r = run();
    stepRun(r, STILL, DT);
    r.structures = [{ id: 99, kind: 'clot', x: 0, y: 0, progress: 0, inside: false, uses: 1 }];
    stepRun(r, STILL, DT);
    const e = r.enemies.find((x) => x.aggregate);
    expect(e?.extraAmpoules).toBe(2);
  });

  it('o Foco inflamatório chama o cerco e dá ampola se ele for decomposto a tempo', () => {
    const r = run();
    stepRun(r, STILL, DT);
    r.structures = [{ id: 99, kind: 'focus', x: 0, y: 0, progress: 0, inside: false, uses: 1 }];
    stepRun(r, STILL, DT);
    expect(r.challenge).not.toBeNull();
    for (const e of r.enemies) e.hp = 0;
    stepRun(r, STILL, DT);
    expect(r.challenge).toBeNull();
    expect(r.pickups.some((p) => p.kind === 'ampoule')).toBe(true);
  });
});
