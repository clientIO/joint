import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Fit to content',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Frame the whole diagram automatically with the `fitToContent` prop, choosing whether it zooms or grows the paper and how often it re-runs.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
