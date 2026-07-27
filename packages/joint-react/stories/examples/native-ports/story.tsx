import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Native ports',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Attach native JointJS ports to React-rendered elements by declaring them in the element data.',
      apiUrl: getAPILink('CellRecord', 'Types'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
