import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Dynamic Interactivity',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Toggle the interactive prop on Paper live to switch between an editable mode with an inline label editor and a read-only mode that reveals node info on hover.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
