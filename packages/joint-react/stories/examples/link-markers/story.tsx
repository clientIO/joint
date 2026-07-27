import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Link Markers',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Renders every built-in link marker on both ends of a link, with a slider to scale the marker geometry.',
      apiUrl: getAPILink('linkMarkerArrow', 'Presets'),
      canvasHeight: 960,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
