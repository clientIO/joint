import { tsConfig, jsConfig, reactTsConfig } from '@joint/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['**/*.snap'],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', '.storybook/**/*.{js,jsx,ts,tsx}'],
  },
  ...jsConfig,
  ...tsConfig,
  ...reactTsConfig,
  {
    files: ['src/stories/tutorials/step-by-step/code-controlled-mode-jotai.tsx'],
    rules: {
      'jsdoc/escape-inline-tags': ['warn', { allowedInlineTags: ['joint'] }],
    },
  },
]);
