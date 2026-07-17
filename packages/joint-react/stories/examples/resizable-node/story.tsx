import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Resizable node',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 420,
      description:
        'Resize a node by dragging its bottom-right corner and sync the element to its HTML content with useMeasureElement.',
      apiUrl: getAPILink('useMeasureElement'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
