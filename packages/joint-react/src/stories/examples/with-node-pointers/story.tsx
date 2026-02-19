import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import Code from './code';
import CodeRaw from './code?raw';
import { makeRootDocumentation } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Node Pointers',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description: `
Demonstrates a \`useNodePointer()\` hook that registers SVG sub-elements as named selectors on the JointJS element view. Each \`<Item>\` component receives a ref callback via \`nodePointer(selectorName)\`, which sets the \`joint-selector\` attribute and registers the DOM node in \`elementView.selectors\`.

This enables links to target specific parts of a React-rendered element by selector name (e.g. \`item-0\`, \`item-1\`), without relying on CSS nth-child selectors or the \`Port\` component.
    `,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
