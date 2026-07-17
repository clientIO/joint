import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Custom Cell Models',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Subclass ElementModel and LinkModel to bake default ports and labels into custom cell types registered through cellNamespace.',
      apiUrl: getAPILink('ElementModel', 'MVC'),
      canvasHeight: 300,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
