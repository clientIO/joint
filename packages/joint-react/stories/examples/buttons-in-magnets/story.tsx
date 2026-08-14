import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Buttons In Magnets',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Three kinds of control inside a node: a button that both clicks and drags (moving the element, or starting a link from its magnet), a text field that keeps every gesture so it can select text, and a dropdown the paper ignores outright. A gesture that moves never also clicks.',
      apiUrl: getAPILink('useMarkup'),
      canvasHeight: 300,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
