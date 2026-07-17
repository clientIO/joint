import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Rotatable node',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Rotate an element by dragging a custom handle that turns the pointer position into an angle written back to the node.',
      apiUrl: getAPILink('usePaper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
