import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/JointJS API',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Drive the diagram with the native JointJS API: build a dia.Graph by hand, reach the paper with usePaper to add hover link tools via mvc.Listener, and recolor nodes through element.prop.',
      apiUrl: getAPILink('usePaper'),
      canvasHeight: 380,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
