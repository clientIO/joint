/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { MeasuredNode } from './measured-node';
import { action } from '@storybook/addon-actions';
import { useElement } from 'src/hooks/use-element';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ForeignObjectDecorator(Story: any) {
  const { width, height } = useElement();
  return (
    <foreignObject width={width} height={height}>
      <Story />
    </foreignObject>
  );
}
export type Story = StoryObj<typeof MeasuredNode>;
const meta: Meta<typeof MeasuredNode> = {
  title: 'Components/MeasuredNode',
  component: MeasuredNode,
  decorators: [ForeignObjectDecorator, SimpleRenderItemDecorator],
};

export default meta;

export const DivWithAutoSize: Story = {
  args: {
    children: <div style={{ width: 100, height: 50, backgroundColor: 'cyan' }} />,
    onSizeChange: (a) => action('onSizeChange')(a),
  },
};

export const WithInvalidChildren: Story = {
  args: {
    children: <>Hello</>,
  },
};
