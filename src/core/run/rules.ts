import {
  AGENTS,
  ECONOMY,
  ENEMIES,
  PASSIVES,
  RARITIES,
  RUN,
  STATS,
  WEAPONS,
  type AgentDef,
  type AgentId,
  type EconomyConfig,
  type EnemyDef,
  type EnemyKind,
  type PassiveDef,
  type PassiveId,
  type RarityConfig,
  type RunConfig,
  type StatsConfig,
  type WeaponDef,
  type WeaponId,
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
  weapons: Record<WeaponId, WeaponDef>;
  passives: Record<PassiveId, PassiveDef>;
  rarities: RarityConfig;
  agents: Record<AgentId, AgentDef>;
}

export const DEFAULT_RULES: RunRules = {
  run: RUN,
  economy: ECONOMY,
  stats: STATS,
  enemies: ENEMIES,
  weapons: WEAPONS,
  passives: PASSIVES,
  rarities: RARITIES,
  agents: AGENTS,
};
