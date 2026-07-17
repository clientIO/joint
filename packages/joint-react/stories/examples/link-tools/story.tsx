import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Link tools',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 380,
      description:
        'Attach interactive link tools — a boundary, editable vertices, a custom JSX button, and a draggable arrowhead — that appear when hovering over a link.',
      apiUrl: getAPILink('jsx'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
