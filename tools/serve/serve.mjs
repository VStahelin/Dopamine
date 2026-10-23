// Serve a build publicada em HTTPS na rede local, para jogar e testar no celular como jogador
// (docs/atualizacoes.md, decisão 0016). O service worker só funciona em contexto seguro.
//
// - Lê releases/current.json a cada pedido: uma publicação nova vale na hora, sem reiniciar.
// - Arquivo com hash que não está na build atual é procurado nas builds anteriores, para quem
//   ainda está numa versão velha.
// - index.html, sw.js, version.json e o manifest vão sem cache; arquivos com hash, com cache longo.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:https';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';
import selfsigned from 'selfsigned';

const ROOT = process.cwd();
const RELEASES = join(ROOT, 'releases');
const CERTS = join(ROOT, '.certs');
const PORT = Number(process.env.PORT ?? 4443);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const NO_CACHE = new Set([
  '/index.html',
  '/sw.js',
  '/version.json',
  '/manifest.webmanifest',
  '/registerSW.js',
]);

function lanIps() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

async function certificate() {
  const keyFile = join(CERTS, 'key.pem');
  const certFile = join(CERTS, 'cert.pem');
  if (existsSync(keyFile) && existsSync(certFile)) {
    return { key: readFileSync(keyFile), cert: readFileSync(certFile) };
  }
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
    ...lanIps().map((ip) => ({ type: 7, ip })),
  ];
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'Farmaco Battle local' }], {
    keySize: 2048,
    notAfterDate: new Date(Date.now() + 825 * 24 * 3600 * 1000),
    extensions: [{ name: 'subjectAltName', altNames }],
  });
  mkdirSync(CERTS, { recursive: true });
  writeFileSync(keyFile, pems.private);
  writeFileSync(certFile, pems.cert);
  return { key: pems.private, cert: pems.cert };
}

/** Build com o marcador .complete: cópia terminada (tools/release). */
function isComplete(build) {
  return existsSync(join(RELEASES, build, '.complete'));
}

function currentBuild() {
  const pointer = join(RELEASES, 'current.json');
  if (!existsSync(pointer)) return undefined;
  const { buildId } = JSON.parse(readFileSync(pointer, 'utf8'));
  return isComplete(buildId) ? buildId : undefined;
}

function fileIn(build, path) {
  const base = join(RELEASES, build);
  const file = normalize(join(base, path));
  if (!file.startsWith(base + sep)) return undefined;
  return existsSync(file) && statSync(file).isFile() ? file : undefined;
}

const { key, cert } = await certificate();
const server = createServer({ key, cert }, (req, res) => {
  const build = currentBuild();
  if (!build) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Nenhuma build publicada. Rode npm run release.');
    return;
  }
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path === '/') path = '/index.html';

  let file = fileIn(build, path);
  // Arquivo com hash de uma build anterior (quem ainda não atualizou).
  if (!file && path.startsWith('/assets/')) {
    for (const other of readdirSync(RELEASES)) {
      if (other === build || other.endsWith('.json') || !isComplete(other)) continue;
      file = fileIn(other, path);
      if (file) break;
    }
  }
  // Navegação para uma rota sem arquivo: entrega o jogo.
  if (!file && !extname(path)) {
    path = '/index.html';
    file = fileIn(build, path);
  }
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  const cache =
    NO_CACHE.has(path) || !path.startsWith('/assets/')
      ? 'no-cache'
      : 'public, max-age=31536000, immutable';
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': cache,
  });
  res.end(readFileSync(file));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Farmaco Battle servindo a build ${currentBuild() ?? '(nenhuma)'}:`);
  console.log(`  https://localhost:${PORT}/`);
  for (const ip of lanIps()) console.log(`  https://${ip}:${PORT}/`);
  console.log(
    'Na primeira vez, o navegador avisa que o certificado é local: aceite para continuar.',
  );
});
