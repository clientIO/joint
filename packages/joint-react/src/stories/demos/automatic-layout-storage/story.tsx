import { Meta, StoryObj } from '@storybook/react-vite';
import Code from './code';

import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/Automatic Layout & Storage',
  component: Code,
  tags: ['demo'],
  parameters: {
    docs: {
      description: {
        story:
          'Controlled-mode persistence demo. Only the `data` field of each node is saved to localStorage — sizes are measured automatically by `HTMLHost`, and positions are recomputed by a BFS hierarchical layout each time the diagram mounts. Use **Save** / **Load** to round-trip through storage, then refresh the story to see the data come back.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
