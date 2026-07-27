import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Element Ports (Groups)',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Group inbound and outbound ports on elements with the elementPort() preset and connect links through named ports.',
      apiUrl: getAPILink('elementPort', 'Presets'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
