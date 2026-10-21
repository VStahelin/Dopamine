// Exporta todos os sprites de src/assets/sprites como PNG e SVG, usando o mesmo código de
// desenho do jogo (src/game/render/spriteArt.ts). Serve para ver os sprites fora do jogo e
// para comparar texturas geradas em código com imagens prontas.
//
// Uso: npm run sprites:export [-- --out pasta] [-- --scale 4]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const OUT = resolve(option('out', 'sprites-export'));
/** Ampliação extra dos ícones (os de 16×16 também saem em tamanho real). */
const ICON_SCALE = Number(option('scale', '4'));

function exportAll(art, sprites, details) {
  const files = [];
  const save = (dir, name, paint, scale = 1) => {
    const png = new PixelPainter();
    const svg = new SvgPainter();
    const size = paint(png);
    paint(svg);
    mkdirSync(join(OUT, dir), { recursive: true });
    const base = join(dir, name);
    writeFileSync(join(OUT, `${base}.png`), png.toPng(size.width, size.height));
    writeFileSync(join(OUT, `${base}.svg`), svg.toSvg(size.width, size.height));
    files.push({ path: base, ...size, scale });
  };

  for (const [group, icons] of Object.entries(sprites.ICONS)) {
    for (const [id, grid] of Object.entries(icons)) {
      save(`icons/${group}`, id, (p) => art.paintGrid(p, grid));
      save(`icons/${group}`, `${id}@${ICON_SCALE}x`, (p) => art.paintGrid(p, grid, ICON_SCALE));
    }
  }
  for (const detail of details) {
    for (const [id, def] of Object.entries(sprites.MOLECULES)) {
      save('molecules', `${id}@${detail}`, (p) => art.paintMolecule(p, def, detail));
    }
    save('world', `ground@${detail}`, (p) => art.paintGround(p, detail));
    save('world', `gem@${detail}`, (p) => art.paintGem(p, detail));
    for (const orb of ['electron', 'shot', 'coin']) {
      save('world', `${orb}@${detail}`, (p) => art.paintOrb(p, sprites.WORLD_SPRITES[orb], detail));
    }
  }
  return files;
}

/** Folha de contato para ver tudo de uma vez no navegador. */
function writeSheet(files) {
  const groups = new Map();
  for (const f of files) {
    const dir = f.path.slice(0, f.path.lastIndexOf('/'));
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(f);
  }
  const sections = [...groups]
    .map(
      ([dir, list]) =>
        `<h2>${dir}</h2><div class="grid">${list
          .map(
            (f) =>
              `<figure><img src="${f.path}.png" width="${f.width * 2}" height="${f.height * 2}"><figcaption>${f.path.split('/').pop()}</figcaption></figure>`,
          )
          .join('')}</div>`,
    )
    .join('');
  writeFileSync(
    join(OUT, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Sprites</title><style>
body{background:#15172E;color:#F4EFE0;font:14px monospace;margin:24px}
.grid{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}
figure{margin:0;text-align:center}img{image-rendering:pixelated;background:#2A2E55}
figcaption{font-size:11px;color:#C9CCE6}</style>${sections}`,
  );
}

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
    for (const [x, y, w, h, color, alpha] of this.ops) {
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      for (let j = Math.max(0, y); j < Math.min(height, y + h); j++) {
        for (let i = Math.max(0, x); i < Math.min(width, x + w); i++) {
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

/** Pintor que guarda os retângulos como SVG nítido. */
class SvgPainter {
  rects = [];
  fill = '#000000';
  opacity = 1;
  fillStyle(color, alpha = 1) {
    this.fill = `#${color.toString(16).padStart(6, '0')}`;
    this.opacity = alpha;
    return this;
  }
  fillRect(x, y, w, h) {
    const op = this.opacity < 1 ? ` fill-opacity="${this.opacity}"` : '';
    this.rects.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${this.fill}"${op}/>`,
    );
    return this;
  }
  toSvg(width, height) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${this.rects.join('')}</svg>\n`;
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
    chunk('IDAT', deflateSync(raw)),
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

// No fim do arquivo: as classes acima precisam existir antes de rodar.
const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});
try {
  const art = await server.ssrLoadModule('/src/game/render/spriteArt.ts');
  const sprites = await server.ssrLoadModule('/src/assets/sprites/index.ts');
  const { DISPLAY } = await server.ssrLoadModule('/src/config/index.ts');
  rmSync(OUT, { recursive: true, force: true });
  const files = exportAll(art, sprites, DISPLAY.spriteDetails);
  writeSheet(files);
  console.log(`${files.length} sprites exportados em ${OUT}`);
} finally {
  await server.close();
}
