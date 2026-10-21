import { describe, expect, it } from 'vitest';
import { IDLE } from '../../config';
import { createField, drainIdleEvents, stepField, waveCount } from './field';
import {
  buyIdleAgent,
  buyLevel,
  buyUpgrade,
  collect,
  defaultIdle,
  fieldSlots,
  offlineGain,
  openSlots,
  placeAgent,
} from './progress';

const DT = 1 / 30;
const run = (seconds: number, f: ReturnType<typeof createField>) => {
  for (let t = 0; t < seconds; t += DT) stepField(f, DT);
};

describe('campo longo', () => {
  it('vence ondas, decompõe moléculas e gera ATP', () => {
    const f = createField(1, 1, [{ agent: 'omega3', level: 5, pos: 0 }], 1, 5);
    run(120, f);
    expect(f.wave).toBeGreaterThan(1);
    expect(f.kills).toBeGreaterThan(0);
    expect(f.atp).toBeGreaterThan(0);
  });

  it('sem agentes, a BASE cai e o campo volta ondas, com a BASE cheia', () => {
    const f = createField(1, 6, [], 1, 5);
    let fellBack = false;
    for (let t = 0; t < 400 && !fellBack; t += DT) {
      stepField(f, DT);
      fellBack = drainIdleEvents(f).some((e) => e.type === 'fallback');
    }
    expect(fellBack).toBe(true);
    expect(f.wave).toBe(6 - IDLE.field.fallbackWaves);
    expect(f.baseHp).toBe(IDLE.field.baseInteractions);
  });

  it('cada onda tem mais moléculas', () => {
    expect(waveCount(5)).toBeGreaterThan(waveCount(1));
  });

  it('é determinístico com a mesma semente', () => {
    const a = createField(9, 3, [{ agent: 'omega3', level: 3, pos: 1 }], 1, 5);
    const b = createField(9, 3, [{ agent: 'omega3', level: 3, pos: 1 }], 1, 5);
    run(60, a);
    run(60, b);
    expect(a.atp).toBe(b.atp);
    expect(a.wave).toBe(b.wave);
  });
});

describe('progresso do idle', () => {
  it('começa com o Ômega-3 na base e 3 espaços abertos', () => {
    const p = defaultIdle();
    expect(fieldSlots(p)).toEqual([{ agent: 'omega3', level: 1, pos: 0 }]);
    expect(openSlots(p)).toBe(IDLE.baseSlots.base);
  });

  it('desbloqueia, põe na base, sobe nível e abre espaço', () => {
    let p = defaultIdle();
    const unlocked = buyIdleAgent(p, 1e6, 'melatonin')!;
    p = placeAgent(unlocked.idle, 1, 'melatonin');
    expect(fieldSlots(p).map((s) => s.agent)).toEqual(['omega3', 'melatonin']);
    p = buyLevel(p, 1e6, 'melatonin')!.idle;
    expect(p.levels.melatonin).toBe(2);
    p = buyUpgrade(p, 1e6, 'baseSlots')!.idle;
    expect(openSlots(p)).toBe(IDLE.baseSlots.base + 1);
  });

  it('não põe agente bloqueado e troca de lugar quem já está na base', () => {
    const p = defaultIdle();
    expect(placeAgent(p, 1, 'vitaminD')).toBe(p);
    expect(placeAgent(p, 2, 'omega3').pool.slice(0, 3)).toEqual([null, null, 'omega3']);
  });

  it('sem ATP não compra; coletar passa o pendente', () => {
    expect(buyLevel(defaultIdle(), 0, 'omega3')).toBeNull();
    const c = collect({ ...defaultIdle(), pending: 12.7 }, 3);
    expect(c.atp).toBe(15);
    expect(c.idle.pending).toBe(0);
  });

  it('offline paga até o teto de horas e nada em pouco tempo', () => {
    const p = { ...defaultIdle(), levels: { omega3: 8 } };
    expect(offlineGain(p, 10, 1).atp).toBe(0);
    const night = offlineGain(p, 8 * 3600, 1);
    const week = offlineGain(p, 7 * 24 * 3600, 1);
    expect(night.atp).toBeGreaterThan(0);
    expect(week.seconds).toBe(IDLE.offlineCapHours.base * 3600);
    expect(week.atp).toBe(night.atp);
  });
});
