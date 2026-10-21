import { PALETTE_CSS } from '../render/palette';
import { FONT_LABEL, FONT_MAIN } from './theme';

/** Tipos de número na tela (docs/ui-cronico.md, "Números de dano e feedback"). */
export type NumberKind =
  'damage' | 'crit' | 'strong' | 'weak' | 'area' | 'hurt' | 'heal' | 'immune' | 'info';

export interface NumberStyle {
  /** Tamanho em unidades do mundo. */
  size: number;
  color: string;
  outline: string;
  font: string;
}

const main = (size: number, color: string, outline: string = PALETTE_CSS.ink): NumberStyle => ({
  size,
  color,
  outline,
  font: FONT_MAIN,
});

/**
 * Cores e tamanhos da prancheta "Crônico: ícones, dano e paisagem", em 60% do tamanho do
 * mockup para não cobrir o campo cheio de moléculas.
 */
export const NUMBER_STYLES: Record<NumberKind, NumberStyle> = {
  damage: main(11, PALETTE_CSS.white),
  crit: main(17, PALETTE_CSS.goldIcon, PALETTE_CSS.critOutline),
  strong: main(12, PALETTE_CSS.numberStrong, PALETTE_CSS.cyanOutline),
  weak: main(8, PALETTE_CSS.numberWeak),
  area: main(8, PALETTE_CSS.white),
  hurt: main(13, PALETTE_CSS.numberHurt, PALETTE_CSS.outline),
  heal: main(10, PALETTE_CSS.numberHeal, PALETTE_CSS.numberHealOutline),
  immune: { size: 7, color: PALETTE_CSS.textSoft, outline: PALETTE_CSS.ink, font: FONT_LABEL },
  info: main(10, PALETTE_CSS.cyan, PALETTE_CSS.cyanOutline),
};

/** Tipo do número de um golpe: crítico, afinidade forte ou fraca, imune ou dano comum. */
export function hitKind(hit: { crit: boolean; affinity: number }): NumberKind {
  if (hit.affinity <= 0) return 'immune';
  if (hit.crit) return 'crit';
  if (hit.affinity > 1) return 'strong';
  if (hit.affinity < 1) return 'weak';
  return 'damage';
}

/** Texto do número: crítico com "!", imune por extenso. */
export function hitLabel(kind: NumberKind, amount: number): string {
  if (kind === 'immune') return 'IMUNE';
  const n = Math.max(1, Math.round(amount));
  return kind === 'crit' ? `${n}!` : String(n);
}
