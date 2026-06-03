import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import Code from './code';
import CodeRaw from './code?raw';
import { makeRootDocumentation } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Markup Selectors',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description: `
Demonstrates the \`useMarkup()\` hook from \`@joint/react\` that provides utilities for working with JointJS markup selectors. Each \`<Item>\` component receives a ref callback via \`selectorRef(selectorName)\`, which sets the \`joint-selector\` attribute and registers the DOM node in \`elementView.selectors\`.

This enables links to target specific parts of a React-rendered element by selector name (e.g. \`item-0\`, \`item-1\`), without relying on CSS nth-child selectors or the \`Port\` component.
    `,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
