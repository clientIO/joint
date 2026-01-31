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
  // accept .stories and also story.tsx
  stories: [
    '../**/*.mdx',
    '../**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../**/story.@(js|jsx|mjs|ts|tsx)',
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
    config.resolve.alias = {
      ...config.resolve.alias,
      '@joint/react': path.resolve(__dirname, '../src/index.ts'),
      '@joint/react/src/*': path.resolve(__dirname, '../src/*'),
    };
    return config;
  },
};

export default config;
