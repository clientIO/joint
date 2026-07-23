import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Transaction',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 500,
      description:
        'Group many graph edits into one atomic transaction — a single undo entry and one React commit across awaits — with opt-in rollback when the callback rejects.',
      apiUrl: getAPILink('useGraph'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
