import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Introduction demo',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Renders fully custom React nodes — editable message cards and a table with output ports — on an interactive paper with a toolbar, minimap, selection highlighting, and hover-to-remove links.',
      apiUrl: getAPILink('Paper'),
      canvasHeight: 660,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
