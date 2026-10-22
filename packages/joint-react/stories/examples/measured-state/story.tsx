import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Measured state',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Watch selectIsGraphSizingComplete flip once on load, and selectGraphSizingVersion change on every settled add, remove or re-measure. Moving nodes fires nothing.',
      apiUrl: getAPILink('useOnGraphStateChange'),
      code: codeRaw,
      canvasHeight: 480,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
