import { MAP_SPRITES } from '../../assets/sprites';
import { MAP, type MapEnvironment } from '../../config';

/** Locais do corpo (fase 5.12) na interface: nome curto e cores do chão de cada um. */

/** Nome curto na lista e na faixa do hub. */
export const LOCAL_SHORT: Record<MapEnvironment, string> = {
  brain: 'CÉREBRO',
  lung: 'PULMÃO',
  liver: 'FÍGADO',
  intestine: 'INTESTINO',
  blood: 'CORRENTE',
};

const hex = (c: string) => Number.parseInt(c.slice(1), 16);

/** Tom `n` (1 a 4) do chão do ambiente, da prancheta Mapas. */
export function floorColor(env: MapEnvironment, n: 1 | 2 | 3 | 4): number {
  return hex(MAP_SPRITES.floor[env]![String(n)]!);
}

/** Nome das famílias do local, para o cartão ("Açúcares e lipídios ×2"). */
export function familyText(env: MapEnvironment): string {
  const def = MAP.environments[env];
  if (def.families.length === 0) return 'A mistura da doença';
  const names: Record<string, string> = {
    sugar: 'açúcares',
    lipid: 'lipídios',
    stress: 'estresse',
    radical: 'radicais livres',
    toxin: 'toxinas',
  };
  const text = def.families.map((f) => names[f] ?? f).join(' e ');
  return `${text[0]!.toUpperCase()}${text.slice(1)} ×${MAP.locals.familyWeight}`;
}
