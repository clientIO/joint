import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Dynamic status icons',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Attaches a custom list highlighter to each shape and refreshes its colored status dots on an interval.',
      apiUrl: getAPILink('useOnElementsMeasured'),
      canvasHeight: 240,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
