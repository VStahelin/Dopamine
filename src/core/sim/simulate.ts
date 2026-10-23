import {
  AGENTS,
  META,
  SECTORS,
  type AgentId,
  type MapEnvironment,
  type MetaConfig,
} from '../../config';
import {
  canEnter,
  indicatedLocal,
  localHealth,
  localsUnlocked,
  rulesWithLocal,
} from '../organism/local';
import {
  applyHealth,
  canDischarge,
  defaultOrganism,
  discharge,
  earn,
  illnessName,
  rulesWithOrganism,
  type OrganismState,
} from '../organism/organism';
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
import { chooseSynapse } from '../run/structures';
import { closeAmpoule } from '../run/supplements';
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

/** Até onde o robô sai do caminho para buscar uma sinapse ou uma Glândula adrenal. */
const STRUCTURE_REACH = 600;

/**
 * Sinapse ou Glândula adrenal mais perto, as estruturas que o robô busca (fase 5.13). Foco
 * inflamatório e Coágulo ficam de fora: são o risco que um jogador casual evita.
 */
function nearestStructure(run: RunState): { x: number; y: number; inside: boolean } | undefined {
  const { agent } = run;
  let best: { x: number; y: number; inside: boolean } | undefined;
  let bestD = STRUCTURE_REACH;
  for (const s of run.structures) {
    if (s.kind !== 'synapse' && s.kind !== 'synapseLTP' && s.kind !== 'adrenal') continue;
    const d = Math.hypot(s.x - agent.x, s.y - agent.y);
    if (d >= bestD) continue;
    bestD = d;
    // Na sinapse, ficar perto do meio até encher; na glândula, entrar de novo a cada toque.
    const hold = s.kind === 'adrenal' ? 0 : run.rules.structures.radiusPx * 0.4;
    best = { x: s.x, y: s.y, inside: d < hold };
  }
  return best;
}

/**
 * Direção do robô: se tem inimigo muito perto, foge (somando a repulsão dos vizinhos); se não, vai
 * até a sinapse ou glândula mais perto e fica nela; sem estrutura por perto, vai atrás da gema ou
 * moeda mais próxima, desviando um pouco dos inimigos no caminho.
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

  let x = flee > 0 ? (fx / flee) * 0.6 : 0;
  let y = flee > 0 ? (fy / flee) * 0.6 : 0;
  const structure = nearestStructure(run);
  if (structure) {
    if (!structure.inside) {
      const len = Math.hypot(structure.x - agent.x, structure.y - agent.y);
      x += (structure.x - agent.x) / len;
      y += (structure.y - agent.y) / len;
    }
    const sl = Math.hypot(x, y);
    return sl > 0 ? { x: x / sl, y: y / sl } : { x: 0, y: 0 };
  }

  let best: { x: number; y: number } | undefined;
  let bestD = Infinity;
  // Gemas, ATP e itens; a ampola e a cápsula precisam ser tocadas, então o robô vai até elas.
  for (const g of [...run.gems, ...run.coins, ...run.pickups]) {
    const d = (g.x - agent.x) ** 2 + (g.y - agent.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
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
    if (run.ampoule) closeAmpoule(run);
    if (run.synapseOffer) chooseSynapse(run, run.synapseOffer[0]!);
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
  for (const kind of ['agents', 'weapons', 'receptors'] as const) {
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

// --- Organismo e locais (fase 5.12) ---

/** Como o robô escolhe onde agir: sempre na Corrente sanguínea ou no local que cura mais. */
export type LocalStrategy = 'blood' | 'local';

export interface CaseOptions {
  seed: number;
  maxSeconds: number;
  strategy: LocalStrategy;
  /** Teto de runs por indivíduo, para o robô não rodar para sempre num caso travado. */
  maxRunsPerIndividual: number;
  /** Quantas ALTAs seguidas medir. */
  individuals: number;
}

export interface CaseIndividual {
  individual: number;
  illness: string;
  /** Runs até a ALTA (ou o teto, se não chegou). */
  runs: number;
  discharged: boolean;
  /** Locais usados nas runs deste indivíduo, com quantas vezes. */
  locals: Record<string, number>;
}

/**
 * Agente e local da próxima run: o agente liberado que mais sobe o setor mais baixo e, na
 * estratégia 'local', o local de sinergia dele (se for desse setor) ou o INDICADO.
 */
function pickCase(
  progress: MetaProgress,
  organism: OrganismState,
  strategy: LocalStrategy,
): { agent: AgentId; env: MapEnvironment } {
  const lowest = [...SECTORS].sort((a, b) => organism.sectors[a] - organism.sectors[b])[0]!;
  const agents = progress.agents.filter((id): id is AgentId => id in AGENTS);
  const agent =
    [...agents].sort(
      (a, b) => (AGENTS[b].health?.[lowest] ?? 0) - (AGENTS[a].health?.[lowest] ?? 0),
    )[0] ?? 'dopamine';
  if (strategy === 'blood' || !localsUnlocked(progress.stars, organism)) {
    return { agent, env: 'blood' };
  }
  const def = AGENTS[agent];
  if (def.synergy?.sector === lowest) return { agent, env: def.synergy.env };
  const indicated = indicatedLocal(organism);
  return { agent, env: indicated && canEnter(def, indicated) ? indicated : 'blood' };
}

/**
 * Caso inteiro: o robô joga runs com o organismo, aplica a saúde do local no fim de cada uma e
 * passa pela ALTA. Mede quantas runs cada indivíduo leva (sem o campo longo, que também cura).
 */
export function simulateCase(options: CaseOptions): CaseIndividual[] {
  let save = { progress: defaultProgress(), atp: 0, organism: defaultOrganism() };
  const out: CaseIndividual[] = [];
  let seed = options.seed;
  for (let k = 0; k < options.individuals; k++) {
    const row: CaseIndividual = {
      individual: save.organism.individual,
      illness: illnessName(save.organism.individual),
      runs: 0,
      discharged: false,
      locals: {},
    };
    while (row.runs < options.maxRunsPerIndividual) {
      const { agent, env } = pickCase(save.progress, save.organism, options.strategy);
      const rules = rulesWithLocal(
        rulesWithOrganism(rulesWithProgress(DEFAULT_RULES, save.progress), save.organism),
        { env, random: false },
        AGENTS[agent],
      );
      const run = botRun(rules, (seed += 7919), agent, options.maxSeconds);
      row.runs++;
      row.locals[env] = (row.locals[env] ?? 0) + 1;
      const stars = addRunStars(save.progress, run.time);
      const opened = openChest(stars.progress, save.atp + Math.floor(run.atp));
      const income = Math.floor(run.atp) + stars.reward;
      const spent = shop(opened.progress, opened.atp, income, META);
      const health = localHealth(AGENTS[agent], run.time / 60, env);
      save = {
        progress: spent.progress,
        atp: spent.atp,
        organism: earn(applyHealth(save.organism, health.total), income),
      };
      if (canDischarge(save.organism)) {
        row.discharged = true;
        break;
      }
    }
    out.push(row);
    if (!row.discharged) break;
    // ALTA: zera Laboratório, estrelas e ATP; mantém agentes e armas (discharge.ts).
    const fresh = defaultProgress();
    save = {
      progress: { ...fresh, agents: save.progress.agents, weapons: save.progress.weapons },
      atp: 0,
      organism: discharge(save.organism),
    };
  }
  return out;
}
