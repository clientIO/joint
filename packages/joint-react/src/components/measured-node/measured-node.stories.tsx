/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleGraphDecorator } from '../../../.storybook/decorators/with-simple-data';
import { MeasuredNode } from './measured-node';
import { action } from '@storybook/addon-actions';

export type Story = StoryObj<typeof MeasuredNode>;
const meta: Meta<typeof MeasuredNode> = {
  title: 'Components/MeasuredNode',
  component: MeasuredNode,
  decorators: [SimpleGraphDecorator],
};

export default meta;

export const DivWithAutoSize: Story = {
  args: {
    children: <div>Hello</div>,
    onSizeChange: (a) => action('onSizeChange')(a),
  },
};
