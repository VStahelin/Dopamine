import {
  PASSIVES,
  RARITIES,
  WEAPONS,
  type AgentDef,
  type PassiveDef,
  type PassiveId,
  type RunStatKey,
  type WeaponId,
  type WeaponParams,
} from '../../config';
import type { RunState } from '../../core/run/state';
import { statDef, type RunStats } from '../../core/run/stats';
import { coinValue, statsAfter, type UpgradeChoice } from '../../core/run/upgrades';
import { levelStep, weaponMaxLevel } from '../../core/run/weaponParams';
import { statValue } from './statText';

const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;
const num = (v: number) => Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const plural = (v: number, one: string, many: string) => (Math.abs(v) === 1 ? one : many);

/** Texto do efeito de cada atributo, a partir de quanto o receptor soma. */
const STAT_TEXT: Record<RunStatKey, (v: number) => string> = {
  damage: (v) => `+${pct(v)} de dano`,
  projectiles: (v) => `+${num(v)} ${plural(v, 'projétil', 'projéteis')} por disparo`,
  cooldown: (v) => `−${pct(v)} de recarga`,
  area: (v) => `+${pct(v)} de área dos disparos`,
  duration: (v) => `+${pct(v)} de duração`,
  projectileSpeed: (v) => `+${pct(v)} de velocidade dos disparos`,
  range: (v) => `+${pct(v)} de alcance`,
  pierce: (v) => `Disparos atravessam +${num(v)} ${plural(v, 'inimigo', 'inimigos')}`,
  ricochet: (v) => `Disparos saltam para +${num(v)} ${plural(v, 'inimigo', 'inimigos')}`,
  critChance: (v) => `+${pct(v)} de chance de crítico`,
  critDamage: (v) => `+${pct(v)} de dano crítico`,
  knockback: (v) => `+${pct(v)} de empurrão`,
  eliteDamage: (v) => `+${pct(v)} de dano em inimigos fortes`,
  effectChance: (v) => `+${pct(v)} de chance de efeito`,
  maxInteractions: (v) => `+${num(v)} interações máximas`,
  armor: (v) => `−${num(v)} de dano em cada golpe recebido`,
  dodge: (v) => `+${pct(v)} de chance de esquivar`,
  regenPerSecond: (v) => `Recupera +${num(v)} interações por segundo`,
  lifesteal: (v) => `+${pct(v)} de chance de recuperar 1 interação ao decompor`,
  invulnerabilitySeconds: (v) => `+${num(v)} s de invulnerabilidade após um golpe`,
  revives: (v) => `Volta ${num(v)} ${plural(v, 'vez', 'vezes')} com metade das interações`,
  thorns: (v) => `Devolve ${pct(v)} do dano a quem encostar`,
  moveSpeed: (v) => `+${pct(v)} de velocidade`,
  magnet: (v) => `+${pct(v)} de raio de coleta`,
  xpGain: (v) => `+${pct(v)} de XP`,
  currencyGain: (v) => `+${pct(v)} de ATP`,
  luck: (v) => `+${pct(v)} de sorte: raridades melhores`,
  choices: (v) => `+${num(v)} ${plural(v, 'opção', 'opções')} em cada level up`,
  rerolls: (v) => `+${num(v)} ${plural(v, 'uso', 'usos')} de Rerrolar`,
  skips: (v) => `+${num(v)} ${plural(v, 'uso', 'usos')} de Pular`,
  banishes: (v) => `+${num(v)} ${plural(v, 'uso', 'usos')} de Banir`,
  weaponSlots: (v) => `+${num(v)} ${plural(v, 'espaço', 'espaços')} de arma`,
  modifierSlots: (v) =>
    `+${num(v)} ${plural(v, 'espaço', 'espaços')} de receptor (não ocupa espaço)`,
  curse: (v) => `+${pct(v)} de estresse: inimigos mais fortes, mais XP`,
};

/** O que um receptor soma com `amount`, em texto; a Cinética fala dos dois atributos. */
export function receptorGain(def: PassiveDef, amount: number): string {
  if (def.mutation) return 'Soma um atributo sorteado, com a raridade da carta';
  const main = STAT_TEXT[def.stat](amount);
  return def.alsoStat ? `${main} e ${STAT_TEXT[def.alsoStat](amount)}` : main;
}

/** O que o receptor nativo de um agente soma por nível (fase 5.6), em texto. */
export function nativeGain(native: AgentDef['nativeReceptor'], typeName = ''): string {
  if (native.stat) return STAT_TEXT[native.stat](native.perLevel);
  return `+${pct(native.perLevel)} de dano contra ${typeName}`;
}

/** O que cada nível de arma soma, em texto. */
const PARAM_TEXT: Record<keyof WeaponParams, (v: number) => string> = {
  damage: (v) => `+${num(v)} de dano`,
  cooldownSeconds: (v) => `−${num(v)} s de recarga`,
  count: (v) => `+${num(v)} por ativação`,
  areaPx: (v) => `+${num(v)} de área`,
  rangePx: (v) => `+${num(v)} de alcance`,
  speedPxPerSecond: (v) => `+${num(v)} de velocidade`,
  pierce: (v) => `atravessa +${num(v)} inimigo`,
  ricochet: (v) => `salta para +${num(v)} ${plural(v, 'inimigo', 'inimigos')}`,
  durationSeconds: (v) => `+${num(v)} s de duração`,
};

function weaponLevelText(level: Partial<WeaponParams>): string {
  return (Object.keys(level) as (keyof WeaponParams)[])
    .filter((k) => level[k])
    .map((k) => PARAM_TEXT[k](level[k]!))
    .join(', ');
}

