import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Cell JSON data',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 460,
      description:
        'Initializes the graph from raw JointJS cell JSON with a custom element model, then mirrors each cell’s live position, size, and type in a side panel.',
      apiUrl: getAPILink('useCells'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
