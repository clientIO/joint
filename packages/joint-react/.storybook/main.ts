/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { configureSort } from 'storybook-multilevel-sort';

configureSort({
  storyOrder: {
    tutorials: null,
    examples: null,
    components: null,
    hooks: null,
    '**': { default: null },
  },
});

const config: StorybookConfig = {
  // accept .stories and also story.tsx
  stories: [
    '../**/*.mdx',
    '../**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../**/story.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    'storybook-addon-performance',
    '@codesandbox/storybook-addon',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },

  // 👇 extend Vite config here
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
