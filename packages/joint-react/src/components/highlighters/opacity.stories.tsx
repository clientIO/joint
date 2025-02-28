/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Opacity } from './opacity';

export type Story = StoryObj<typeof Opacity>;
const meta: Meta<typeof Opacity> = {
  title: 'Components/Highlighter/Opacity',
  component: Opacity,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const Default: Story = {
  args: {
    children: <rect width={100} height={50} fill="blue" />,
  },
};

export const WithAlphaValue: Story = {
  args: {
    alphaValue: 0.5,
    children: <rect width={100} height={50} fill="blue" />,
  },
};
