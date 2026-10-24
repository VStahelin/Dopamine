import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

/** Identidade da build (decisão 0016): commit + data, igual no jogo e no version.json. */
function buildIdentity() {
  let commit = 'local';
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Fora de um repositório git: fica "local".
  }
  const builtAt = new Date().toISOString();
  const stamp = builtAt.replace(/[-:T]/g, '').slice(0, 14);
  return { version: pkg.version, buildId: `${commit}-${stamp}`, builtAt };
}

const identity = buildIdentity();

/**
 * Gera o version.json na raiz da build com a versão, o buildId e a lista de arquivos. Ele fica
 * fora do precache do service worker e é sempre pedido sem cache.
 */
function versionFile(): Plugin {
  return {
    name: 'dopamina-version-file',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).sort();
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ ...identity, files }, null, 2),
      });
    },
  };
}

export default defineConfig({
  // GitHub Pages serve em /Dopamine/ (BASE_PATH no workflow); Render e local, na raiz.
  base: process.env.BASE_PATH ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(identity.version),
    __BUILD_ID__: JSON.stringify(identity.buildId),
  },
  plugins: [
    versionFile(),
    VitePWA({
      // A versão nova espera o jogador aceitar (decisão 0016); nunca recarrega sozinha.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Farmaco Battle',
        short_name: 'Farmaco',
        lang: 'pt-BR',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#15172E',
        theme_color: '#15172E',
        // Gerados pelo npm run sprites:build a partir de src/assets/sprites/logo.json (docs/logo.md).
        icons: [
          { src: 'sprites/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'sprites/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'sprites/pwa/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'sprites/pwa/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,png,json,webmanifest}'],
        // Artes de loja e a logo em 4× não entram no jogo; ficam fora do precache. O jogo carrega
        // os sprites dos atlas (sprites/atlas/), então os PNGs soltos também ficam de fora.
        globIgnores: [
          'version.json',
          'sprites/store/**',
          'sprites/logo/4x/**',
          'sprites/icons/**',
          'sprites/world/**',
          'sprites/frames/**',
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Músicas e efeitos ficam fora do precache (as músicas pesam ~11 MB): entram no cache na primeira vez.
        // O `?v=` de cada arquivo (rev em src/config/audio.json) troca a versão.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'dopamina-audio',
              expiration: { maxEntries: 120 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
