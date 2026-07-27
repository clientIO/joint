import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Default Link',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Colors each new link by reading its source port in a defaultLink factory as you drag from the colored ports.',
      apiUrl: getAPILink('DefaultLinkParams', 'Types'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
