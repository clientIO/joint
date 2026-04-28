import { Meta, StoryObj } from '@storybook/react-vite';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/Link Arrows',
  component: Code,
  tags: ['demo'],
  parameters: {
    docs: {
      description: {
        story: 'Showcase of 50 custom link markers arranged in a grid. Click a link to zoom in, click again to zoom further, click blank to zoom out.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
