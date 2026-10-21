/**
 * Ponto único de acesso à configuração (decisão 0004). Os valores ficam nos JSON desta pasta;
 * a anotação de tipo em cada constante faz o build falhar se um JSON sair do formato. Campos
 * com valores fixos (como o tipo da molécula) e referências entre arquivos (a arma de um agente,
 * o reagente de uma evolução) são conferidos ao carregar: um erro aparece na hora em que o jogo
 * abre e nos testes.
 */
import agentsJson from './agents.json';
import displayJson from './display.json';
import economyJson from './economy.json';
import enemiesJson from './enemies.json';
import idleJson from './idle.json';
import metaJson from './meta.json';
import passivesJson from './passives.json';
import raritiesJson from './rarities.json';
import runJson from './run.json';
import statsJson from './stats.json';
import weaponsJson from './weapons.json';
import {
  RUN_STAT_KEYS,
  type AffinityLevel,
  type AgentDef,
  type ContactDamageKind,
  type DisplayConfig,
  type EconomyConfig,
  type EnemyDef,
  type IdleConfig,
  type MetaConfig,
  type MoleculeType,
  type PassiveDef,
  type RarityConfig,
  type RunConfig,
  type SpecialKind,
  type StatsConfig,
  type WeaponDef,
  type WeaponKind,
  type WeaponParams,
  type WeaponSource,
} from './types';

export type * from './types';
export { RUN_STAT_KEYS } from './types';

export type EnemyKind = keyof typeof enemiesJson;
export type WeaponId = keyof typeof weaponsJson;
export type PassiveId = keyof typeof passivesJson;
export type AgentId = keyof typeof agentsJson;

const MOLECULE_TYPES: readonly MoleculeType[] = [
  'lipid',
  'sugar',
  'radical',
  'stress',
  'toxin',
  'inflammation',
];
const CONTACT_KINDS: readonly ContactDamageKind[] = ['common', 'strong', 'boss'];
const WEAPON_KINDS: readonly WeaponKind[] = [
  'projectile',
  'cone',
  'orbit',
  'aura',
  'zone',
  'beam',
  'pulse',
  'strike',
];
const WEAPON_SOURCES: readonly WeaponSource[] = ['pool', 'agent', 'evolution'];
const SPECIAL_KINDS: readonly SpecialKind[] = ['frenzy', 'emulsion', 'uptake'];
const AFFINITY_LEVELS: readonly AffinityLevel[] = ['strong', 'neutral', 'weak'];
const PARAM_KEYS: readonly (keyof WeaponParams)[] = [
  'damage',
  'cooldownSeconds',
  'count',
  'areaPx',
  'rangePx',
  'speedPxPerSecond',
  'pierce',
  'ricochet',
  'durationSeconds',
];

function oneOf<T extends string>(value: string, allowed: readonly T[], where: string): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `Configuração inválida em ${where}: "${value}" (aceita: ${allowed.join(', ')})`,
    );
  }
  return value as T;
}

function exists(value: string, keys: object, where: string): void {
  if (!(value in keys)) throw new Error(`Configuração inválida em ${where}: "${value}" não existe`);
}

function loadEnemies(): Record<EnemyKind, EnemyDef> {
  type Raw = Omit<EnemyDef, 'type' | 'contactDamage'> & { type: string; contactDamage: string };
  const out = {} as Record<EnemyKind, EnemyDef>;
  for (const [id, def] of Object.entries(enemiesJson as Record<string, Raw>)) {
    for (const f of def.fragments ?? [])
      exists(f.kind, enemiesJson, `enemies.json ${id}.fragments`);
    out[id as EnemyKind] = {
      ...def,
      type: oneOf(def.type, MOLECULE_TYPES, `enemies.json ${id}.type`),
      contactDamage: oneOf(def.contactDamage, CONTACT_KINDS, `enemies.json ${id}.contactDamage`),
    };
  }
  return out;
}

function loadPassives(): Record<PassiveId, PassiveDef> {
  const out = {} as Record<PassiveId, PassiveDef>;
  for (const [id, def] of Object.entries(passivesJson as Record<string, PassiveDef>)) {
    out[id as PassiveId] = {
      ...def,
      stat: oneOf(def.stat, RUN_STAT_KEYS, `passives.json ${id}.stat`),
    };
  }
  return out;
}

function loadWeapons(): Record<WeaponId, WeaponDef> {
  type Raw = Omit<WeaponDef, 'kind' | 'source' | 'pullType'> & {
    kind: string;
    source: string;
    pullType?: string;
  };
  const out = {} as Record<WeaponId, WeaponDef>;
  for (const [id, def] of Object.entries(weaponsJson as unknown as Record<string, Raw>)) {
    const where = `weapons.json ${id}`;
    for (const key of PARAM_KEYS) {
      if (typeof def.base[key] !== 'number')
        throw new Error(`Configuração inválida em ${where}.base.${key}`);
    }
    if (def.evolution) {
      exists(def.evolution.into, weaponsJson, `${where}.evolution.into`);
      exists(def.evolution.reagent, passivesJson, `${where}.evolution.reagent`);
    }
    out[id as WeaponId] = {
      ...def,
      kind: oneOf(def.kind, WEAPON_KINDS, `${where}.kind`),
      source: oneOf(def.source, WEAPON_SOURCES, `${where}.source`),
      pullType: def.pullType ? oneOf(def.pullType, MOLECULE_TYPES, `${where}.pullType`) : undefined,
    };
  }
  return out;
}

