import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Collapsible Containers',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Collapse nested container elements to hide their embedded children, auto-resizing each container to fit its contents.',
      apiUrl: getAPILink('Paper'),
      canvasHeight: 540,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
