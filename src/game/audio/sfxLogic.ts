import { SFX_IDS, type SfxConfig, type SfxId, type SoundOptions } from '../../config';
import type { RunEvent } from '../../core/run/state';

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

/** Um toque pedido pelo jogo: o efeito, a velocidade e se entra na sequência que sobe. */
export interface SfxCue {
  id: SfxId;
  rate?: number;
  volume?: number;
  rising?: boolean;
  repeat?: number;
}

/** Efeito do especial de cada agente: `special` + o id do agente com a primeira maiúscula. */
export function specialSound(agentId: string): SfxId | undefined {
  const id = `special${agentId.charAt(0).toUpperCase()}${agentId.slice(1)}`;
  return (SFX_IDS as readonly string[]).includes(id) ? (id as SfxId) : undefined;
}

type ItemKind = Extract<RunEvent, { type: 'item' }>['kind'];

/** Coleta de um item: o ATP em moedas repete o `atp`, os de efeito grande têm som próprio. */
function itemSound(kind: ItemKind): SfxCue | undefined {
  switch (kind) {
    case 'atp':
    case 'glucose':
    case 'glycogen':
      return { id: 'atp', repeat: 3 };
    case 'dryIce':
      return { id: 'freeze' };
    case 'osmosis':
      return { id: 'whoosh' };
    case 'serum':
    case 'lysosome':
      // O Soro toca `heal` pela cura; o Lisossomo, `bigBoom` pelo próprio evento.
      return undefined;
    default:
      return { id: 'itemPickup' };
  }
}

/**
 * Efeitos de um acontecimento da run (docs/efeitos-sonoros.md). Os do agente (`hurt`, `heal`,
 * `dodge`...) ficam com a cena, que já decide entre eles. `inView` diz se um ponto está na tela:
 * o que acontece fora dela não soa.
 */
export function eventSounds(
  ev: RunEvent,
  ctx: { agentId: string; inView: (x: number, y: number) => boolean },
  cfg: Pick<SfxConfig, 'weapons' | 'lowerRate' | 'higherRate'>,
): SfxCue[] {
  switch (ev.type) {
    case 'shoot': {
      const w = cfg.weapons[ev.weapon];
      return w ? [{ id: w.sound, rate: w.rate, repeat: w.repeat }] : [];
    }
    case 'damage':
      return ev.crit && ctx.inView(ev.x, ev.y) ? [{ id: 'crit' }] : [];
    case 'kill':
      if (ev.boss) return [{ id: 'bigBoom' }];
      if (ev.aggregate) return [{ id: 'bigBoom', rate: cfg.higherRate }];
      return ev.absorbed && ctx.inView(ev.x, ev.y) ? [{ id: 'absorb', rising: true }] : [];
    case 'strike':
      // Golpe sem arma é explosão: Termita e o Peróxido estourando.
      return ev.weapon === undefined && ctx.inView(ev.x, ev.y) ? [{ id: 'explosion' }] : [];
    case 'spark':
      return ctx.inView(ev.x1, ev.y1) ? [{ id: 'zap', rate: cfg.higherRate }] : [];
    case 'special': {
      const id = specialSound(ctx.agentId);
      return id ? [{ id }] : [];
    }
    case 'boss':
      return [{ id: 'bossSpawn' }];
    case 'aggregate':
      return [{ id: 'bossSpawn', rate: cfg.higherRate, volume: 0.6 }];
    case 'lysosome':
      return [{ id: 'bigBoom' }];
    case 'collect':
      return ev.what === 'gem' ? [{ id: 'gem', rising: true }] : [{ id: 'atp' }];
    case 'item': {
      const cue = itemSound(ev.kind);
      return cue ? [cue] : [];
    }
    case 'vesicle':
    case 'destructible':
      return ctx.inView(ev.x, ev.y) ? [{ id: 'vesicleBreak' }] : [];
    case 'structure':
      if (ev.kind === 'synapse') return [{ id: 'synapseFire' }];
      if (ev.kind === 'synapseLTP') return [{ id: 'revealLegendary' }];
      if (ev.kind === 'adrenal') return [{ id: 'atp', repeat: 3 }];
      return [{ id: 'alarm' }];
    case 'challenge':
      return ev.won ? [{ id: 'synapseFire' }] : [];
    case 'formationWarning':
      return [{ id: 'alarm', volume: ev.crisis ? 1 : 0.6 }];
    default:
      return [];
  }
}

/**
 * Sequência que sobe: um semitom a mais a cada toque seguido, até `maxSteps`, e volta ao começo
 * depois de `resetSeconds` sem toque. Devolve o novo degrau.
 */
export function risingStep(
  step: number,
  sinceLast: number,
  cfg: Pick<SfxConfig, 'risingMaxSteps' | 'risingResetSeconds'>,
): number {
  return sinceLast > cfg.risingResetSeconds ? 0 : Math.min(cfg.risingMaxSteps, step + 1);
}

/** Velocidade de um degrau da sequência: 12 degraus sobem uma oitava. */
export function semitoneRate(step: number): number {
  return 2 ** (step / 12);
}

/** Prioridade de um efeito: 0 é a maior; quem não está em nenhum grupo fica por último. */
export function priorityOf(id: SfxId, cfg: Pick<SfxConfig, 'priority'>): number {
  const i = cfg.priority.findIndex((group) => group.includes(id));
  return i < 0 ? cfg.priority.length : i;
}

/**
 * Qual voz sai para um efeito novo entrar, com o total no limite: a de menor prioridade, se for
 * menor que a do novo. Devolve o índice, ou -1 quando o novo não entra.
 */
export function voiceToDrop(playing: readonly number[], priority: number): number {
  let worst = -1;
  for (let i = 0; i < playing.length; i++) {
    if (playing[i]! > priority && (worst < 0 || playing[i]! > playing[worst]!)) worst = i;
  }
  return worst;
}

const BACK_LABELS = ['VOLTAR', 'FECHAR', 'CANCELAR', 'DEPOIS', 'PULAR', 'SAIR'];
const CONFIRM_LABELS = ['JOGAR', 'COMEÇAR', 'CONTINUAR', 'CONFIRMAR', 'IR', 'ATUALIZAR', 'OK'];

/** Toque de interface de um botão, pelo rótulo: voltar, confirmar ou o toque comum. */
export function buttonSound(label: string): SfxId {
  const word = label.trim().toUpperCase();
  if (BACK_LABELS.some((l) => word.startsWith(l))) return 'uiBack';
  if (CONFIRM_LABELS.some((l) => word === l || word.startsWith(`${l} `))) return 'uiConfirm';
  return 'uiTap';
}

/** Carga da sinapse onde o agente está, de 0 a 1, para o loop `synapseCharge`; fora, `null`. */
export function synapseChargeLevel(
  structures: readonly { kind: string; inside: boolean; progress: number }[],
): number | null {
  for (const st of structures) {
    if ((st.kind === 'synapse' || st.kind === 'synapseLTP') && st.inside) return st.progress;
  }
  return null;
}

/**
 * Revelação pela raridade (índice em `rarities.json`): Comum, Incomum e Raro tocam `reveal`, mais
 * agudo quanto mais raro; Ultra raro, Lendário e Especial tocam `revealLegendary`.
 */
export function revealCue(tierIndex: number): SfxCue {
  return tierIndex >= 3 ? { id: 'revealLegendary' } : { id: 'reveal', rate: 1 + 0.1 * tierIndex };
}
