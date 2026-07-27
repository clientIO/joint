import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Stress',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Stress-tests the paper with hundreds of controlled nodes, randomizing every position inside a React transition.',
      apiUrl: getAPILink('GraphProvider'),
      canvasHeight: 720,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