export interface ChoiceText {
  title: string;
  level: string;
  description: string;
  /** Raridade (nome e cor); a arma e a cura não têm. */
  rarity?: { name: string; color: string };
}

/** Título, nível, descrição e raridade de uma opção de level up. */
export function describeChoice(choice: UpgradeChoice): ChoiceText {
  switch (choice.kind) {
    case 'weapon': {
      const w = WEAPONS[choice.id];
      if (choice.level === 1)
        return { title: w.name, level: 'NOVA ARMA', description: w.description };
      // O nível de arma tem raridade, que multiplica o ganho dele (decisão 0027).
      const tier = RARITIES.tiers[choice.rarity ?? 0]!;
      return {
        title: w.name,
        level: `NV ${choice.level}`,
        description: weaponLevelText(levelStep(w, choice.level - 2, tier.multiplier)),
        rarity: { name: tier.name, color: tier.color },
      };
    }
    case 'evolve': {
      const into = WEAPONS[choice.into];
      const top = RARITIES.tiers[RARITIES.tiers.length - 1]!;
      return {
        title: into.name,
        level: 'EVOLUÇÃO',
        description: `${WEAPONS[choice.id].name} evolui: ${into.description}`,
        rarity: { name: top.name, color: top.color },
      };
    }
    case 'passive': {
      const p = PASSIVES[choice.id];
      const tier = RARITIES.tiers[choice.rarity]!;
      return {
        title: p.name,
        level: choice.level === 1 ? 'NOVO' : `NV ${choice.level}`,
        description: receptorGain(p, choice.amount),
        rarity: { name: tier.name, color: tier.color },
      };
    }
    case 'heal':
      return {
        title: 'Nova dose',
        level: '',
        description: `Recupera ${num(choice.amount)} interações`,
      };
    case 'boost': {
      // Da sinapse (com raridade) ou da Superdosagem (comum, sem raridade).
      const tier = choice.rarity === undefined ? undefined : RARITIES.tiers[choice.rarity];
      return {
        title: tier ? PASSIVES[choice.id].name : 'Superdosagem',
        level: tier ? '' : PASSIVES[choice.id].name.toUpperCase(),
        description: receptorGain(PASSIVES[choice.id], choice.amount),
        rarity: tier ? { name: tier.name, color: tier.color } : undefined,
      };
    }
    case 'phosphocreatine':
      return {
        title: 'Fosfocreatina',
        level: '',
        description: `ATP igual a ${num(choice.coins)} moedas`,
      };
  }
}

/** Prévia de uma opção: o número que muda e a dica de evolução (prancheta "Crônico: level up"). */
export interface ChoicePreview {
  /** "Reatividade 130% → 150%", "Raio UV NV 4 → NV 5", "Armas 4 → 5/6". */
  line?: string;
  /** "MAX + COENZIMA → ENZIMA": a escolha leva a uma evolução. */
  evo?: string;
  /** Atributos depois da escolha, para a coluna de atributos do PC. */
  after?: RunStats;
}

/** O que muda na run com a opção, sem mexer nela. */
export function choicePreview(run: RunState, choice: UpgradeChoice): ChoicePreview {
  const after = statsAfter(run, choice) ?? undefined;
  switch (choice.kind) {
    case 'weapon': {
      const def = WEAPONS[choice.id];
      if (choice.level === 1) {
        const open = Math.floor(run.stats.weaponSlots);
        return { line: `Armas ${run.weapons.length} → ${run.weapons.length + 1}/${open}` };
      }
      const max = weaponMaxLevel(def);
      const to = choice.level >= max ? 'MAX' : `NV ${choice.level}`;
      const evo =
        choice.level >= max && def.evolution
          ? `MAX + ${PASSIVES[def.evolution.reagent as PassiveId].name} → ${WEAPONS[def.evolution.into as WeaponId].name}`
          : undefined;
      return {
        line: `${def.name} NV ${choice.level - 1} → ${to}`,
        evo: evo?.toUpperCase(),
      };
    }
    case 'evolve':
      return { line: `${WEAPONS[choice.id].name} → ${WEAPONS[choice.into].name}` };
    case 'passive':
    case 'boost': {
      const def = PASSIVES[choice.id];
      // Reagente de uma arma que o agente tem: avisa a evolução que ele destrava.
      const weapon = run.weapons.find((w) => WEAPONS[w.id].evolution?.reagent === choice.id);
      const into = weapon && WEAPONS[weapon.id].evolution?.into;
      const evo =
        choice.kind === 'passive' && weapon && into
          ? `${WEAPONS[weapon.id].name} MAX + ${def.name} → ${WEAPONS[into as WeaponId].name}`.toUpperCase()
          : undefined;
      if (!after) return { evo };
      const name = statDef(run.rules, def.stat).name;
      return {
        line: `${name} ${statShown(run, def.stat, run.stats)} → ${statShown(run, def.stat, after)}`,
        evo,
        after,
      };
    }
    case 'heal': {
      const max = Math.round(run.stats.maxInteractions);
      const now = Math.ceil(run.agent.interactions);
      return {
        line: `Interações ${now}/${max} → ${Math.min(max, now + Math.round(choice.amount))}/${max}`,
      };
    }
    case 'phosphocreatine': {
      const gain = choice.coins * coinValue(run) * run.stats.currencyGain;
      return { line: `ATP ${Math.floor(run.atp)} → ${Math.floor(run.atp + gain)}` };
    }
  }
}

/** Valor de um atributo como a pausa mostra; Interações vem com o estoque atual. */
export function statShown(run: RunState, key: RunStatKey, stats: RunStats): string {
  if (key === 'maxInteractions') {
    return `${Math.ceil(run.agent.interactions)}/${Math.round(stats.maxInteractions)}`;
  }
  return statValue(key, stats[key]);
}
