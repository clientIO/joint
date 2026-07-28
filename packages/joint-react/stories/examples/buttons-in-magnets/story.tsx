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
        'A button inside a node is both clickable and draggable: press and release to click it, drag it to move the element or to start a link from its magnet. A gesture that moves never also clicks.',
      apiUrl: getAPILink('useMarkup'),
      canvasHeight: 280,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
