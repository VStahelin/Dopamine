// Publica uma build nova de forma atômica (docs/atualizacoes.md, decisão 0016).
//
// 1. Roda o check completo (lint, formatação, testes e build). Se falhar, nada é publicado.
// 2. Copia o dist/ inteiro para releases/<buildId> e, só no fim, grava o marcador .complete.
//    O servidor ignora builds sem o marcador: uma cópia pela metade nunca é servida.
// 3. Troca o ponteiro releases/current.json (grava num arquivo temporário e renomeia).
// 4. Mantém a build atual e as 3 anteriores; apaga as mais velhas.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

/**
 * No Windows, renomear logo depois de copiar pode falhar (EPERM) enquanto o antivírus ou o
 * indexador lê os arquivos novos: tenta de novo algumas vezes antes de desistir.
 */
function renameWithRetry(from, to, attempts = 20) {
  for (let i = 1; ; i++) {
    try {
      renameSync(from, to);
      return;
    } catch (err) {
      if (i >= attempts || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

const ROOT = process.cwd();
const RELEASES = join(ROOT, 'releases');
const KEEP_PREVIOUS = 3;

const check = spawnSync('npm', ['run', 'check'], { stdio: 'inherit', shell: true });
if (check.status !== 0) {
  console.error('\nO check falhou: nada foi publicado.');
  process.exit(1);
}

const version = JSON.parse(readFileSync(join(ROOT, 'dist', 'version.json'), 'utf8'));
const { buildId } = version;
mkdirSync(RELEASES, { recursive: true });
const target = join(RELEASES, buildId);
if (existsSync(target)) {
  console.error(`A build ${buildId} já foi publicada.`);
  process.exit(1);
}

cpSync(join(ROOT, 'dist'), target, { recursive: true });
writeFileSync(join(target, '.complete'), new Date().toISOString());

const pointer = join(RELEASES, 'current.json');
const pointerTmp = `${pointer}.tmp`;
writeFileSync(
  pointerTmp,
  JSON.stringify(
    { buildId, version: version.version, publishedAt: new Date().toISOString() },
    null,
    2,
  ),
);
renameWithRetry(pointerTmp, pointer);

const builds = readdirSync(RELEASES)
  .filter(
    (name) =>
      !name.startsWith('.') && statSync(join(RELEASES, name)).isDirectory() && name !== buildId,
  )
  .sort((a, b) => statSync(join(RELEASES, b)).mtimeMs - statSync(join(RELEASES, a)).mtimeMs);
for (const old of builds.slice(KEEP_PREVIOUS))
  rmSync(join(RELEASES, old), { recursive: true, force: true });

console.log(`\nPublicada a build ${buildId} (v${version.version}).`);
console.log(`Builds guardadas: ${[buildId, ...builds.slice(0, KEEP_PREVIOUS)].join(', ')}`);
