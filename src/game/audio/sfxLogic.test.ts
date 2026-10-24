import { describe, expect, it } from 'vitest';
import { AUDIO } from '../../config';
import {
  buttonSound,
  eventSounds,
  hurtSound,
  lowHealthTick,
  priorityOf,
  revealCue,
  risingStep,
  semitoneRate,
  sfxLevel,
  specialSound,
  synapseChargeLevel,
  voiceToDrop,
} from './sfxLogic';

const cfg = { heavyHurtRatio: 0.1, lowHealthRatio: 0.25, lowHealthRepeatSeconds: 4 };
const sound = {
  muted: false,
  masterVolume: 0.5,
  musicVolume: 1,
  sfxVolume: 0.8,
  muffleOnPause: true,
  playInBackground: false,
};

describe('sfxLevel', () => {
  it('multiplica Geral e Efeitos e zera no mudo', () => {
    expect(sfxLevel(sound)).toBeCloseTo(0.4);
    expect(sfxLevel({ ...sound, muted: true })).toBe(0);
  });
});

describe('hurtSound', () => {
  it('escolhe bloqueio, golpe pesado ou o comum', () => {
    expect(hurtSound(1, 3, 100, cfg)).toBe('shieldBlock');
    expect(hurtSound(12, 2, 100, cfg)).toBe('hurtHeavy');
    expect(hurtSound(5, 0, 100, cfg)).toBe('hurt');
  });
});

describe('lowHealthTick', () => {
  it('toca ao cair abaixo do limite e repete no intervalo', () => {
    let t = lowHealthTick(0.2, 0, 0.1, cfg);
    expect(t.play).toBe(true);
    t = lowHealthTick(0.2, t.timer, 1, cfg);
    expect(t.play).toBe(false);
    t = lowHealthTick(0.2, t.timer, 3.1, cfg);
    expect(t.play).toBe(true);
  });
  it('fica quieto com a vida acima do limite ou zerada', () => {
    expect(lowHealthTick(0.5, 0, 0.1, cfg).play).toBe(false);
    expect(lowHealthTick(0, 0, 0.1, cfg).play).toBe(false);
  });
});

describe('eventSounds', () => {
  const ctx = { agentId: 'dopamine', inView: (x: number) => x >= 0 };
  const play = (ev: Parameters<typeof eventSounds>[0]) => eventSounds(ev, ctx, AUDIO.sfx);

  it('a evolução reaproveita o disparo da arma base, mais grave e repetido', () => {
    expect(play({ type: 'shoot', weapon: 'radical' })).toEqual([
      { id: 'radicalFire', rate: undefined, repeat: undefined },
    ]);
    expect(play({ type: 'shoot', weapon: 'fenton' })).toEqual([
      { id: 'radicalFire', rate: AUDIO.sfx.lowerRate, repeat: 3 },
    ]);
  });

  it('chefe e agregado soam ao nascer e ao cair; molécula comum decomposta fica muda', () => {
    const kill = { type: 'kill' as const, x: 0, y: 0, kind: 'ldl' as const };
    expect(play({ ...kill, boss: true, aggregate: false, absorbed: false })[0]!.id).toBe('bigBoom');
    expect(play({ ...kill, boss: false, aggregate: true, absorbed: false })[0]!.rate).toBe(
      AUDIO.sfx.higherRate,
    );
    expect(play({ ...kill, boss: false, aggregate: false, absorbed: false })).toEqual([]);
    expect(play({ ...kill, boss: false, aggregate: false, absorbed: true })[0]!.id).toBe('absorb');
    expect(play({ type: 'boss', kind: 'ldl' })[0]!.id).toBe('bossSpawn');
  });

  it('o que acontece fora da tela não soa', () => {
    expect(play({ type: 'vesicle', x: -5, y: 0 })).toEqual([]);
    expect(play({ type: 'vesicle', x: 5, y: 0 })[0]!.id).toBe('vesicleBreak');
    expect(play({ type: 'strike', x: -5, y: 0, radius: 4 })).toEqual([]);
    expect(play({ type: 'strike', x: 5, y: 0, radius: 4 })[0]!.id).toBe('explosion');
    expect(play({ type: 'strike', x: 5, y: 0, radius: 4, weapon: 'lipaseStrike' })).toEqual([]);
  });

  it('gema sobe de tom; itens de ATP repetem a moeda', () => {
    expect(play({ type: 'collect', what: 'gem' })).toEqual([{ id: 'gem', rising: true }]);
    expect(play({ type: 'item', kind: 'glucose', x: 0, y: 0 })[0]).toEqual({
      id: 'atp',
      repeat: 3,
    });
    expect(play({ type: 'item', kind: 'dryIce', x: 0, y: 0 })[0]!.id).toBe('freeze');
    expect(play({ type: 'item', kind: 'bunsen', x: 0, y: 0 })[0]!.id).toBe('itemPickup');
  });

  it('o especial toca o som do agente', () => {
    expect(play({ type: 'special', kind: 'frenzy' })[0]!.id).toBe('specialDopamine');
    expect(specialSound('alcoholDehydrogenase')).toBe('specialAlcoholDehydrogenase');
    expect(specialSound('nada')).toBeUndefined();
  });
});

describe('mixagem', () => {
  it('a sequência sobe um semitom por toque e volta depois de uma pausa', () => {
    expect(risingStep(-1, Infinity, AUDIO.sfx)).toBe(0);
    expect(risingStep(0, 0.1, AUDIO.sfx)).toBe(1);
    expect(risingStep(12, 0.1, AUDIO.sfx)).toBe(12);
    expect(risingStep(5, 1, AUDIO.sfx)).toBe(0);
    expect(semitoneRate(12)).toBeCloseTo(2);
  });

  it('no teto de vozes sai a de menor prioridade, se for menor que a nova', () => {
    expect(priorityOf('hurt', AUDIO.sfx)).toBe(0);
    expect(priorityOf('radicalFire', AUDIO.sfx)).toBeGreaterThan(priorityOf('gem', AUDIO.sfx));
    expect(voiceToDrop([5, 1, 3], 2)).toBe(0);
    expect(voiceToDrop([1, 1], 2)).toBe(-1);
  });

  it('revelação: raras mais agudas, ultra raro em diante é a lendária', () => {
    expect(revealCue(0)).toEqual({ id: 'reveal', rate: 1 });
    expect(revealCue(2).rate).toBeCloseTo(1.2);
    expect(revealCue(4).id).toBe('revealLegendary');
  });

  it('o rótulo do botão escolhe voltar, confirmar ou o toque comum', () => {
    expect(buttonSound('VOLTAR')).toBe('uiBack');
    expect(buttonSound('JOGAR')).toBe('uiConfirm');
    expect(buttonSound('IR')).toBe('uiConfirm');
    expect(buttonSound('IMPORTAR')).toBe('uiTap');
  });

  it('a sinapse só carrega com o agente dentro', () => {
    expect(synapseChargeLevel([{ kind: 'synapse', inside: false, progress: 0.4 }])).toBeNull();
    expect(synapseChargeLevel([{ kind: 'synapseLTP', inside: true, progress: 0.4 }])).toBe(0.4);
    expect(synapseChargeLevel([{ kind: 'focus', inside: true, progress: 0 }])).toBeNull();
  });
});
