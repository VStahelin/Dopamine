// Simulador sem tela (fase 3): roda o robô de src/core/sim/simulate.ts por várias runs seguidas,
// gastando o ATP entre elas, e mostra a curva de progressão da meta.
//
// Uso: npm run sim [-- --runs 15] [-- --seed 1] [-- --max 900]
// Caso inteiro (fase 5.12): npm run sim -- --case [--individuals 2] [--cap 80], que compara
// quantas runs cada indivíduo leva até a ALTA jogando na Corrente sanguínea e no local indicado.
import { createServer } from 'vite';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback;
};
const runs = option('runs', 15);
const seed = option('seed', 1);
const maxSeconds = option('max', 900);

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});
try {
  if (args.includes('--case')) {
    const { simulateCase } = await server.ssrLoadModule('/src/core/sim/simulate.ts');
    const individuals = option('individuals', 2);
    const cap = option('cap', 80);
    for (const strategy of ['blood', 'local']) {
      const started = Date.now();
      const rows = simulateCase({
        seed,
        maxSeconds,
        strategy,
        individuals,
        maxRunsPerIndividual: cap,
      });
      console.log(strategy === 'blood' ? '\nSempre na Corrente sanguínea' : '\nNo local indicado');
      for (const r of rows) {
        const locals = Object.entries(r.locals)
          .map(([k, v]) => `${k} ${v}`)
          .join(', ');
        console.log(
          `  indivíduo ${r.individual} (${r.illness}): ${r.discharged ? '' : 'sem ALTA em '}${r.runs} runs · ${locals}`,
        );
      }
      console.log(`  (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    }
    process.exit(0);
  }
  const { simulate } = await server.ssrLoadModule('/src/core/sim/simulate.ts');
  const started = Date.now();
  const report = simulate({ runs, seed, maxSeconds });
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  console.log('run | tempo | nível | decompostas | ATP (+estrelas) | compras | próxima (runs)');
  for (const r of report.runs) {
    const bought = r.bought.map((b) => (b.kind === 'lab' ? b.id : `${b.id}*`)).join(', ') || '—';
    console.log(
      `${String(r.index).padStart(3)} | ${fmt(r.timeSeconds).padStart(5)} | ${String(r.level).padStart(5)} | ` +
        `${String(r.kills).padStart(11)} | ${String(r.atp).padStart(4)} (+${r.starAtp}) | ${bought} | ` +
        `${r.nextCost} (${r.runsForNext.toFixed(1)})`,
    );
  }
  const avg = report.runs.reduce((a, r) => a + r.atp + r.starAtp, 0) / report.runs.length;
  console.log(`\nATP médio por run: ${avg.toFixed(0)}`);
  console.log(
    `Primeiro desbloqueio (agente ou arma, marcado com *): run ${report.firstUnlockRun || 'nenhuma'}`,
  );
  console.log(
    report.grindWalls.length
      ? `Parede de grind (próxima compra > 3 runs médias) depois das runs: ${report.grindWalls.join(', ')}`
      : 'Sem parede de grind: a próxima compra nunca passa de 3 runs médias.',
  );
  console.log(`(${runs} runs em ${((Date.now() - started) / 1000).toFixed(1)} s)`);

  // Campo longo: quanto uma noite (8 h) com o jogo fechado rende, no começo e com o pool montado.
  const idle = await server.ssrLoadModule('/src/core/idle/progress.ts');
  const start = idle.defaultIdle(1);
  const built = {
    ...start,
    wave: 12,
    pool: ['omega3', 'melatonin', 'magnesium', null, null],
    agents: ['omega3', 'melatonin', 'magnesium'],
    levels: { omega3: 10, melatonin: 8, magnesium: 6 },
  };
  for (const [label, p] of [
    ['idle do começo (Ômega-3 nv 1)', start],
    ['idle montado (3 agentes)', built],
  ]) {
    const night = idle.offlineGain(p, 8 * 3600, seed);
    console.log(
      `Noite de 8 h, ${label}: ${night.atp} ATP (${Math.round(night.ratePerHour)} por hora)`,
    );
  }
} finally {
  await server.close();
}
