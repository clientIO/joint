import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import CodeRaw from './code?raw';
import { makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Layers',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates how to organize elements and links into layers using the \`layer\` property.

## Key Concept: Graph Layers

Layers allow you to organize cells (elements and links) into logical groups that can be shown/hidden together or rendered in a specific order.

### Setting up Layers

Configure layers on the graph using the JointJS Graph API, then pass the graph to GraphProvider:

\`\`\`tsx
import { dia } from '@joint/core';

const graph = useMemo(() => {
  const g = new dia.Graph({}, {
    cellNamespace: { ...shapes, ReactElement },
  });
  // Add layers in render order (first added = rendered first = behind)
  g.addLayer({ id: 'background' });
  g.addLayer({ id: 'main' });
  g.addLayer({ id: 'foreground' });
  return g;
}, []);

<GraphProvider graph={graph} elements={elements} links={links}>
  ...
</GraphProvider>
\`\`\`

### Assigning Cells to Layers

Use the \`layer\` property on elements and links to assign them to a layer:

\`\`\`tsx
const elements = {
  'bg-element': {
    x: 20,
    y: 20,
    label: 'Background',
    layer: 'background', // Assigned to background layer
  },
};

const links = {
  'link-1': {
    source: 'main-element',
    target: 'another-element',
    layer: 'main',
    className: 'fade-in', // CSS class for animations
  },
};
\`\`\`

### Layer Visibility

Use Paper's \`cellVisibility\` option to show/hide cells based on their layer. Call \`paper.wakeUp()\` after toggling to refresh the view:

\`\`\`tsx
const storeRef = useRef<PaperStore>(null);

const toggleLayer = (layerId: string) => {
  setHiddenLayers((prev) => { ... });
  storeRef.current?.paper.wakeUp(); // Refresh the paper
};

<Paper
  ref={storeRef}
  cellVisibility={(cell) => {
    const cellLayer = cell.layer();
    return !hiddenLayers.has(cellLayer);
  }}
/>
\`\`\`

See the [JointJS Layers documentation](https://docs.jointjs.com/learn/release-notes/4.2.0#layers) for more details.
        `,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default = makeStory({
  component: Code,
  code: CodeRaw,
  name: 'Graph Layers',
  description:
    'Elements and links organized into background, main, and foreground layers. Toggle visibility with buttons and watch the fade-in animation when layers reappear.',
});
