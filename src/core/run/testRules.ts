import { DEFAULT_RULES, type RunRules } from './rules';

/**
 * Regras para testes: sem inimigos nem chefes nascendo sozinhos e com gema garantida, para cada
 * teste montar a cena que quer. A Dopamina usa o Radical Livre como ação, um disparo previsível em
 * linha reta.
 */
export function rulesWithoutSpawn(): RunRules {
  return {
    ...DEFAULT_RULES,
    run: {
      ...DEFAULT_RULES.run,
      spawn: { ...DEFAULT_RULES.run.spawn, baseEnemiesPerSecond: 0 },
      bosses: [],
    },
    // Toda molécula solta gema: os testes contam com o XP de cada uma.
    drops: {
      ...DEFAULT_RULES.drops,
      gems: { ...DEFAULT_RULES.drops.gems, chance: { common: 1, fragment: 1, strong: 1 } },
    },
    agents: {
      ...DEFAULT_RULES.agents,
      dopamine: { ...DEFAULT_RULES.agents.dopamine, action: 'radical' },
    },
  };
}

export const DT = 1 / 60;
export const STILL = { move: { x: 0, y: 0 }, viewRadius: 300 };
