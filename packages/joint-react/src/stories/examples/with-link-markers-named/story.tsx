import { Meta, StoryObj } from '@storybook/react-vite';
import Code from './code';
import RawCode from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Link Markers (Named)',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        story: 'Grid of links showing all built-in named markers. Each link uses the marker name as a string for both source and target.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
