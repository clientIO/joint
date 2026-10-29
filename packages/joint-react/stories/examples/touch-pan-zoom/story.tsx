import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Touch Pan & Zoom',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Out-of-the-box pinch-to-zoom and two-finger pan: touchscreen pinches and touchpad (Ctrl/Cmd + wheel) pinches zoom the canvas around the gesture point. Tune the limits with the zoomOnPinch prop, or take over entirely with onPaperPinch / onPaperPan.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
