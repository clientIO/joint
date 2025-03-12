/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderPaperDecorator } from '../../../.storybook/decorators/with-simple-data';
import { ToolsView } from './tools-view';

export type Story = StoryObj<typeof ToolsView>;
const meta: Meta<typeof ToolsView> = {
  title: 'Components/ToolsView',
  component: ToolsView,
  decorators: [SimpleRenderPaperDecorator],
};

export default meta;

export const Default: Story = {
  args: {
    children: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Default tools view story.',
      },
    },
  },
};
