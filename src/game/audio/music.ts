import * as Phaser from 'phaser';
import { AUDIO, MUSIC_TRACKS, type MusicTrackId } from '../../config';

/** Uma faixa tocando, com o volume próprio para os crossfades. */
interface Voice {
  id: MusicTrackId;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/** Formato que o navegador toca: OGG onde der, M4A no Safari (docs/sonoplastia.md). */
function pickFormat(): 'ogg' | 'm4a' | null {
  const probe = document.createElement('audio');
  if (probe.canPlayType('audio/ogg; codecs="vorbis"')) return 'ogg';
  if (probe.canPlayType('audio/mp4; codecs="mp4a.40.2"')) return 'm4a';
  return null;
}

/**
 * Música do jogo (docs/sonoplastia.md), tocada direto no contexto Web Audio do Phaser: assim as
 * faixas em loop tocam a introdução uma vez e repetem só o trecho do loop, e as trocas têm
 * crossfade. O Phaser suspende o contexto com o jogo em segundo plano, e a música para junto.
 * As faixas carregam em segundo plano, na ordem de `audio.json`; pedida antes de carregar, a
 * faixa entra quando chegar.
 */
class MusicPlayer {
  private ctx: AudioContext | null = null;
  private out!: GainNode;
  private mix!: GainNode;
  private filter!: BiquadFilterNode;
  private buffers = new Map<MusicTrackId, AudioBuffer>();
  private main: Voice | null = null;
  private layer: Voice | null = null;
  private wantMain: MusicTrackId | null = null;
  private wantLayer: MusicTrackId | null = null;
  private muffled = false;
  private jingleUntil = 0;

  /** Liga a música ao jogo; sem Web Audio, o jogo segue mudo. */
  start(game: Phaser.Game, volume: number): void {
    if (this.ctx || !(game.sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
    const format = pickFormat();
    if (!format) return;
    const ctx = game.sound.context;
    this.ctx = ctx;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 20000;
    this.mix = ctx.createGain();
    this.out = ctx.createGain();
    this.out.gain.value = volume;
    this.mix.connect(this.filter).connect(this.out).connect(game.sound.destination);
    void this.loadAll(format);
  }

  private async loadAll(format: 'ogg' | 'm4a'): Promise<void> {
    for (const id of Object.keys(AUDIO.tracks) as MusicTrackId[]) {
      if (!MUSIC_TRACKS.includes(id)) continue;
      try {
        const url = `${import.meta.env.BASE_URL}audio/music/${id}.${format}?v=${AUDIO.tracks[id].rev}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        this.buffers.set(id, await this.ctx!.decodeAudioData(await res.arrayBuffer()));
        if (this.wantMain === id && this.main?.id !== id) this.setMain(id);
        if (this.wantLayer === id && this.layer?.id !== id) this.setLayer(id);
      } catch (err) {
        console.warn(`Música "${id}" não carregou:`, err);
      }
    }
  }

  setVolume(volume: number): void {
    if (this.ctx) this.out.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  /** Troca a faixa principal com crossfade; a mesma faixa continua de onde está. */
  setMain(id: MusicTrackId | null, fade = AUDIO.crossfadeSeconds): void {
    this.wantMain = id;
    if (!this.ctx || this.main?.id === id) return;
    if (this.main) this.fadeOut(this.main, fade);
    this.main = id ? this.voice(id, fade) : null;
    this.applyLevels();
  }

  /** Faixa por cima da principal (a crise); a principal baixa enquanto ela toca. */
  setLayer(id: MusicTrackId | null): void {
    this.wantLayer = id;
    if (!this.ctx || this.layer?.id === id) return;
    if (this.layer) this.fadeOut(this.layer, AUDIO.crossfadeSeconds);
    this.layer = id ? this.voice(id, 0.3) : null;
    this.applyLevels();
  }

  /** Abafada: menos volume e sem agudos (pausa, level up, cápsula). */
  setMuffled(muffled: boolean): void {
    if (!this.ctx || this.muffled === muffled) return;
    this.muffled = muffled;
    const t = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(muffled ? AUDIO.muffledLowpassHz : 20000, t, 0.08);
    this.mix.gain.setTargetAtTime(muffled ? AUDIO.muffledVolume : 1, t, 0.08);
  }

  /** Jingle curto em volume cheio, por cima de tudo; a música baixa enquanto ele toca. */
  jingle(id: MusicTrackId): void {
    const buffer = this.buffers.get(id);
    if (!this.ctx || !buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.out);
    source.start();
    this.jingleUntil = this.ctx.currentTime + buffer.duration;
    this.applyLevels();
    source.onended = () => this.applyLevels();
  }

  private voice(id: MusicTrackId, fade: number): Voice | null {
    const buffer = this.buffers.get(id);
    const ctx = this.ctx!;
    if (!buffer) return null;
    const def = AUDIO.tracks[id];
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (def.loop) {
      source.loop = true;
      source.loopStart = def.loopFrom ?? 0;
      source.loopEnd = Math.min(def.loopTo ?? buffer.duration, buffer.duration);
    }
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, ctx.currentTime, Math.max(0.01, fade / 4));
    source.connect(gain).connect(this.mix);
    source.start();
    return { id, source, gain };
  }

  private fadeOut(v: Voice, fade: number): void {
    const t = this.ctx!.currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setTargetAtTime(0, t, Math.max(0.01, fade / 4));
    v.source.stop(t + fade + 0.1);
  }

  /** Volume da principal: baixa com a crise por cima e com um jingle tocando. */
  private applyLevels(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const jingle = t < this.jingleUntil - 0.05;
    const duck = jingle ? AUDIO.jingleDuckVolume : 1;
    if (this.main)
      this.main.gain.gain.setTargetAtTime((this.layer ? AUDIO.crisisRunVolume : 1) * duck, t, 0.2);
    if (this.layer) this.layer.gain.gain.setTargetAtTime(duck, t, 0.2);
  }
}

export const music = new MusicPlayer();
