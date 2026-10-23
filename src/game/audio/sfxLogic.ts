import type { SfxConfig, SfxId, SoundOptions } from '../../config';

/** Volume final dos efeitos: zero no mudo; o Geral multiplica o dos Efeitos. */
export function sfxLevel(sound: SoundOptions): number {
  return sound.muted ? 0 : sound.masterVolume * sound.sfxVolume;
}

/**
 * Som de um golpe no agente: a Membrana que segurou ao menos metade do golpe soa como bloqueio,
 * um golpe grande soa pesado, o resto é o `hurt` comum.
 */
export function hurtSound(
  amount: number,
  blocked: number,
  maxInteractions: number,
  cfg: Pick<SfxConfig, 'heavyHurtRatio'>,
): SfxId {
  if (blocked > 0 && blocked >= amount) return 'shieldBlock';
  if (amount >= maxInteractions * cfg.heavyHurtRatio) return 'hurtHeavy';
  return 'hurt';
}

/**
 * Aviso de interações baixas: toca ao cair abaixo do limite e repete a cada
 * `lowHealthRepeatSeconds` enquanto continuar baixo. Devolve se toca agora e o novo timer.
 */
export function lowHealthTick(
  ratio: number,
  timer: number,
  dt: number,
  cfg: Pick<SfxConfig, 'lowHealthRatio' | 'lowHealthRepeatSeconds'>,
): { play: boolean; timer: number } {
  if (ratio <= 0 || ratio >= cfg.lowHealthRatio) return { play: false, timer: 0 };
  const next = timer - dt;
  if (next > 0) return { play: false, timer: next };
  return { play: true, timer: cfg.lowHealthRepeatSeconds };
}
