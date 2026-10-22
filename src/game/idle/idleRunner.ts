import * as Phaser from 'phaser';
import { createField, stepField, type IdleField } from '../../core/idle/field';
import {
  fieldSlots,
  fireRate,
  maxSlots,
  offlineGain,
  type IdleProgress,
  type OfflineGain,
} from '../../core/idle/progress';
import { IDLE } from '../../config';
import type { IdleMods } from '../../core/idle/field';
import {
  applyHealth,
  familyWeights,
  idleHealth,
  idleMultiplier,
  individualDifficulty,
  type OrganismState,
} from '../../core/organism/organism';
import type { SaveData } from '../../core/save/saveData';
import { getSave, setSave } from '../storage/saveStore';

/**
 * Roda o campo longo o tempo todo, em qualquer tela (decisão 0022): o Hub, a run e a própria tela
 * do idle. Com o jogo fechado ou em segundo plano, paga o progresso offline ao voltar. O ATP vai
 * para `idle.pending` e é guardado no save a cada poucos segundos.
 */
const DT = 1 / 30;
/** Passos no máximo por quadro, para não travar depois de uma pausa longa. */
const MAX_STEPS = 12;
const SAVE_EVERY_SECONDS = 5;

let game: Phaser.Game | undefined;
let field: IdleField | undefined;
let accumulator = 0;
let sinceSave = 0;
/** Velocidade da simulação (x2 na tela do idle). */
let speed = 1;
let report: OfflineGain | undefined;
const listeners = new Set<() => void>();

function save(): SaveData {
  return getSave(game!);
}

function writeIdle(idle: IdleProgress, organism?: OrganismState): void {
  const current = save();
  setSave(game!, { ...current, idle, organism: organism ?? current.organism });
}

/** O que o organismo muda no campo: dificuldade do indivíduo, doença e ATP (fase 5). */
function modsFor(organism: OrganismState): IdleMods {
  return {
    hp: individualDifficulty(organism),
    atp: idleMultiplier(organism),
    typeWeights: familyWeights(organism),
  };
}

function buildField(): IdleField {
  const { idle, organism } = save();
  return createField(
    Date.now() >>> 0,
    idle.wave,
    fieldSlots(idle),
    fireRate(idle),
    maxSlots(),
    IDLE,
    modsFor(organism),
  );
}

/** Saúde que os agentes da base dão em `hours` horas (também offline). */
function idleHealthFor(idle: IdleProgress, organism: OrganismState, hours: number): OrganismState {
  const agents = fieldSlots(idle).map((s) => IDLE.agents[s.agent]!);
  return applyHealth(organism, idleHealth(agents, hours));
}

/** Passa o ATP do campo para o pendente e guarda onda e recorde. */
function flush(now = Date.now()): void {
  if (!field || !game) return;
  const { idle, organism } = save();
  const hours = idle.lastSeen > 0 ? Math.max(0, now - idle.lastSeen) / 3_600_000 : 0;
  const next: IdleProgress = {
    ...idle,
    wave: field.wave,
    bestWave: Math.max(idle.bestWave, field.bestWave),
    pending: idle.pending + field.atp,
    lastSeen: now,
  };
  field.atp = 0;
  writeIdle(next, idleHealthFor(idle, organism, hours));
  sinceSave = 0;
  listeners.forEach((l) => l());
}

/** Soma o progresso offline do tempo fora (jogo fechado ou em segundo plano). */
function payOffline(now: number): void {
  const { idle, organism } = save();
  if (idle.lastSeen <= 0) {
    writeIdle({ ...idle, lastSeen: now });
    return;
  }
  const gain = offlineGain(idle, (now - idle.lastSeen) / 1000, now >>> 0, IDLE, modsFor(organism));
  // Offline os agentes da base também cuidam do organismo, até o mesmo teto de horas.
  const health = idleHealthFor(idle, organism, gain.seconds / 3600);
  writeIdle({ ...idle, pending: idle.pending + gain.atp, lastSeen: now }, health);
  if (gain.atp > 0) report = gain;
}

export const idleRunner = {
  /** Liga o idle depois que o save carregou. */
  start(g: Phaser.Game): void {
    game = g;
    payOffline(Date.now());
    field = buildField();
    g.events.on(Phaser.Core.Events.STEP, (_time: number, delta: number) => {
      if (!field) return;
      accumulator += Math.min(delta / 1000, 0.5) * speed;
      let steps = 0;
      while (accumulator >= DT && steps < MAX_STEPS) {
        stepField(field, DT);
        accumulator -= DT;
        steps++;
      }
      if (steps === MAX_STEPS) accumulator = 0;
      sinceSave += delta / 1000;
      if (sinceSave >= SAVE_EVERY_SECONDS) flush();
    });
    // Aba escondida: o laço do Phaser para. Na volta, paga o tempo fora como offline.
    g.events.on(Phaser.Core.Events.HIDDEN, () => flush());
    g.events.on(Phaser.Core.Events.VISIBLE, () => {
      payOffline(Date.now());
      listeners.forEach((l) => l());
    });
    window.addEventListener('pagehide', () => flush());
  },

  get field(): IdleField | undefined {
    return field;
  },

  /** Recria o campo depois de mudar o pool, um nível ou uma melhoria (mantém a onda). */
  rebuild(): void {
    flush();
    if (game) field = buildField();
  },

  /** Guarda já o que o campo produziu (antes de coletar ou gastar). */
  flush,

  setSpeed(value: number): void {
    speed = value;
  },

  /** Relatório "Enquanto você estava fora", lido uma vez pelo Hub. */
  takeReport(): OfflineGain | undefined {
    const r = report;
    report = undefined;
    return r;
  },

  /** Avisa quando o pendente muda (selo do Hub). */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
