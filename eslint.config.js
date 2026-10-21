import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
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
    },
  },
);
