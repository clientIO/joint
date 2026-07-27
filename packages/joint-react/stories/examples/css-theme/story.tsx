import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/CSS Theme',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Theme links, labels, and nodes from plain CSS custom properties and flip the whole diagram between light and dark by toggling a class.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
