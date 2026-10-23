import { describe, expect, it } from 'vitest';
import { AGENTS, MAP, ORGANISM } from '../../config';
import { DEFAULT_RULES } from '../run/rules';
import { createRun } from '../run/state';
import { nativeLevel, statSources } from '../run/upgrades';
import {
  canEnter,
  indicatedLocal,
  localHealth,
  localsUnlocked,
  resolveLocal,
  rulesWithLocal,
  synergyOf,
} from './local';
import { defaultOrganism, runHealth } from './organism';

describe('locais do corpo', () => {
  it('a Lipase não atravessa a barreira; os outros entram em tudo', () => {
    expect(canEnter(AGENTS.lipase, 'brain')).toBe(false);
    expect(canEnter(AGENTS.lipase, 'intestine')).toBe(true);
    expect(canEnter(AGENTS.dopamine, 'brain')).toBe(true);
  });

  it('cada agente de hoje tem um local de sinergia', () => {
    expect(synergyOf(AGENTS.dopamine, 'brain')).toBe('mental');
    expect(synergyOf(AGENTS.lipase, 'intestine')).toBe('physical');
    expect(synergyOf(AGENTS.insulin, 'liver')).toBe('physical');
    expect(synergyOf(AGENTS.insulin, 'blood')).toBeNull();
  });

  it('abrem na primeira estrela e ficam abertos depois da ALTA', () => {
    const o = defaultOrganism();
    expect(localsUnlocked(0, o)).toBe(false);
    expect(localsUnlocked(1, o)).toBe(true);
    expect(localsUnlocked(0, { ...o, individual: 2 })).toBe(true);
  });

  it('o INDICADO é o local do setor mais baixo', () => {
    const o = defaultOrganism();
    expect(indicatedLocal({ ...o, sectors: { ...o.sectors, physical: 10 } })).toBe('intestine');
    expect(
      indicatedLocal({
        ...o,
        sectors: { physical: 50, mental: 50, executive: 5, social: 50 },
      }),
    ).toBe('lung');
  });

  it('fechado, ou barrado no Cérebro, vira a Corrente sanguínea', () => {
    expect(resolveLocal('liver', AGENTS.insulin, 1, false)).toEqual({
      env: 'blood',
      random: false,
    });
    expect(resolveLocal('brain', AGENTS.lipase, 1, true)).toEqual({ env: 'blood', random: false });
    expect(resolveLocal('liver', AGENTS.insulin, 1, true)).toEqual({ env: 'liver', random: false });
  });

  it('o sorteio nunca leva a Lipase ao Cérebro', () => {
    for (let seed = 0; seed < 200; seed++) {
      const l = resolveLocal('random', AGENTS.lipase, seed, true);
      expect(l.random).toBe(true);
      expect(l.env).not.toBe('brain');
    }
  });
});

describe('regras no local', () => {
  it('a família do local pesa o dobro; a Corrente sanguínea não muda nada', () => {
    const r = rulesWithLocal(DEFAULT_RULES, { env: 'liver', random: false }, AGENTS.insulin);
    const toxin = Object.keys(DEFAULT_RULES.enemies).find(
      (k) => DEFAULT_RULES.enemies[k as keyof typeof DEFAULT_RULES.enemies].type === 'toxin',
    ) as keyof typeof DEFAULT_RULES.enemies;
    expect(r.enemies[toxin].spawnWeight).toBe(
      DEFAULT_RULES.enemies[toxin].spawnWeight * MAP.locals.familyWeight,
    );
    expect(r.familyWeights?.toxin).toBe(MAP.locals.familyWeight);
    expect(r.mapEnv).toBe('liver');
    const blood = rulesWithLocal(DEFAULT_RULES, { env: 'blood', random: false }, AGENTS.insulin);
    expect(blood.enemies).toEqual(DEFAULT_RULES.enemies);
  });

  it('o sorteio dá +10% de ATP, que aparece como LOCAL na pausa', () => {
    const r = rulesWithLocal(DEFAULT_RULES, { env: 'lung', random: true }, AGENTS.dopamine);
    const run = createRun(1, r, 'dopamine');
    const src = statSources(run, 'currencyGain');
    expect(src).toContainEqual({ source: 'local', amount: MAP.locals.randomAtpBonus });
  });

  it('com sinergia, o receptor nativo começa no nível 1', () => {
    const syn = rulesWithLocal(DEFAULT_RULES, { env: 'brain', random: false }, AGENTS.dopamine);
    expect(syn.local?.synergy).toBe('mental');
    expect(nativeLevel(createRun(1, syn, 'dopamine'))).toBe(ORGANISM.synergy.nativeReceptorLevel);
    const plain = rulesWithLocal(DEFAULT_RULES, { env: 'lung', random: false }, AGENTS.dopamine);
    expect(nativeLevel(createRun(1, plain, 'dopamine'))).toBe(0);
  });
});

describe('saúde no local', () => {
  const full = ORGANISM.run.minutesForFullEffect;

  it('na Corrente sanguínea é a saúde de sempre', () => {
    const h = localHealth(AGENTS.lipase, full, 'blood');
    expect(h.total).toEqual(runHealth(AGENTS.lipase, full));
    expect(h.local).toEqual({});
    expect(h.synergy).toEqual({});
  });

  it('Lipase no Intestino: ×1,5 no setor do local, +4 e colateral pela metade', () => {
    const base = runHealth(AGENTS.lipase, full);
    const h = localHealth(AGENTS.lipase, full, 'intestine');
    const gain = AGENTS.lipase.health!.physical!;
    expect(h.total.physical).toBeCloseTo(
      gain * MAP.locals.sectorMultiplier + ORGANISM.synergy.health,
    );
    for (const [s, v] of Object.entries(AGENTS.lipase.collateral ?? {})) {
      expect(h.total[s as keyof typeof h.total]).toBeCloseTo(
        v * ORGANISM.synergy.collateralMultiplier,
      );
    }
    expect(h.agent).toEqual(base);
  });

  it('o setor do local só multiplica o que o agente já sobe', () => {
    // A Lipase não sobe Social: no Fígado, nada muda.
    const h = localHealth(AGENTS.lipase, full, 'liver');
    expect(h.local).toEqual({});
    expect(h.total).toEqual(runHealth(AGENTS.lipase, full));
  });
});
