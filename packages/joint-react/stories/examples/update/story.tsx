import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import CodeWithColor from './code-color';
import CodeWithSVG from './code-svg';
import CodeWithAddRemoveNode from './code-add-remove-node';
export type Story = StoryObj<typeof Code>;

import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

import CodeWithColorRaw from './code-color?raw';

import CodeWithSVGRaw from './code-svg?raw';

import CodeWithAddRemoveNodeRaw from './code-add-remove-node?raw';

export default {
  title: 'Examples/Update',
  tags: ['example'],
  component: Code,
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};

export const WithColorPicker: Story = {
  render: CodeWithColor,
  parameters: makeRootDocumentation({
    code: CodeWithColorRaw,
  }),
};

export const WithSVG: Story = {
  render: CodeWithSVG,
  parameters: makeRootDocumentation({
    code: CodeWithSVGRaw,
  }),
};

export const WithNodeRemove: Story = {
  render: CodeWithAddRemoveNode,
  parameters: makeRootDocumentation({
    code: CodeWithAddRemoveNodeRaw,
  }),
};
