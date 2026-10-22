import { META, type AgentId, type MetaConfig } from '../../config';
import {
  buyLab,
  buyUnlock,
  defaultProgress,
  labCost,
  labLevel,
  labState,
  rulesWithProgress,
  addRunStars,
  openChest,
  unlockCost,
  type MetaProgress,
  type UnlockKind,
} from '../meta/progress';
import { DEFAULT_RULES, type RunRules } from '../run/rules';
import { createRun, type RunState } from '../run/state';
import { stepRun } from '../run/step';
import { closeCapsule } from '../run/items';
import { applyChoice, levelUpOffer } from '../run/upgrades';

/**
 * Simulador sem tela (fase 3): um robô joga runs com o código de `src/core/`, e entre elas gasta o
 * ATP no que for mais barato, como um jogador que compra tudo o que pode. Serve para conferir a
 * curva de progressão: quando chega o primeiro desbloqueio e se algum upgrade vira parede de
 * grind (custa mais que 3 runs médias, aba Economia).
 */
const DT = 1 / 60;
const VIEW_RADIUS = 320;

export interface SimOptions {
  runs: number;
  seed: number;
  /** Tempo máximo de uma run, em segundos (o robô às vezes sobrevive demais). */
  maxSeconds: number;
  agent?: AgentId;
  rules?: RunRules;
  meta?: MetaConfig;
}

export interface Purchase {
  kind: 'lab' | UnlockKind;
  id: string;
  cost: number;
}

export interface SimRun {
  index: number;
  timeSeconds: number;
  level: number;
  kills: number;
  atp: number;
  starAtp: number;
  bought: Purchase[];
  /** Próxima compra mais barata depois das compras desta run, e quantas runs médias ela custa. */
  nextCost: number;
  runsForNext: number;
}

export interface SimReport {
  runs: SimRun[];
  /** Run (contando de 1) em que o primeiro agente ou arma foi desbloqueado; 0 se nenhum. */
  firstUnlockRun: number;
  /** Runs em que a próxima compra custava mais que 3 runs médias. */
  grindWalls: number[];
}

/**
 * Direção do robô: se tem inimigo muito perto, foge (somando a repulsão dos vizinhos); se não, vai
 * atrás da gema ou moeda mais próxima, desviando um pouco dos inimigos no caminho.
 */
