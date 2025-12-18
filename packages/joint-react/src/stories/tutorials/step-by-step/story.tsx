import type { Meta, StoryObj } from '@storybook/react';
import '../../examples/index.css';
import CodeSVG from './code-svg';
import CodeHTML from './code-html';
import CodeHTMLPortal from './code-html-renderer';
import CodeControlledMode from './code-controlled-mode';
import CodeControlledModeRedux from './code-controlled-mode-redux';
import CodeControlledModePeerJS from './code-controlled-mode-peerjs';
import CodeControlledModeZustand from './code-controlled-mode-zustand';
import CodeControlledModeJotai from './code-controlled-mode-jotai';

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

export const ControlledMode: Story = {
  render: CodeControlledMode as never,
};

export const ControlledModeRedux: Story = {
  render: CodeControlledModeRedux as never,
};

export const ControlledModeZustand: Story = {
  render: CodeControlledModeZustand as never,
};

export const ControlledModeJotai: Story = {
  render: CodeControlledModeJotai as never,
};

export const ControlledModePeerJS: Story = {
  render: CodeControlledModePeerJS as never,
};
