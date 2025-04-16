import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/With list node',
  component: Code,
} satisfies Meta<typeof Code>;

export const Default: Story = {};
