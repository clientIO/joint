import { Meta, StoryObj } from '@storybook/react-vite';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/SaaSflow',
  component: Code,
  tags: ['demo'],
  parameters: {
    docs: {
      description: {
        story: 'SaaS project management flow with dark/light theme toggle',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
