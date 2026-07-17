import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Pulsing Port',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Drag a connection from a node output port and watch the valid input ports pulse with a custom magnet-availability highlighter.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
