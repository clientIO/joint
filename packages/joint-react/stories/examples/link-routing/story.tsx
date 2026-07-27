import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Link Routing',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 640,
      description:
        'Switch link routing presets to re-route every connection as straight, orthogonal, or smooth, with adjustable offsets and corners.',
      apiUrl: getAPILink('linkRoutingSmooth', 'Presets'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
