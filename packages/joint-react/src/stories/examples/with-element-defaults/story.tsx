import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Element Defaults',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates custom PortalElement subclasses with default ports defined in `defaults()`. ' +
          'One uses native JointJS `ports` with groups, the other uses `portMap` for absolute positioning.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
