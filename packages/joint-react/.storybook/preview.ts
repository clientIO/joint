import './wdyr';
import type { Preview } from '@storybook/react';
import { withPerformance } from 'storybook-addon-performance';
import { theme } from './theme';
import { withStringMode } from './decorators/with-strict-mode';

export const decorators = [withPerformance, withStringMode];

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
