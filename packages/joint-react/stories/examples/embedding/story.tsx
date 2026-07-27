import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Embedding',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Drag a child in and out of a container to reparent it with the Paper embeddingMode option, while a live inspector reflects the updated cell data and raw attributes.',
      apiUrl: getAPILink('Paper'),
      canvasHeight: 480,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
