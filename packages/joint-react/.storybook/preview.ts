import type { Preview } from '@storybook/react-vite';
import { theme } from './theme';
import { withStrictMode } from './decorators/with-strict-mode';
import { withShowcase } from './decorators/with-showcase';
import './preview.css';

// Showcase is the outermost frame; StrictMode wraps the live story inside it.
export const decorators = [withShowcase, withStrictMode];

const preview: Preview = {
  parameters: {
    // The Showcase frame owns all spacing and the app background.
    layout: 'fullscreen',
    docs: {
      theme,
    },
    options: {
      // @ts-expect-error injected by storybook-multilevel-sort
      storySort: (a, b) => globalThis['storybook-multilevel-sort:storySort'](a, b),
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators,
};

export default preview;
