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
        'Watch selectIsMeasured flip once on load, selectMeasuredState change on every settled add, remove or re-measure, and selectElementsSizes change only when a size does. Moving nodes fires nothing.',
      apiUrl: getAPILink('useOnCellsChange'),
      code: codeRaw,
      canvasHeight: 480,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