function loadAgents(): Record<AgentId, AgentDef> {
  type Raw = Omit<AgentDef, 'special' | 'affinity'> & {
    special: Omit<AgentDef['special'], 'kind' | 'type'> & { kind: string; type?: string };
    affinity: Record<string, string>;
  };
  const out = {} as Record<AgentId, AgentDef>;
  for (const [id, def] of Object.entries(agentsJson as unknown as Record<string, Raw>)) {
    const where = `agents.json ${id}`;
    exists(def.action, weaponsJson, `${where}.action`);
    const affinity: AgentDef['affinity'] = {};
    for (const [type, level] of Object.entries(def.affinity)) {
      affinity[oneOf(type, MOLECULE_TYPES, `${where}.affinity`)] = oneOf(
        level,
        AFFINITY_LEVELS,
        `${where}.affinity.${type}`,
      );
    }
    out[id as AgentId] = {
      ...def,
      affinity,
      special: {
        ...def.special,
        kind: oneOf(def.special.kind, SPECIAL_KINDS, `${where}.special.kind`),
        type: def.special.type
          ? oneOf(def.special.type, MOLECULE_TYPES, `${where}.special.type`)
          : undefined,
      },
    };
  }
  return out;
}

export const STATS: StatsConfig = statsJson;
export const RUN: RunConfig = runJson;
export const ECONOMY: EconomyConfig = economyJson;
export const IDLE: IdleConfig = idleJson;
export const DISPLAY: DisplayConfig = displayJson;
export const ENEMIES: Record<EnemyKind, EnemyDef> = loadEnemies();
export const WEAPONS: Record<WeaponId, WeaponDef> = loadWeapons();
export const PASSIVES: Record<PassiveId, PassiveDef> = loadPassives();
export const AGENTS: Record<AgentId, AgentDef> = loadAgents();
export const RARITIES: RarityConfig = raritiesJson;
if (RARITIES.tiers.length === 0) {
  throw new Error('Configuração inválida: rarities.json sem raridades');
}
for (const b of RUN.bosses) exists(b.kind, enemiesJson, 'run.json bosses');
for (const [id, def] of Object.entries(AGENTS)) {
  if (WEAPONS[def.action as WeaponId].source !== 'agent') {
    throw new Error(`Configuração inválida em agents.json ${id}.action: a arma não é de agente`);
  }
}

/** Confere meta.json: ids que existem, atributos do Laboratório e os tetos permanentes. */
function loadMeta(): MetaConfig {
  const meta: MetaConfig = metaJson;
  for (const id of meta.start.agents) exists(id, agentsJson, 'meta.json start.agents');
  for (const id of meta.start.weapons) exists(id, weaponsJson, 'meta.json start.weapons');
  for (const id of Object.keys(meta.unlockCost.agents))
    exists(id, agentsJson, 'meta.json unlockCost.agents');
  for (const id of Object.keys(meta.unlockCost.weapons))
    exists(id, weaponsJson, 'meta.json unlockCost.weapons');
  for (const id of Object.keys(AGENTS)) {
    if (!meta.start.agents.includes(id) && !(id in meta.unlockCost.agents)) {
      throw new Error(`Configuração inválida em meta.json: agente "${id}" sem início nem custo`);
    }
  }
  for (const [id, w] of Object.entries(WEAPONS)) {
    if (w.source !== 'pool') continue;
    if (!meta.start.weapons.includes(id) && !(id in meta.unlockCost.weapons)) {
      throw new Error(`Configuração inválida em meta.json: arma "${id}" sem início nem custo`);
    }
  }
  if (meta.starRewards.length !== ECONOMY.meta.caseStarMinutes.length) {
    throw new Error('Configuração inválida em meta.json starRewards: uma recompensa por estrela');
  }
  let power = 0;
  for (const [id, node] of Object.entries(meta.lab.nodes)) {
    const where = `meta.json lab.nodes.${id}`;
    for (const r of node.requires) exists(r, meta.lab.nodes, `${where}.requires`);
    const [group, key] = node.stat.startsWith('special.')
      ? ['special', node.stat.slice('special.'.length)]
      : [
          (Object.keys(STATS) as (keyof StatsConfig)[]).find(
            (g) => g !== 'special' && node.stat in STATS[g],
          ),
          node.stat,
        ];
    const stat = group ? STATS[group as keyof StatsConfig][key] : undefined;
    if (!stat) throw new Error(`Configuração inválida em ${where}.stat: "${node.stat}" não existe`);
    const total = node.perLevel * node.maxLevel;
    if (
      Math.abs(total) > Math.abs(stat.metaCap) + 1e-9 ||
      Math.sign(total) !== Math.sign(stat.metaCap)
    ) {
      throw new Error(
        `Configuração inválida em ${where}: soma ${total} passa do metaCap ${stat.metaCap}`,
      );
    }
    // Teto de poder permanente: dano e interações somados, em fração da base.
    if (node.stat === 'damage') power += total / stat.base;
    if (node.stat === 'maxInteractions') power += total / stat.base;
  }
  if (power > ECONOMY.meta.permanentPowerCap + 1e-9) {
    throw new Error(`Configuração inválida em meta.json: poder permanente ${power} passa do teto`);
  }
  return meta;
}

export const META: MetaConfig = loadMeta();
