import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Flowchart',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      canvasHeight: 620,
      description:
        'Wire auto-sized start, step, and decision shapes together with orthogonal links to build an interactive, themeable flowchart with hover highlights and editable anchors.',
      apiUrl: getAPILink('linkRoutingOrthogonal', 'Presets'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
