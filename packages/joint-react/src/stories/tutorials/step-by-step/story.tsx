import type { Meta, StoryObj } from '@storybook/react';
import '../../examples/index.css';
import CodeSVG from './code-svg';
import CodeHTML from './code-html';
import CodeHTMLPortal from './code-html-renderer';

export type Story = StoryObj<typeof CodeSVG>;

export default {
  title: 'Tutorials/Step by Step',
  component: CodeSVG,
  tags: ['tutorial'],
} satisfies Meta<typeof CodeSVG>;

export const SVG: Story = {};
export const HTML: Story = {
  render: CodeHTML as never,
};

export const HTMLRenderer: Story = {
  render: CodeHTMLPortal as never,
};
