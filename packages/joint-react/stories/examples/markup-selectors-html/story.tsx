import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Markup Selectors HTML',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Tag each HTML table row as a named magnet with useMarkup so links connect to and start from specific rows of an HTMLBox node.',
      apiUrl: getAPILink('useMarkup'),
      canvasHeight: 260,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
