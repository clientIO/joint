import { tsConfig, jsConfig, reactTsConfig } from '@joint/eslint-config';
import { defineConfig } from 'eslint/config';

// `reactTsConfig` is the monorepo's modern-TS profile (2-space, indent off); this
// package has no React, but follows the same shared style as `@joint/react` it was
// extracted from. No React-specific rules are triggered by its plain-TS sources.
export default defineConfig([
  {
    files: ['src/**/*.ts'],
  },
  ...jsConfig,
  ...tsConfig,
  ...reactTsConfig,
]);
