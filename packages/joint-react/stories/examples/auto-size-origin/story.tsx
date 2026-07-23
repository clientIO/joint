import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Auto-size origin',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Edit a node to auto-resize it and switch autoSizeOrigin between top-left and center to choose which point stays fixed as the node grows.',
      apiUrl: getAPILink('AutoSizeOrigin', 'Types'),
      code: codeRaw,
      canvasHeight: 440,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
