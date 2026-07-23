import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Link Arrows',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Builds a gallery of 50 custom link arrowhead markers, zooming from the overview to a single link and then to its arrowhead as you click.',
      apiUrl: getAPILink('LinkMarker', 'Types'),
      canvasHeight: 720,
      plainCanvas: true,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
