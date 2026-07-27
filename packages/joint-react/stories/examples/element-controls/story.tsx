import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Element Controls',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Drag custom elementTools.Control handles to reshape SVG nodes, re-rendering each React shape from its updated element data.',
      apiUrl: getAPILink('useOnElementsMeasured'),
      code: codeRaw,
      canvasHeight: 640,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
