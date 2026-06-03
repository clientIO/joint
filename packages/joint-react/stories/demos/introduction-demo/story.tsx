import type { Meta, StoryObj } from '@storybook/react-vite';
import Code from './code';

import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/Introduction demo',
  component: Code,
  tags: ['demo'],
  parameters: {
    docs: {
      description: {
        story: 'Demo of jointjs with react using custom nodes',
      },
      source: {
        code: `${RawCode}`,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
