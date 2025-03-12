import type { Meta, StoryObj } from '@storybook/react/*';
import '../../examples/index.css';
import CodeSVG from './code-svg';
import CodeHTML from './code-html';

export type Story = StoryObj<typeof CodeSVG>;

export default {
  title: 'Tutorials/Render Node',
  component: CodeSVG,
} satisfies Meta<typeof CodeSVG>;

export const SVG: Story = {};
export const HTML: Story = {
  render: CodeHTML,
};
