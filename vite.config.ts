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
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Dopamina Blaster',
        short_name: 'Dopamina',
        lang: 'pt-BR',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#15172E',
        theme_color: '#15172E',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,png,webmanifest}'],
        globIgnores: ['version.json'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
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
