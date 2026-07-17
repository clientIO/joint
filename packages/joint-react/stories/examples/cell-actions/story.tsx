import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Cell Actions',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 560,
      description:
        'Add, edit, and remove elements and links at runtime with the setCell and removeCell actions from useGraph.',
      apiUrl: getAPILink('useGraph'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
