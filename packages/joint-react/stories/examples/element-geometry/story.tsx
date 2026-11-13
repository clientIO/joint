import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Element Geometry',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Describe the shape of each element with the elementGeometry prop so that links end on the ellipse or the rhombus instead of the bounding box.',
      apiUrl: getAPILink('GraphProvider'),
      canvasHeight: 520,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
