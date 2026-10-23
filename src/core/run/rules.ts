import {
  AGENTS,
  DROPS,
  ECONOMY,
  MAP,
  ENEMIES,
  PASSIVES,
  RARITIES,
  RUN,
  STATS,
  STRUCTURES,
  SUPPLEMENTS,
  WEAPONS,
  type AgentDef,
  type AgentId,
  type DropsConfig,
  type MapConfig,
  type MapEnvironment,
  type EconomyConfig,
  type EnemyDef,
  type EnemyKind,
  type MoleculeType,
  type PassiveDef,
  type PassiveId,
  type RarityConfig,
  type RunConfig,
  type Sector,
  type StatGroup,
  type StatsConfig,
  type StructuresConfig,
  type SupplementsConfig,
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
  drops: DropsConfig;
  supplements: SupplementsConfig;
  structures: StructuresConfig;
  map: MapConfig;
  /** Ambiente do mapa; sem ele, sorteado pela semente da run (fase 5.7). */
  mapEnv?: MapEnvironment;
  /** Local escolhido (fase 5.12): o ambiente, se veio do sorteio e o setor da sinergia. */
  local?: { env: MapEnvironment; random: boolean; synergy: Sector | null };
  /** Nível com que o receptor nativo começa (sinergia agente × local); sem ele, 0. */
  nativeReceptorStart?: number;
  /** Peso de cada família pela doença do indivíduo (organismo); escolhe as formações. */
  familyWeights?: Partial<Record<MoleculeType, number>>;
  /** Cápsulas já abertas no save, para a sorte de principiante; sem o número, 0. */
  capsulesOpened?: number;
  /** Receptores liberados na meta-progressão; sem a lista, todos. */
  unlockedReceptors?: readonly PassiveId[];
  /** Armas do pool liberadas na meta-progressão; sem a lista, todas. */
  unlockedWeapons?: readonly WeaponId[];
  /** Agentes ainda presos (fase 5.16): a cápsula de agente liberta um deles; sem a lista, nenhum. */
  lockedAgents?: readonly AgentId[];
  /** Quanto cada origem somou à base dos atributos (Laboratório, organismo), para a pausa. */
  baseSources?: Partial<Record<BaseSource, Record<string, number>>>;
}

/** Origens que mexem na base dos atributos antes da run. */
export type BaseSource = 'lab' | 'organism' | 'local';

export const DEFAULT_RULES: RunRules = {
  run: RUN,
  economy: ECONOMY,
  stats: STATS,
  enemies: ENEMIES,
  weapons: WEAPONS,
  passives: PASSIVES,
  rarities: RARITIES,
  agents: AGENTS,
  drops: DROPS,
  supplements: SUPPLEMENTS,
  structures: STRUCTURES,
  map: MAP,
};

/**
 * Regras com bônus somados à base dos atributos (Laboratório, setores do organismo). As chaves são
 * as de stats.json; os atributos do especial vêm como `special.<chave>`.
 */
export function withStatBonuses(
  rules: RunRules,
  bonuses: Record<string, number>,
  source?: BaseSource,
): RunRules {
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
  if (!source) return { ...rules, stats };
  const baseSources = { ...rules.baseSources };
  const merged = { ...baseSources[source] };
  for (const [key, value] of Object.entries(bonuses)) merged[key] = (merged[key] ?? 0) + value;
  baseSources[source] = merged;
  return { ...rules, stats, baseSources };
}
