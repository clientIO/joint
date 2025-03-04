/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { HTMLNode } from './html-node';

export type Story = StoryObj<typeof HTMLNode>;
const meta: Meta<typeof HTMLNode> = {
  title: 'Components/HTMLNode',
  component: HTMLNode,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const DivWithAutoSize: Story = {
  args: {
    style: { width: 100, height: 50, backgroundColor: 'blue' },
  },
};

export const DivWithAutoSizeAndPadding: Story = {
  args: {
    style: { width: 100, height: 50, padding: 10, backgroundColor: 'blue' },
  },
  parameters: {
    docs: {
      description: {
        story: 'This story has padding applied to the div element.',
      },
    },
  },
};

export const DivWithSizedChildren: Story = {
  args: {
    children: <div style={{ width: 50, height: 25, backgroundColor: 'blue' }} />,
  },
};
