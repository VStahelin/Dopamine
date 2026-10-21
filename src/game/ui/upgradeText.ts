import { PASSIVES, RARITIES, WEAPONS, type RunStatKey, type WeaponLevel } from '../../config';
import type { UpgradeChoice } from '../../core/run/upgrades';

const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;
const num = (v: number) => Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const plural = (v: number, one: string, many: string) => (Math.abs(v) === 1 ? one : many);

/** Texto do efeito de cada atributo, a partir de quanto o modificador soma. */
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
    `+${num(v)} ${plural(v, 'espaço', 'espaços')} de modificador (não ocupa espaço)`,
  curse: (v) => `+${pct(v)} de estresse: inimigos mais fortes, mais XP`,
};

function weaponLevelText(level: WeaponLevel): string {
  const parts: string[] = [];
  if (level.damage) parts.push(`+${num(level.damage)} de dano`);
  if (level.projectiles) parts.push(`+${num(level.projectiles)} projétil`);
  if (level.cooldownSeconds) parts.push(`−${num(level.cooldownSeconds)} s de recarga`);
  if (level.pierce) parts.push(`atravessa +${num(level.pierce)} inimigo`);
  return parts.join(', ');
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
      const w = WEAPONS.radical;
      return {
        title: w.name,
        level: `NV ${choice.level}`,
        description: weaponLevelText(w.levels[choice.level - 2] ?? {}),
      };
    }
    case 'passive': {
      const p = PASSIVES[choice.id];
      const tier = RARITIES.tiers[choice.rarity]!;
      return {
        title: p.name,
        level: choice.level === 1 ? 'NOVO' : `NV ${choice.level}`,
        description: STAT_TEXT[p.stat](choice.amount),
        rarity: { name: tier.name, color: tier.color },
      };
    }
    case 'heal':
      return {
        title: 'Nova dose',
        level: '',
        description: `Recupera ${num(choice.amount)} interações`,
      };
  }
}
