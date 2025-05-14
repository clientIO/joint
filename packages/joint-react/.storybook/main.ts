import type { StorybookConfig } from '@storybook/react-vite';
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
    // TODO: this library is not compatible with Vite storybook, so we will wait to fix it and then we can again enable.
    // '@storybook/addon-storysource',
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
};
export default config;
