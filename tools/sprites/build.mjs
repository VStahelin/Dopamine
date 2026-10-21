// Gera os PNGs de todos os sprites em public/sprites/, a partir dos dados de src/assets/sprites/
// e do mesmo código de desenho do jogo (decisão 0020). A lista de arquivos vem de
// src/game/render/spriteFiles.ts: ícones em cada tamanho, molduras e sprites do mundo por detail.
//
// Uso:
//   npm run sprites:build   gera os PNGs (apaga os que não existem mais)
//   npm run sprites:check   só confere se os PNGs estão iguais aos dados (roda no npm run check)
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createServer } from 'vite';

const OUT = resolve('public/sprites');
const check = process.argv.includes('--check');

/** Pintor em memória (RGBA), com mistura de transparência como no jogo. */
class PixelPainter {
  ops = [];
  color = 0;
  alpha = 1;
  fillStyle(color, alpha = 1) {
    this.color = color;
    this.alpha = alpha;
    return this;
  }
  fillRect(x, y, w, h) {
    this.ops.push([x, y, w, h, this.color, this.alpha]);
    return this;
  }
  toPng(width, height) {
    const px = new Uint8Array(width * height * 4);
    for (const [x0, y0, w, h, color, alpha] of this.ops) {
      // Retângulos podem cair em meio pixel (efeitos, ligações): arredonda como a placa de vídeo.
      const x = Math.round(x0);
      const y = Math.round(y0);
      const x1 = Math.round(x0 + w);
      const y1 = Math.round(y0 + h);
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      for (let j = Math.max(0, y); j < Math.min(height, y1); j++) {
        for (let i = Math.max(0, x); i < Math.min(width, x1); i++) {
          const k = (j * width + i) * 4;
          const a0 = px[k + 3] / 255;
          const a = alpha + a0 * (1 - alpha);
          const mix = (src, dst) => Math.round((src * alpha + dst * a0 * (1 - alpha)) / (a || 1));
          px[k] = mix(r, px[k]);
          px[k + 1] = mix(g, px[k + 1]);
          px[k + 2] = mix(b, px[k + 2]);
          px[k + 3] = Math.round(a * 255);
        }
      }
    }
    return encodePng(width, height, px);
  }
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function listPngs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return listPngs(p);
    return e.name.endsWith('.png') ? [p] : [];
  });
}

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});
try {
  const { spriteFiles } = await server.ssrLoadModule('/src/game/render/spriteFiles.ts');
  const files = spriteFiles();
  const expected = new Set(files.map((f) => join(OUT, f.path)));
  const problems = [];
  if (!check) rmSync(OUT, { recursive: true, force: true });
  for (const f of files) {
    const painter = new PixelPainter();
    const size = f.paint(painter);
    const png = painter.toPng(size.width, size.height);
    const target = join(OUT, f.path);
    if (check) {
      if (!existsSync(target) || !readFileSync(target).equals(png)) problems.push(f.path);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, png);
  }
  if (check) {
    for (const p of listPngs(OUT)) if (!expected.has(p)) problems.push(`sobrando: ${relative(OUT, p)}`);
    if (problems.length > 0) {
      console.error(
        `Os PNGs de public/sprites estão diferentes dos dados (${problems.length}). Rode npm run sprites:build.\n` +
          problems.slice(0, 10).join('\n'),
      );
      process.exitCode = 1;
    } else {
      console.log(`${files.length} PNGs de sprite em dia`);
    }
  } else {
    console.log(`${files.length} PNGs gerados em ${relative(process.cwd(), OUT)}`);
  }
} finally {
  await server.close();
}
