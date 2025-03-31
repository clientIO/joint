import type { Preview } from '@storybook/react';
import { withPerformance } from 'storybook-addon-performance';
import { theme } from './theme';

export const decorators = [withPerformance];

const preview: Preview = {
  parameters: {
    docs: {
      theme,
    },
    backgrounds: {
      values: [{ name: 'Dark', value: theme.appBg }],
      default: 'Dark',
    },
    options: {
      storySort: {
        method: '',
        order: ['Tutorials', 'Examples', 'Components', 'Hooks'],
        locales: '',
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  tags: ['autodocs'],
  decorators,
};

export default preview;
