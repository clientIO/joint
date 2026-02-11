import type { Preview } from '@storybook/react-vite';
import { theme } from './theme';
import { withStrictMode } from './decorators/with-strict-mode';

export const decorators = [withStrictMode];

const preview: Preview = {
  parameters: {
    docs: {
      theme,
    },
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: theme.appBg }
      }
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

  initialGlobals: {
    backgrounds: {
      value: 'dark'
    }
  }
};

export default preview;
