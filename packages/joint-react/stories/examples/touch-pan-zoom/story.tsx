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
        'Pinch-to-zoom and two-finger pan on a touchscreen: dia.Paper turns the gesture into the same paper:pinch / paper:pan events a touchpad fires, and never into a press on the node under the fingers. The onPaperPinch and onPaperPan props apply them to the viewport.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
