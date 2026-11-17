import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Port Shapes',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Links end on the boundary of the port shape - an ellipse, a rectangle or a custom path - instead of the bounding box of the port.',
      apiUrl: getAPILink('ElementPort', 'Types'),
      canvasHeight: 520,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
