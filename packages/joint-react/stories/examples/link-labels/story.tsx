import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Link Labels',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Attach styled, draggable labels to links declaratively through the labelMap field on each link record.',
      apiUrl: getAPILink('LinkLabel', 'Types'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
