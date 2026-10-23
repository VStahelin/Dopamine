import type { AudioConfig, MusicTrackId, SoundOptions } from '../../config';

/** O que a run diz para a música a cada quadro (docs/sonoplastia.md, "Música dinâmica"). */
export interface RunMusicInput {
  /** Tempo de run, em segundos. */
  time: number;
  /** Crise da doença (pico de onda) em andamento. */
  crisis: boolean;
  /** Algum chefe vivo no campo. */
  bossAlive: boolean;
  /** Pausa, level up, cápsula ou ampola abertos. */
  overlay: boolean;
  /** A run acabou. */
  over: boolean;
}

export interface MusicTarget {
  /** Faixa principal; `null` para o silêncio. */
  main: MusicTrackId | null;
  /** Faixa que toca por cima da principal (a crise). */
  layer: MusicTrackId | null;
  /** Música abafada: menos volume e sem agudos. */
  muffled: boolean;
}

/** Faixa da run pelo tempo: run1 no começo, run2 e run3 nos minutos de `runTrackMinutes`. */
export function runTrack(
  timeSeconds: number,
  cfg: Pick<AudioConfig, 'runTrackMinutes'>,
): MusicTrackId {
  const minutes = timeSeconds / 60;
  if (minutes >= cfg.runTrackMinutes.run3) return 'run3';
  if (minutes >= cfg.runTrackMinutes.run2) return 'run2';
  return 'run1';
}

/**
 * Música da run: o chefe vivo troca a faixa e ganha da crise; a crise toca por cima da faixa da
 * run; no fim da run, silêncio até a tela de fim de run.
 */
export function runMusic(
  input: RunMusicInput,
  cfg: Pick<AudioConfig, 'runTrackMinutes'>,
): MusicTarget {
  if (input.over) return { main: null, layer: null, muffled: false };
  if (input.bossAlive) return { main: 'boss', layer: null, muffled: input.overlay };
  return {
    main: runTrack(input.time, cfg),
    layer: input.crisis ? 'crisis' : null,
    muffled: input.overlay,
  };
}

/** Volume final da música: zero no mudo; o Geral multiplica o da Música. */
export function musicLevel(sound: SoundOptions): number {
  return sound.muted ? 0 : sound.masterVolume * sound.musicVolume;
}

/** Volume em passos de 10% (os 10 pips das Opções), de 0 a 1. */
export function stepVolume(volume: number, steps: number): number {
  return Math.min(10, Math.max(0, Math.round(volume * 10) + steps)) / 10;
}
