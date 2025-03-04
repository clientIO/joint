/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/With minimap',
  component: Code,
} satisfies Meta<typeof Code>;

export const Default: Story = {};
