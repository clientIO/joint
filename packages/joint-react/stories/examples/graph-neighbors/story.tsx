import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Graph Neighbors',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Click a node to spotlight its direct neighbors and connecting links via the graph getNeighbors and getConnectedLinks, dimming everything else.',
      apiUrl: getAPILink('useGraph'),
      canvasHeight: 540,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
