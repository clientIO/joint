import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Collaboration',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Keeps a diagram in sync across peers in real time by broadcasting every added, changed, and removed cell from the onIncrementalCellsChange diff callback over a PeerJS connection.',
      apiUrl: getAPILink('IncrementalCellsChange', 'Types'),
      canvasHeight: 400,
      plainCanvas: true,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
