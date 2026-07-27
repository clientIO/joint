import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Link Markers (Named)',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Renders a link for each built-in named marker, applying the marker name to both the source and target ends.',
      apiUrl: getAPILink('LinkMarkerName', 'Types'),
      canvasHeight: 240,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
