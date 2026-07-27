import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Minimap',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 460,
      description:
        'Render a scaled-down overview of the graph in a second, non-interactive Paper pinned to the corner.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
