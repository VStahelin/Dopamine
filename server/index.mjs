// Servidor de produção do jogo no Render (decisão 0017): serve a build de dist/ na porta $PORT.
// O Render cuida do HTTPS. Cache segue docs/atualizacoes.md: index.html, sw.js, version.json e o
// manifest sem cache; arquivos com hash no nome com cache longo.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 10000);

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

function fileFor(path) {
  const file = normalize(join(DIST, path));
  if (!file.startsWith(DIST + sep)) return undefined;
  return existsSync(file) && statSync(file).isFile() ? file : undefined;
}

createServer((req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path === '/') path = '/index.html';
  let file = fileFor(path);
  // Navegação para uma rota sem arquivo: entrega o jogo.
  if (!file && !extname(path)) {
    path = '/index.html';
    file = fileFor(path);
  }
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  const cache = path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': cache,
  });
  res.end(readFileSync(file));
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Dopamina Blaster na porta ${PORT}`);
});