function botMove(run: RunState): { x: number; y: number } {
  const { agent } = run;
  let fx = 0;
  let fy = 0;
  let nearest = Infinity;
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const dx = agent.x - e.x;
    const dy = agent.y - e.y;
    const d = Math.hypot(dx, dy) - e.radius;
    nearest = Math.min(nearest, d);
    if (d > 90) continue;
    const w = 1 / Math.max(4, d) ** 2;
    fx += dx * w;
    fy += dy * w;
  }
  const flee = Math.hypot(fx, fy);
  if (nearest < 28 && flee > 0) return { x: fx / flee, y: fy / flee };

  let best: { x: number; y: number } | undefined;
  let bestD = Infinity;
  for (const g of [...run.gems, ...run.coins]) {
    const d = (g.x - agent.x) ** 2 + (g.y - agent.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  let x = flee > 0 ? (fx / flee) * 0.6 : 0;
  let y = flee > 0 ? (fy / flee) * 0.6 : 0;
  if (best && bestD > 4) {
    const len = Math.sqrt(bestD);
    x += (best.x - agent.x) / len;
    y += (best.y - agent.y) / len;
  }
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

/** Uma run inteira com o robô: escolhe a primeira opção de cada level up. */
export function botRun(
  rules: RunRules,
  seed: number,
  agent: AgentId,
  maxSeconds: number,
): RunState {
  const run = createRun(seed, rules, agent);
  let t = 0;
  while (!run.over && run.time < maxSeconds) {
    if (run.capsule) closeCapsule(run);
    if (run.pendingLevelUps > 0) {
      const offer = levelUpOffer(run);
      const pick =
        offer.find((c) => c.kind === 'evolve') ??
        offer.find((c) => c.kind === 'weapon') ??
        offer[0];
      if (pick) applyChoice(run, pick);
      continue;
    }
    stepRun(run, { move: botMove(run), viewRadius: VIEW_RADIUS, special: t % 120 === 0 }, DT);
    t++;
  }
  return run;
}

interface Offer {
  kind: Purchase['kind'];
  id: string;
  cost: number;
}

/** Tudo o que dá para comprar agora (sem olhar o ATP), do mais barato ao mais caro. */
function offers(progress: MetaProgress, meta: MetaConfig): Offer[] {
  const out: Offer[] = [];
  for (const [id, node] of Object.entries(meta.lab.nodes)) {
    if (labState(progress, id, meta) === 'available') {
      out.push({ kind: 'lab', id, cost: labCost(node, labLevel(progress, id)) });
    }
  }
  for (const kind of ['agents', 'weapons'] as const) {
    for (const id of Object.keys(meta.unlockCost[kind])) {
      if (!progress[kind].includes(id)) out.push({ kind, id, cost: unlockCost(kind, id, meta) });
    }
  }
  return out.sort((a, b) => a.cost - b.cost);
}

/** Gasta o ATP: desbloqueios primeiro (juntando para eles), depois o mais barato. */
function shop(progress: MetaProgress, atp: number, income: number, meta: MetaConfig) {
  const bought: Purchase[] = [];
  for (;;) {
    // Desbloquear agente ou arma vem antes do Laboratório, como faria um jogador; se o próximo
    // desbloqueio cabe em até 2 runs, guarda o ATP para ele em vez de gastar no Laboratório.
    const all = offers(progress, meta);
    const unlock = all.find((o) => o.kind !== 'lab');
    const saving = unlock !== undefined && unlock.cost > atp && unlock.cost <= atp + income * 2;
    const affordable = all.filter((o) => o.cost <= atp && (o.kind !== 'lab' || !saving));
    const next = affordable.find((o) => o.kind !== 'lab') ?? affordable[0];
    if (!next) break;
    const r =
      next.kind === 'lab'
        ? buyLab(progress, atp, next.id, meta)
        : buyUnlock(progress, atp, next.kind, next.id, meta);
    if (!r) break;
    progress = r.progress;
    atp = r.atp;
    bought.push(next);
  }
  return { progress, atp, bought };
}

export function simulate(options: SimOptions): SimReport {
  const meta = options.meta ?? META;
  const baseRules = options.rules ?? DEFAULT_RULES;
  let progress = defaultProgress(meta);
  let atp = 0;
  const runs: SimRun[] = [];
  let firstUnlockRun = 0;
  for (let i = 0; i < options.runs; i++) {
    const run = botRun(
      rulesWithProgress(baseRules, progress, meta),
      options.seed + i * 7919,
      options.agent ?? 'dopamine',
      options.maxSeconds,
    );
    const stars = addRunStars(progress, run.time, meta);
    const opened = openChest(stars.progress, atp + Math.floor(run.atp));
    const income = Math.floor(run.atp) + stars.reward;
    const spent = shop(opened.progress, opened.atp, income, meta);
    progress = spent.progress;
    atp = spent.atp;
    if (!firstUnlockRun && spent.bought.some((b) => b.kind !== 'lab')) firstUnlockRun = i + 1;

    const recent = [
      ...runs.slice(-2).map((r) => r.atp + r.starAtp),
      Math.floor(run.atp) + stars.reward,
    ];
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const next = offers(progress, meta)[0];
    runs.push({
      index: i + 1,
      timeSeconds: run.time,
      level: run.level,
      kills: run.kills,
      atp: Math.floor(run.atp),
      starAtp: stars.reward,
      bought: spent.bought,
      nextCost: next?.cost ?? 0,
      runsForNext: next && avg > 0 ? Math.max(0, next.cost - atp) / avg : 0,
    });
  }
  return {
    runs,
    firstUnlockRun,
    grindWalls: runs.filter((r) => r.runsForNext > 3).map((r) => r.index),
  };
}
