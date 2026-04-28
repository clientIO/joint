import { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Element Ports (Groups)',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates native JointJS port groups with the `elementPort()` preset. ' +
          'Ports are defined via `ports` prop (not `portMap`) with `in` and `out` groups positioned left and right.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
