import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import NativeShapes from './code';
import NativeShapesRawCode from './code?raw';
import { makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof NativeShapes>;

export default {
  title: 'Examples/Native shapes',
  component: NativeShapes,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates how to use native [JointJS standard shapes](https://docs.jointjs.com/learn/features/shapes/built-in-shapes/standard) with @joint/react.

Pass plain \`CellRecord\` objects to \`GraphProvider\`'s \`initialCells\` prop. The \`type\` field (e.g. \`'standard.Rectangle'\`, \`'standard.Link'\`) selects the JointJS shape. \`CellRecord\` is generic over the allowed element/link \`type\` strings, so the value is type-checked at the call site.

## Usage

\`\`\`tsx
import { GraphProvider, Paper, type CellRecord } from '@joint/react';

type ElementType = 'standard.Rectangle' | 'standard.Circle' | 'standard.Ellipse';
type LinkType = 'standard.Link' | 'standard.DoubleLink';

const initialCells: ReadonlyArray<CellRecord<unknown, unknown, ElementType, LinkType>> = [
  {
    id: 'rect',
    position: { x: 20, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: '#4f46e5' }, label: { text: 'Rectangle' } },
  },
  {
    id: 'circle',
    position: { x: 150, y: 20 },
    size: { width: 60, height: 60 },
    type: 'standard.Circle',
    attrs: { body: { fill: '#6366f1' }, label: { text: 'Circle' } },
  },
  {
    id: 'link',
    source: { id: 'rect' },
    target: { id: 'circle' },
    type: 'standard.Link',
  },
];

<GraphProvider initialCells={initialCells}>
  <Paper />
</GraphProvider>
\`\`\`

Refer to the [API reference](https://docs.jointjs.com/api/shapes/standard) for full shape configuration options.
        `,
      },
    },
  },
} satisfies Meta<typeof NativeShapes>;

export const Default = makeStory({
  component: NativeShapes,
  code: NativeShapesRawCode,
  name: 'Native Shapes Showcase',
  apiURL: 'https://docs.jointjs.com/api/shapes/standard',
  description:
    'All native JointJS standard shapes in a single view: Rectangle, Circle, Ellipse, Cylinder, Path, Polygon, Polyline, TextBlock, HeaderedRectangle, Image variants, and native link types (Link, DoubleLink, ShadowLink).',
});
