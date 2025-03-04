import type { Preview } from '@storybook/react';

import { withPerformance } from 'storybook-addon-performance';

export const decorators = [withPerformance];

const preview: Preview = {
  parameters: {
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
