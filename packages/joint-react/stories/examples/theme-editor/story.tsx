import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Theme Editor',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Edit the built-in --jj-* CSS theme variables live in a side panel and watch the paper, links, labels, and nodes restyle instantly.',
      apiUrl: getAPILink('Paper'),
      canvasHeight: 560,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
