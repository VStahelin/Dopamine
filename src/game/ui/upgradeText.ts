import { PASSIVES, WEAPONS, type PassiveStat, type WeaponLevel } from '../../config';
import type { UpgradeChoice } from '../../core/run/upgrades';

const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;
const num = (v: number) => v.toLocaleString('pt-BR');

const PASSIVE_TEXT: Record<PassiveStat, (v: number) => string> = {
  damage: (v) => `+${pct(v)} de dano`,
  cooldown: (v) => `−${pct(v)} de recarga`,
  moveSpeed: (v) => `+${pct(v)} de velocidade`,
  magnet: (v) => `+${pct(v)} de raio de coleta`,
  maxInteractions: (v) => `+${num(v)} interações máximas`,
  xpGain: (v) => `+${pct(v)} de XP`,
};

function weaponLevelText(level: WeaponLevel): string {
  const parts: string[] = [];
  if (level.damage) parts.push(`+${num(level.damage)} de dano`);
  if (level.projectiles) parts.push(`+${num(level.projectiles)} projétil`);
  if (level.cooldownSeconds) parts.push(`−${num(Math.abs(level.cooldownSeconds))} s de recarga`);
  if (level.pierce) parts.push(`atravessa +${num(level.pierce)} inimigo`);
  return parts.join(', ');
}

/** Título, nível e descrição de uma opção de level up. */
export function describeChoice(choice: UpgradeChoice): {
  title: string;
  level: string;
  description: string;
} {
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
      return {
        title: p.name,
        level: choice.level === 1 ? 'NOVO' : `NV ${choice.level}`,
        description: PASSIVE_TEXT[p.stat](p.perLevel),
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
