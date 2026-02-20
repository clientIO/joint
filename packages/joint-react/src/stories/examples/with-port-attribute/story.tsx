import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import Code from './code';
import CodeRaw from './code?raw';
import { makeRootDocumentation } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Port Attribute',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description: `
Demonstrates elements with a yellow header and stacked labeled rows that act as connectable ports. Each row uses a \`port\` and \`magnet\` attribute on an SVG \`<g>\` element, enabling links to connect directly to individual rows via CSS selectors.

A custom \`MyReactElement\` subclass disables the default root magnet and enables CSS selectors, so connections snap to specific attribute rows rather than the element body. The Paper is configured with \`midSide\` anchors, \`rectangle\` connection points, and stroke highlighting for a polished linking experience.
    `,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
