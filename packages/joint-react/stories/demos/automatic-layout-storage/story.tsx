import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/Automatic Layout & Storage',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Persists only the data field of each node to a JSON file, while HTMLHost measures node sizes and a tree layout recomputes positions on every measurement.',
      apiUrl: getAPILink('useOnElementsMeasured'),
      canvasHeight: 640,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
