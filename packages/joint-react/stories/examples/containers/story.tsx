import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Containers',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Embed child elements inside a container with drag-and-drop, using validateEmbedding to allow only container elements as parents.',
      apiUrl: getAPILink('Paper'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
