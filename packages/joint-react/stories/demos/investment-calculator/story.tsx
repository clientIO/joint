import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Investment Calculator',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Edits HTML form inputs embedded in SVG nodes and derives each product’s value and ROI reactively from the graph topology.',
      apiUrl: getAPILink('useCells'),
      canvasHeight: 680,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
