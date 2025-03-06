import type { Preview } from '@storybook/react';

import { withPerformance } from 'storybook-addon-performance';

export const decorators = [withPerformance];

const preview: Preview = {
  parameters: {
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
};

export default preview;
