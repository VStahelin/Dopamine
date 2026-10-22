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
  type StatGroup,
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
  /** Armas do pool liberadas na meta-progressão; sem a lista, todas. */
  unlockedWeapons?: readonly WeaponId[];
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

/**
 * Regras com bônus somados à base dos atributos (Laboratório, setores do organismo). As chaves são
 * as de stats.json; os atributos do especial vêm como `special.<chave>`.
 */
export function withStatBonuses(rules: RunRules, bonuses: Record<string, number>): RunRules {
  const stats = Object.fromEntries(
    (Object.entries(rules.stats) as [string, StatGroup][]).map(([group, entries]) => [
      group,
      Object.fromEntries(
        Object.entries(entries).map(([key, stat]) => {
          const bonus = bonuses[group === 'special' ? `special.${key}` : key] ?? 0;
          return [key, bonus === 0 ? stat : { ...stat, base: stat.base + bonus }];
        }),
      ),
    ]),
  ) as unknown as StatsConfig;
  return { ...rules, stats };
}
