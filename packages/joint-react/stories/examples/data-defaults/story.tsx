import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Data Defaults',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 460,
      description:
        'Store default styling — port maps, sizes, and link styles — in cell data, then re-theme every cell in one batch with updateCells from useGraph.',
      apiUrl: getAPILink('useGraph'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
