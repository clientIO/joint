import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Utils/JSX',
  component: Code,
  tags: ['utils'],
  parameters: {
    showcase: {
      description: 'Write a JointJS element’s SVG markup as JSX using the jsx utility.',
      apiUrl: getAPILink('jsx'),
      canvasHeight: 260,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
