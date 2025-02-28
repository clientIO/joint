/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Mask } from './mask';

export type Story = StoryObj<typeof Mask>;
const meta: Meta<typeof Mask> = {
  title: 'Components/Highlighter/Mask',
  component: Mask,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const Default: Story = {
  args: {
    padding: 0,
    children: <rect width={100} height={50} fill="yellow" />,
  },
};

export const WithPadding: Story = {
  args: {
    padding: 10,
    children: <rect width={100} height={50} fill="yellow" />,
  },
};

export const WithSvgProps: Story = {
  args: {
    padding: 10,
    stroke: 'red',
    strokeWidth: 5,
    strokeLinejoin: 'bevel',
    children: <rect width={100} height={50} fill="yellow" />,
  },
};
