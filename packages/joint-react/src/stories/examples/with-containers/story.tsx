import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import CodeRaw from './code?raw';
import { makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Containers',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates parent-child element relationships using the \`parent\` property and Paper embedding options.

## Key Concept: Element Embedding

Child elements can be embedded within parent containers by setting the \`parent\` property to the parent element's ID:

\`\`\`tsx
const elements = {
  'container': {
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    label: 'Container',
    isContainer: true,
  },
  'child-1': {
    x: 70,
    y: 80,
    label: 'Child 1',
    parent: 'container', // Embedded in container
  },
};
\`\`\`

## Paper Options for Embedding

### \`embeddingMode\`

Enable automatic embedding on Paper by setting \`embeddingMode={true}\`. In this mode:
- Dragging an element and dropping it into another element makes the element below become the parent
- Dragging an element out of its parent automatically unembeds it

### \`validateEmbedding\`

Control which elements can be embedded into which other elements using the \`validateEmbedding\` callback:

\`\`\`tsx
<Paper
  embeddingMode
  validateEmbedding={(childView, parentView) => {
    // Only allow embedding into container elements
    return Boolean(parentView.model.prop('data/isContainer'));
  }}
/>
\`\`\`

## Behavior

When embedded:
- Children move with their parent when the parent is dragged
- The parent-child relationship is maintained in the graph model
- Use \`validateEmbedding\` to restrict which elements can act as containers

See the [JointJS Containers & Grouping documentation](https://docs.jointjs.com/learn/features/containers-and-grouping) for more details.
        `,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default = makeStory({
  component: Code,
  code: CodeRaw,
  name: 'Element Containers',
  description:
    'Shows a parent container with two embedded children. Uses `embeddingMode` for drag-and-drop embedding and `validateEmbedding` to restrict embedding to container elements only.',
});
