import type { Meta, StoryObj } from '@storybook/react';
import '../../examples/index.css';
import Code from './code';
import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Tutorials/Redux',
  component: Code,
  tags: ['tutorial'],
  parameters: {
    docs: {
      description: {
        story: 'Tutorial on using Redux with JointJS React',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
