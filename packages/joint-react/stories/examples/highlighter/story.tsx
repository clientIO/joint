import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Highlighter',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Highlight a node on hover with the JointJS mask and opacity highlighters, added and removed through Paper element mouse events.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Mask: Story = {
  args: {
    variant: 'mask',
  },
};

export const Opacity: Story = {
  args: {
    variant: 'opacity',
  },
};
