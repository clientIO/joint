/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';
import { configureSort } from 'storybook-multilevel-sort';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

configureSort({
  storyOrder: {
    tutorials: null,
    examples: null,
    components: null,
    hooks: null,
    '**': { default: null },
  },
});

function getAbsolutePath(value: string): string {
  return path.dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  // Scope discovery to the top-level `stories/` dir only. A `../**` glob makes
  // Storybook's globber walk the whole package — including `node_modules`
  // (whose symlinks point at other workspace packages, so it recurses into
  // their trees) and `dist/` — which made indexing take minutes and pulled in
  // stray `.stories` files shipped by dependencies. Accepts .stories, story.tsx, and .mdx.
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../stories/**/story.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-links'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  tags: {
    // Custom tags for organizing stories
    component: {},
    hook: {},
    example: {},
    demo: {},
    tutorial: {},
    utils: {},
  },

  // extend Vite config here to resolve libraries properly (in storybook)
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = [
      // Subpath exports must come before the bare package alias
      { find: '@joint/react/internal', replacement: path.resolve(__dirname, '../src/internal.ts') },
      { find: /^@joint\/react$/, replacement: path.resolve(__dirname, '../src/index.ts') },
    ];
    // Pre-bundle the heavy `@joint/core` dep. It resolves through a
    // `node_modules` symlink, and Vite skips dependency optimization for linked
    // packages by default — leaving its large ESM build to be transformed on
    // demand and slowing the first load. (`@joint/react` is intentionally
    // omitted — it's this package's dev target, aliased to source above.)
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [...(config.optimizeDeps.include ?? []), '@joint/core'];
    return config;
  },
};

export default config;
