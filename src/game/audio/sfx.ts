import * as Phaser from 'phaser';
import { AUDIO, SFX_IDS, type SfxId, type SoundOptions } from '../../config';
import { sfxLevel } from './sfxLogic';

/** Formato que o navegador toca: OGG onde der, M4A no Safari (docs/sonoplastia.md). */
function pickFormat(): 'ogg' | 'm4a' | null {
  const probe = document.createElement('audio');
  if (probe.canPlayType('audio/ogg; codecs="vorbis"')) return 'ogg';
  if (probe.canPlayType('audio/mp4; codecs="mp4a.40.2"')) return 'm4a';
  return null;
}

/**
 * Efeitos sonoros (docs/efeitos-sonoros.md), no mesmo contexto Web Audio da música. Cada toque
 * sorteia um pouco a altura; o mesmo efeito tem limite de cópias e um intervalo mínimo entre
 * toques. Carregam em segundo plano; um efeito pedido antes de carregar fica mudo.
 */
class SfxPlayer {
  private ctx: AudioContext | null = null;
  private out!: GainNode;
  private buffers = new Map<SfxId, AudioBuffer>();
  private playing = new Map<SfxId, number>();
  private lastAt = new Map<SfxId, number>();

  /** Liga os efeitos ao jogo; sem Web Audio, o jogo segue sem efeitos. */
  start(game: Phaser.Game, sound: SoundOptions): void {
    if (this.ctx || !(game.sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
    const format = pickFormat();
    if (!format) return;
    this.ctx = game.sound.context;
    this.out = this.ctx.createGain();
    this.out.gain.value = sfxLevel(sound);
    this.out.connect(game.sound.destination);
    void this.loadAll(format);
  }

  private async loadAll(format: 'ogg' | 'm4a'): Promise<void> {
    for (const id of SFX_IDS) {
      try {
        const url = `${import.meta.env.BASE_URL}audio/sfx/${id}.${format}?v=${AUDIO.sfx.effects[id].rev}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        this.buffers.set(id, await this.ctx!.decodeAudioData(await res.arrayBuffer()));
      } catch (err) {
        console.warn(`Efeito "${id}" não carregou:`, err);
      }
    }
  }

  /** Aplica a aba Som das Opções: volume de Efeitos, Geral e mudo. */
  applySound(sound: SoundOptions): void {
    if (!this.ctx) return;
    this.out.gain.setTargetAtTime(sfxLevel(sound), this.ctx.currentTime, 0.05);
  }

  /** Toca um efeito; `rate` acima de 1 deixa mais agudo, abaixo mais grave. */
  play(id: SfxId, rate = 1): void {
    const buffer = this.buffers.get(id);
    const ctx = this.ctx;
    if (!ctx || !buffer) return;
    const cfg = AUDIO.sfx;
    const now = ctx.currentTime;
    if (now - (this.lastAt.get(id) ?? -Infinity) < cfg.minGapSeconds) return;
    if ((this.playing.get(id) ?? 0) >= cfg.maxVoicesPerId) return;
    this.lastAt.set(id, now);
    this.playing.set(id, (this.playing.get(id) ?? 0) + 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * cfg.pitchJitter);
    const gain = ctx.createGain();
    gain.gain.value = cfg.effects[id].volume;
    source.connect(gain).connect(this.out);
    source.onended = () => this.playing.set(id, (this.playing.get(id) ?? 1) - 1);
    source.start();
  }
}

export const sfx = new SfxPlayer();
