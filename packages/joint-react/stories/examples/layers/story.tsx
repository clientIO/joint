import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Layers',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 440,
      description:
        'Organize elements and links into background, main, and foreground layers, then show or hide each layer with the paper cellVisibility predicate.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
