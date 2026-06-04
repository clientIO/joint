import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Link Routing',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates link presets from `@joint/react/presets`. ' +
          'Switch between `linkRoutingStraight`, `linkRoutingOrthogonal`, and `linkRoutingSmooth` ' +
          'to change the routing, connector, anchor, and connection point of all links.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
