import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Intersection',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Highlights each node whose bounding box overlaps another as you drag it around the canvas.',
      apiUrl: getAPILink('useCells'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
