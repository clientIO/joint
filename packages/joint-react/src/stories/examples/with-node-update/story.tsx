import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
import CodeWithColor from './code-with-color';
import CodeWithSVG from './code-with-svg';
import CodeWithAddRemoveNode from './code-add-remove-node';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/With update',
  component: Code,
} satisfies Meta<typeof Code>;

export const Default: Story = {};

export const WithColorPicker: Story = {
  render: CodeWithColor,
};

export const WithSVG: Story = {
  render: CodeWithSVG,
};

export const WithNodeRemove: Story = {
  render: CodeWithAddRemoveNode,
};
