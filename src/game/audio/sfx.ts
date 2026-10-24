import * as Phaser from 'phaser';
import { AUDIO, type SfxId, type SoundOptions } from '../../config';
import {
  priorityOf,
  risingStep,
  semitoneRate,
  sfxLevel,
  voiceToDrop,
  type SfxCue,
} from './sfxLogic';

/** Formato que o navegador toca: OGG onde der, M4A no Safari (docs/sonoplastia.md). */
function pickFormat(): 'ogg' | 'm4a' | null {
  const probe = document.createElement('audio');
  if (probe.canPlayType('audio/ogg; codecs="vorbis"')) return 'ogg';
  if (probe.canPlayType('audio/mp4; codecs="mp4a.40.2"')) return 'm4a';
  return null;
}

interface Voice {
  id: SfxId;
  source: AudioBufferSourceNode;
  priority: number;
  run: boolean;
}

/** Opções de um toque: além do `SfxCue`, se é um efeito da run (para na pausa). */
export interface PlayOptions extends Omit<SfxCue, 'id'> {
  run?: boolean;
  /** Intervalo mínimo próprio entre dois toques, no lugar do padrão (campo longo). */
  minGap?: number;
}

/**
 * Efeitos sonoros (docs/efeitos-sonoros.md), no mesmo contexto Web Audio da música. Cada toque
 * sorteia um pouco a altura; o mesmo efeito tem limite de cópias e um intervalo mínimo entre
 * toques, e o total tem um teto em que sai o de menor prioridade. Os efeitos fortes (golpe,
 * morte, chefe) baixam os outros por um instante. Carregam em segundo plano; um efeito sem
 * arquivo, ou pedido antes de carregar, fica mudo.
 */
class SfxPlayer {
  private ctx: AudioContext | null = null;
  private out!: GainNode;
  /** Os efeitos comuns passam por aqui, que abaixa no ducking; os que abaixam vão direto. */
  private mix!: GainNode;
  private buffers = new Map<SfxId, AudioBuffer>();
  private voices: Voice[] = [];
  private lastAt = new Map<SfxId, number>();
  private rising = new Map<SfxId, number>();
  private runPaused = false;
  private loopVoice: { id: SfxId; source: AudioBufferSourceNode } | null = null;

  /** Liga os efeitos ao jogo; sem Web Audio, o jogo segue sem efeitos. */
  start(game: Phaser.Game, sound: SoundOptions): void {
    if (this.ctx || !(game.sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
    const format = pickFormat();
    if (!format) return;
    this.ctx = game.sound.context;
    this.out = this.ctx.createGain();
    this.out.gain.value = sfxLevel(sound);
    this.out.connect(game.sound.destination);
    this.mix = this.ctx.createGain();
    this.mix.connect(this.out);
    void this.loadAll(format);
  }

  private async loadAll(format: 'ogg' | 'm4a'): Promise<void> {
    for (const [id, def] of Object.entries(AUDIO.sfx.effects) as [SfxId, { rev: number }][]) {
      try {
        const url = `${import.meta.env.BASE_URL}audio/sfx/${id}.${format}?v=${def.rev}`;
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

  /**
   * Pausa da run, level up e telas de ampola e cápsula: corta os efeitos da run e não deixa
   * tocar outros até voltar. A interface continua soando.
   */
  setRunPaused(paused: boolean): void {
    if (paused === this.runPaused) return;
    this.runPaused = paused;
    if (!paused) return;
    for (const v of this.voices.filter((v) => v.run)) v.source.stop();
    this.loop(null);
  }

  /** Toca um efeito; `rate` acima de 1 deixa mais agudo, abaixo mais grave. */
  play(id: SfxId, opts: PlayOptions = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.buffers.has(id) || (opts.run && this.runPaused)) return;
    const cfg = AUDIO.sfx;
    const now = ctx.currentTime;
    const since = now - (this.lastAt.get(id) ?? -Infinity);
    if (since < (opts.minGap ?? cfg.minGapSeconds)) return;
    let rate = opts.rate ?? 1;
    if (opts.rising) {
      const step = risingStep(this.rising.get(id) ?? -1, since, cfg);
      this.rising.set(id, step);
      rate *= semitoneRate(step);
    }
    const repeat = Math.max(1, opts.repeat ?? 1);
    for (let i = 0; i < repeat; i++) {
      if (!this.voice(id, rate, opts, now + i * cfg.repeatGapSeconds)) break;
    }
    this.lastAt.set(id, now);
  }

  /** Um toque de um efeito pedido pela lógica do jogo. */
  cue(cue: SfxCue, run = true): void {
    this.play(cue.id, { ...cue, run });
  }

  private voice(id: SfxId, rate: number, opts: PlayOptions, at: number): boolean {
    const ctx = this.ctx!;
    const cfg = AUDIO.sfx;
    if (this.voices.filter((v) => v.id === id).length >= cfg.maxVoicesPerId) return false;
    const priority = priorityOf(id, cfg);
    if (this.voices.length >= cfg.maxVoices) {
      const drop = voiceToDrop(
        this.voices.map((v) => v.priority),
        priority,
      );
      if (drop < 0) return false;
      this.voices[drop]!.source.stop();
      this.voices.splice(drop, 1);
    }
    const source = ctx.createBufferSource();
    source.buffer = this.buffers.get(id)!;
    source.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * cfg.pitchJitter);
    const gain = ctx.createGain();
    gain.gain.value = (cfg.effects[id]?.volume ?? 1) * (opts.volume ?? 1);
    const ducks = cfg.duck.ids.includes(id);
    source.connect(gain).connect(ducks ? this.out : this.mix);
    const voice: Voice = { id, source, priority, run: opts.run ?? false };
    this.voices.push(voice);
    source.onended = () => {
      const i = this.voices.indexOf(voice);
      if (i >= 0) this.voices.splice(i, 1);
    };
    source.start(at);
    if (ducks) this.duck(at);
    return true;
  }

  /** Ducking: os outros efeitos caem para `duck.volume` e voltam depois de `duck.seconds`. */
  private duck(at: number): void {
    const { volume, seconds } = AUDIO.sfx.duck;
    const g = this.mix.gain;
    g.cancelScheduledValues(at);
    g.setTargetAtTime(volume, at, 0.01);
    g.setTargetAtTime(1, at + seconds, 0.08);
  }

  /**
   * Um efeito em loop (só `synapseCharge`), com a altura em `rate`; `null` para. Chamar de novo
   * com o mesmo id só muda a altura.
   */
  loop(id: SfxId | null, rate = 1): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.loopVoice && this.loopVoice.id !== id) {
      this.loopVoice.source.stop();
      this.loopVoice = null;
    }
    if (!id || this.runPaused) return;
    if (this.loopVoice) {
      this.loopVoice.source.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.05);
      return;
    }
    const buffer = this.buffers.get(id);
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = AUDIO.sfx.effects[id]?.volume ?? 1;
    source.connect(gain).connect(this.mix);
    source.start();
    this.loopVoice = { id, source };
  }
}

export const sfx = new SfxPlayer();
