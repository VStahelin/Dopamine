// Robô parado (balanceamento): quanto a run dura sem mexer o agente, com cada agente.
//
// Uso: node tools/sim/still.mjs
import { createServer } from 'vite';
const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});
const { createRun } = await server.ssrLoadModule('/src/core/run/state.ts');
const { stepRun } = await server.ssrLoadModule('/src/core/run/step.ts');
const { DEFAULT_RULES } = await server.ssrLoadModule('/src/core/run/rules.ts');
const up = await server.ssrLoadModule('/src/core/run/upgrades.ts');
const { closeCapsule } = await server.ssrLoadModule('/src/core/run/items.ts');
const { closeAmpoule } = await server.ssrLoadModule('/src/core/run/supplements.ts');
const st = await server.ssrLoadModule('/src/core/run/structures.ts');
const DT = 1 / 30;
for (const agent of ['dopamine', 'lipase', 'insulin']) {
  const rows = [];
  for (let seed = 1; seed <= 6; seed++) {
    const run = createRun(seed, DEFAULT_RULES, agent);
    const marks = {};
    let firstHit = null;
    while (!run.over && run.time < 900) {
      if (run.capsule) closeCapsule(run);
      if (run.ampoule) closeAmpoule(run);
      if (run.synapseOffer) st.chooseSynapse(run, run.synapseOffer[0]);
      if (run.pendingLevelUps > 0) {
        const o = up.levelUpOffer(run);
        const pick =
          o.find((c) => c.kind === 'evolve') ?? o.find((c) => c.kind === 'weapon') ?? o[0];
        if (pick) up.applyChoice(run, pick);
        else run.pendingLevelUps = 0;
        continue;
      }
      const before = run.agent.interactions;
      stepRun(run, { move: { x: 0, y: 0 }, viewRadius: 300, special: false }, DT);
      if (firstHit === null && run.agent.interactions < before) firstHit = run.time;
      for (const m of [60, 180, 300])
        if (!marks[m] && run.time >= m)
          marks[m] = `${run.kills}k/${Math.ceil(run.agent.interactions)}hp`;
    }
    rows.push(
      `${Math.round(run.time)}s nv${run.level} hit@${firstHit?.toFixed(0)} 1m:${marks[60] ?? '-'} 3m:${marks[180] ?? '-'} 5m:${marks[300] ?? '-'}`,
    );
  }
  console.log(agent);
  for (const r of rows) console.log('  ' + r);
}
await server.close();
