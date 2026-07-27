import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/SVG node',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Render a node as raw SVG and auto-size the rect around its text using useMeasureElement.',
      apiUrl: getAPILink('useMeasureElement'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
