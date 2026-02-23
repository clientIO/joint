import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/JointJS API',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description: `
Demonstrates how to use the JointJS API directly to populate the diagram.

Instead of passing \`elements\` and \`links\` props to \`GraphProvider\`, this example:
1. Creates a \`dia.Graph\` instance manually
2. Creates elements using \`ReactElement\` and links using \`shapes.standard.Link\`
3. Adds them to the graph with \`graph.resetCells()\`
4. Passes the graph to \`GraphProvider\` via the \`graph\` prop
5. Uses \`mvc.Listener\` to listen to Paper events via a ref — hovering over a link shows interactive link tools (remove, source/target arrowheads)

Each element renders an HTML button. Clicking the button changes the element color using \`element.prop('data/color', newColor)\`, which updates the JointJS model directly. The change propagates back to React through the store sync.
    `,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
