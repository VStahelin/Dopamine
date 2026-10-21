/**
 * Ponto único de acesso à configuração (decisão 0004). Os valores ficam nos JSON desta pasta;
 * a anotação de tipo em cada constante faz o build falhar se um JSON sair do formato. Campos
 * com valores fixos (como o tipo da molécula) são conferidos ao carregar, porque o TypeScript
 * lê textos de JSON só como `string`.
 */
import displayJson from './display.json';
import economyJson from './economy.json';
import enemiesJson from './enemies.json';
import idleJson from './idle.json';
import passivesJson from './passives.json';
import runJson from './run.json';
import statsJson from './stats.json';
import weaponsJson from './weapons.json';
import type {
  ContactDamageKind,
  DisplayConfig,
  EconomyConfig,
  EnemyDef,
  IdleConfig,
  MoleculeType,
  PassiveDef,
  PassiveStat,
  RunConfig,
  StatsConfig,
  WeaponDef,
} from './types';

export type * from './types';

export type EnemyKind = keyof typeof enemiesJson;
export type WeaponId = keyof typeof weaponsJson;
export type PassiveId = keyof typeof passivesJson;

const MOLECULE_TYPES: readonly MoleculeType[] = [
  'lipid',
  'sugar',
  'radical',
  'stress',
  'toxin',
  'inflammation',
];
const CONTACT_KINDS: readonly ContactDamageKind[] = ['common', 'strong', 'boss'];
const PASSIVE_STATS: readonly PassiveStat[] = [
  'damage',
  'cooldown',
  'moveSpeed',
  'magnet',
  'maxInteractions',
  'xpGain',
];

function oneOf<T extends string>(value: string, allowed: readonly T[], where: string): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `Configuração inválida em ${where}: "${value}" (aceita: ${allowed.join(', ')})`,
    );
  }
  return value as T;
}

function loadEnemies(): Record<EnemyKind, EnemyDef> {
  const out = {} as Record<EnemyKind, EnemyDef>;
  for (const [id, def] of Object.entries(enemiesJson) as [
    EnemyKind,
    (typeof enemiesJson)[EnemyKind],
  ][]) {
    out[id] = {
      ...def,
      type: oneOf(def.type, MOLECULE_TYPES, `enemies.json ${id}.type`),
      contactDamage: oneOf(def.contactDamage, CONTACT_KINDS, `enemies.json ${id}.contactDamage`),
    };
  }
  return out;
}

function loadPassives(): Record<PassiveId, PassiveDef> {
  const out = {} as Record<PassiveId, PassiveDef>;
  for (const [id, def] of Object.entries(passivesJson) as [
    PassiveId,
    (typeof passivesJson)[PassiveId],
  ][]) {
    out[id] = { ...def, stat: oneOf(def.stat, PASSIVE_STATS, `passives.json ${id}.stat`) };
  }
  return out;
}

export const STATS: StatsConfig = statsJson;
export const RUN: RunConfig = runJson;
export const ECONOMY: EconomyConfig = economyJson;
export const IDLE: IdleConfig = idleJson;
export const DISPLAY: DisplayConfig = displayJson;
export const ENEMIES: Record<EnemyKind, EnemyDef> = loadEnemies();
export const WEAPONS: Record<WeaponId, WeaponDef> = weaponsJson;
export const PASSIVES: Record<PassiveId, PassiveDef> = loadPassives();
