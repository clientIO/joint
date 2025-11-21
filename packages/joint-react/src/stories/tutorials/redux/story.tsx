import type { Meta, StoryObj } from '@storybook/react';
import '../../examples/index.css';
import Code from './code';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Tutorials/Redux',
  component: Code,
} satisfies Meta<typeof Code>;

export const Default: Story = {};
