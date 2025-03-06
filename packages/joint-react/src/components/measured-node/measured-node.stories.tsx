/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { MeasuredNode } from './measured-node';
import { useElement } from 'src/hooks/use-element';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ForeignObjectDecorator(Story: any) {
  const { width, height } = useElement();
  return (
    <foreignObject overflow="visible" width={width} height={height}>
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

export const DivWithExactSize: Story = {
  args: {
    children: <div style={{ width: 100, height: 50, backgroundColor: 'cyan' }} />,
  },
};

export const DivWithPaddingAndText: Story = {
  args: {
    children: (
      <div
        style={{
          padding: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: 'cyan',
        }}
      >
        Hello world!
      </div>
    ),
  },
};
