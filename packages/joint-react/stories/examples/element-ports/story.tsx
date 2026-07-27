import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Element Ports',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Give elements labeled ports with custom shape, color, and position, then edit each port live from a side panel.',
      apiUrl: getAPILink('ElementPort', 'Types'),
      canvasHeight: 640,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
