import type { Meta, StoryObj } from '@storybook/react';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Stress/React-DOM paper',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    description: `
**ReactPaper Stress Test**

This example demonstrates ReactPaper performance with 450 nodes (15x30 grid) and 449 links.

Key differences from Paper stress test:
- Uses **pure SVG rendering** (rect + text) instead of foreignObject/HTML
- React owns the entire SVG structure - no portals
- Links computed via JointJS but rendered by React using \`useLinkLayout()\`

Click "change pos" to randomly reposition all nodes and observe link updates.
    `,
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
