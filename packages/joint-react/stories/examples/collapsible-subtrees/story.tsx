import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Collapsible subtrees',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Collapse and expand branches of a fault-tree diagram by toggling the hidden flag on cells through the Paper cellVisibility filter, re-running the directed-graph layout after every change.',
      apiUrl: getAPILink('Paper'),
      canvasHeight: 720,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
