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
        'Declare paint-ordered layers on GraphProvider, assign cells with their `layer` field, reorder them with useLayers and setLayers, move a cell between layers with setCell, and hide a layer with the paper cellVisibility predicate.',
      apiUrl: getAPILink('useLayers'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
