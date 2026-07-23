import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/User Flow',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Wire custom flow nodes whose input and output ports are connectable magnets, adding or removing output ports live.',
      apiUrl: getAPILink('useMarkup'),
      canvasHeight: 700,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
