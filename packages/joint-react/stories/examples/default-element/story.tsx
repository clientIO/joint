import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Default Element',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Renders elements with the built-in HTMLBox, which auto-sizes to its label unless width or height is set in the element data.',
      apiUrl: getAPILink('HTMLBox'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
