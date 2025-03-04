/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import CodeSVG from './code-svg';
import CodeHTML from './code-html';

export type Story = StoryObj<typeof CodeSVG>;

export default {
  title: 'Examples/Basic Usage/Render Node',
  component: CodeSVG,
} satisfies Meta<typeof CodeSVG>;

export const SVG: Story = {};
export const HTML: Story = {
  render: CodeHTML,
};
