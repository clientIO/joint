import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Shape animations',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 580,
      description:
        'Render custom animated SVG shapes and light each bulb reactively from the generator power stored in the graph.',
      apiUrl: getAPILink('useCells'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
