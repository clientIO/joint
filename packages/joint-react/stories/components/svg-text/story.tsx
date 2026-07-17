import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Components/SVGText',
  component: Code,
  tags: ['component'],
  parameters: {
    showcase: {
      description:
        'Render SVG text that measures itself and wraps or truncates to a width, sizing the node around it.',
      apiUrl: getAPILink('SVGText'),
      canvasHeight: 320,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
