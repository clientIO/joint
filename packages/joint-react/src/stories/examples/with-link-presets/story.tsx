import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Link Presets',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates link presets from `@joint/react/presets`. ' +
          'Switch between `directLinks`, `orthogonalLinks`, and `curveLinks` ' +
          'to change the routing, connector, anchor, and connection point of all links.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
