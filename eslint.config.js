import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'releases', '.certs', 'sprites-export'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Scripts de publicação e do servidor local rodam no Node.
    files: ['tools/**/*.mjs', 'vite.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Decisão 0003: core e config não dependem do Phaser nem da camada game.
    files: ['src/core/**/*.ts', 'src/config/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'phaser/*'],
              message: 'src/core e src/config não importam Phaser.',
            },
            { group: ['**/game/**'], message: 'src/core e src/config não importam src/game.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'indexedDB'],
      // Decisão 0012: aleatoriedade só pelo Rng com semente.
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use o Rng de src/core/random.ts.' },
      ],
    },
  },
);
