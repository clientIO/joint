import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Native shapes',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Render JointJS built-in standard shapes and native link types by passing typed CellRecord objects to GraphProvider — no custom renderElement required.',
      apiUrl: getAPILink('CellRecord', 'Types'),
      canvasHeight: 520,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
