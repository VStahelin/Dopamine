import { DEFAULT_RULES, type RunRules } from './rules';

/** Regras para testes: sem inimigos nascendo sozinhos, para cada teste montar a cena que quer. */
export function rulesWithoutSpawn(): RunRules {
  return {
    ...DEFAULT_RULES,
    run: {
      ...DEFAULT_RULES.run,
      spawn: { ...DEFAULT_RULES.run.spawn, baseEnemiesPerSecond: 0 },
    },
  };
}

export const DT = 1 / 60;
export const STILL = { move: { x: 0, y: 0 }, viewRadius: 300 };
