import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Layers',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 440,
      description:
        'Declare paint-ordered layers on GraphProvider, assign cells with their `layer` field, then hide and reorder them with useLayer, useLayers, and setLayers — and move a cell between layers with setCell.',
      apiUrl: getAPILink('useLayers'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
