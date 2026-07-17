import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Fixed connection points',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 640,
      description:
        'Snap new links to fixed anchor points on each shape by picking the anchor closest to where the connection is dropped.',
      apiUrl: getAPILink('ConnectionStrategy', 'Types'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
