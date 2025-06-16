import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
import CodeWithColor from './code-with-color';
import CodeWithSVG from './code-with-svg';
import CodeWithAddRemoveNode from './code-add-remove-node';
export type Story = StoryObj<typeof Code>;

import { makeRootDocumentation } from '../../utils/make-story';
// @ts-expect-error its storybook raw import
import CodeRaw from './code?raw';
// @ts-expect-error its storybook raw import
import CodeWithColorRaw from './code-with-color?raw';
// @ts-expect-error its storybook raw import
import CodeWithSVGRaw from './code-with-svg?raw';
// @ts-expect-error its storybook raw import
import CodeWithAddRemoveNodeRaw from './code-add-remove-node?raw';

export default {
  title: 'Examples/Update',
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
