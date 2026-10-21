import { describe, expect, it } from 'vitest';
import { ECONOMY, META } from '../../config';
import { DEFAULT_RULES } from '../run/rules';
import { createRun } from '../run/state';
import { levelUpOffer } from '../run/upgrades';
import {
  addRunStars,
  buyLab,
  buyUnlock,
  defaultProgress,
  labCost,
  labState,
  openChest,
  playableAgent,
  rulesWithProgress,
  starsFor,
} from './progress';

describe('Laboratório', () => {
  it('começa só com a raiz disponível', () => {
    const p = defaultProgress();
    const available = Object.keys(META.lab.nodes).filter((id) => labState(p, id) === 'available');
    expect(available).toEqual(['interactions']);
  });

  it('comprar a raiz libera as cabeças das colunas e cobra o custo', () => {
    const cost = labCost(META.lab.nodes.interactions!, 0);
    const bought = buyLab(defaultProgress(), cost + 5, 'interactions')!;
    expect(bought.atp).toBe(5);
    expect(labState(bought.progress, 'damage')).toBe('available');
    expect(labState(bought.progress, 'critChance')).toBe('locked');
  });

  it('não compra sem ATP, bloqueado ou no máximo', () => {
    expect(buyLab(defaultProgress(), 0, 'interactions')).toBeNull();
    expect(buyLab(defaultProgress(), 1e6, 'damage')).toBeNull();
    const maxed = { ...defaultProgress(), lab: { interactions: 5 } };
    expect(buyLab(maxed, 1e6, 'interactions')).toBeNull();
  });

  it('o custo cresce com a taxa da aba Economia', () => {
    const node = META.lab.nodes.damage!;
    expect(labCost(node, 1)).toBe(Math.round(node.baseCost * ECONOMY.upgrades.runCostRate));
  });

  it('soma os níveis à base dos atributos da run, inclusive os do especial', () => {
    const p = { ...defaultProgress(), lab: { damage: 2, specialCooldown: 1 } };
    const rules = rulesWithProgress(DEFAULT_RULES, p);
    expect(rules.stats.offense.damage!.base).toBeCloseTo(1.1);
    expect(rules.stats.special.cooldown!.base).toBeCloseTo(0.98);
    expect(createRun(1, rules).stats.damage).toBeCloseTo(1.1);
  });
});

describe('desbloqueios', () => {
  it('arma bloqueada não aparece no level up', () => {
    const rules = rulesWithProgress(DEFAULT_RULES, defaultProgress());
    for (let seed = 1; seed < 30; seed++) {
      const run = createRun(seed, rules);
      const ids = levelUpOffer(run).flatMap((c) => (c.kind === 'weapon' ? [c.id] : []));
      for (const id of ids) {
        if (rules.weapons[id].source === 'pool') expect(META.start.weapons).toContain(id);
      }
    }
  });

  it('desbloquear cobra o custo uma vez', () => {
    const cost = META.unlockCost.weapons.uvRay!;
    const first = buyUnlock(defaultProgress(), cost, 'weapons', 'uvRay')!;
    expect(first.atp).toBe(0);
    expect(first.progress.weapons).toContain('uvRay');
    expect(buyUnlock(first.progress, 1e6, 'weapons', 'uvRay')).toBeNull();
  });

  it('agente bloqueado volta para um liberado', () => {
    expect(playableAgent(defaultProgress(), 'lipase')).toBe('dopamine');
  });
});

describe('estrelas e baú', () => {
  it('conta as metas de tempo alcançadas', () => {
    const [a, b] = ECONOMY.meta.caseStarMinutes;
    expect(starsFor(a! * 60 - 1)).toBe(0);
    expect(starsFor(b! * 60)).toBe(2);
  });

  it('só estrelas novas enchem o baú, e abrir passa o ATP', () => {
    const [, b] = ECONOMY.meta.caseStarMinutes;
    const first = addRunStars(defaultProgress(), b! * 60);
    expect(first.newStars).toBe(2);
    expect(first.reward).toBe(META.starRewards[0]! + META.starRewards[1]!);
    expect(addRunStars(first.progress, b! * 60).newStars).toBe(0);
    const opened = openChest(first.progress, 10);
    expect(opened.atp).toBe(10 + first.reward);
    expect(opened.progress.chest).toBe(0);
  });
});
