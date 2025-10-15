import type { Meta, StoryObj } from '@storybook/react';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/Flowchart',
  component: Code,

  parameters: {
    docs: {
      description: {
        story: 'Demo of flowchart',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
