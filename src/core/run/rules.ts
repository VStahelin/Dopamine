import {
  ECONOMY,
  ENEMIES,
  PASSIVES,
  RUN,
  STATS,
  WEAPONS,
  type EconomyConfig,
  type EnemyDef,
  type EnemyKind,
  type PassiveDef,
  type PassiveId,
  type RunConfig,
  type StatsConfig,
  type WeaponDef,
} from '../../config';

/**
 * Tudo o que a simulação da run lê da configuração. Vem como parâmetro, e não importado direto,
 * para que testes e o simulador rodem com variações.
 */
export interface RunRules {
  run: RunConfig;
  economy: EconomyConfig;
  stats: StatsConfig;
  enemies: Record<EnemyKind, EnemyDef>;
  weapon: WeaponDef;
  passives: Record<PassiveId, PassiveDef>;
}

export const DEFAULT_RULES: RunRules = {
  run: RUN,
  economy: ECONOMY,
  stats: STATS,
  enemies: ENEMIES,
  weapon: WEAPONS.radical,
  passives: PASSIVES,
};
