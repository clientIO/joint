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
    parameters: {
      options: {
        // @ts-expect-error its storybook multilevel sort
        storySort: (a, b) => globalThis['storybook-multilevel-sort:storySort'](a, b),
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
