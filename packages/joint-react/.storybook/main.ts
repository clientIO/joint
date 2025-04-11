import type { StorybookConfig } from '@storybook/react-vite';

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
    '@storybook/addon-storysource',
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
