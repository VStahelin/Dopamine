// Fim de jogo (playtest rodada 2): o robô joga com o Laboratório no máximo e tudo liberado, e a
// tabela mostra, minuto a minuto, a vida, as interações perdidas e as moléculas no campo.
//
// Uso: node tools/sim/late.mjs [--seeds 3] [--max 1800] [--still] [--agents dopamine,lipase]
import { createServer } from 'vite';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { simulateLate } = await server.ssrLoadModule('/src/core/sim/simulate.ts');
  const started = Date.now();
  const still = args.includes('--still');
  const runs = simulateLate({
    agents: option('agents', 'dopamine,lipase,insulin,vitaminC,caffeine').split(','),
    seeds: Number(option('seeds', 3)),
    seed: Number(option('seed', 1)),
    maxSeconds: Number(option('max', 1800)),
    still,
  });
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  console.log(still ? 'Robô parado, Laboratório no máximo' : 'Robô, Laboratório no máximo');
  for (const r of runs) {
    const marks = r.minutes
      .filter((m) => m.minute % 5 === 0)
      .map(
        (m) => `${m.minute}m ${Math.round(m.health * 100)}% -${Math.round(m.lost)} ${m.enemies}e`,
      )
      .join(' | ');
    const boss = r.bossSeconds.length
      ? ` | chefe ${Math.round(r.bossSeconds.reduce((a, b) => a + b, 0) / r.bossSeconds.length)} s`
      : '';
    console.log(
      `${r.agent.padEnd(10)} ${fmt(r.timeSeconds)}${r.died ? ' morreu' : '       '}  ${marks}${boss}`,
    );
  }
  const died = runs.filter((r) => r.died).map((r) => r.timeSeconds / 60);
  const median = died.sort((a, b) => a - b)[Math.floor(died.length / 2)];
  console.log(
    `\nMorreram ${died.length} de ${runs.length}` +
      (died.length ? `; mediana da morte ${median.toFixed(1)} min` : ''),
  );
  console.log(`(${((Date.now() - started) / 1000).toFixed(1)} s)`);
} finally {
  await server.close();
}
