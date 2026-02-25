import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import NativeShapes from './code';
import NativeShapesRawCode from './code?raw';
import { makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof NativeShapes>;

export default {
  title: 'Examples/Built-in shapes',
  component: NativeShapes,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates how to use native [JointJS standard shapes](https://docs.jointjs.com/learn/features/shapes/built-in-shapes/standard) with @joint/react using custom selectors.

By default, @joint/react renders elements using a custom \`ReactElement\` type. To use native JointJS shapes (like \`standard.Rectangle\`, \`standard.Circle\`, etc.), you need to provide custom selectors that preserve the \`type\` property.

## Key Concept: Custom Selectors

\`\`\`tsx
// Define element type with native shape type
interface NativeElement extends GraphElement {
  type: string; // 'standard.Rectangle', 'standard.Circle', etc.
}

// Custom selector that preserves the 'type' property
const mapDataToElementAttributes = ({
  data,
  toAttributes,
}: ElementToGraphOptions<NativeElement>): dia.Cell.JSON => {
  return { ...toAttributes(), type: data.type };
};

// Pass to GraphProvider
<GraphProvider
  elements={elements}
  mapDataToElementAttributes={mapDataToElementAttributes}
>
  <Paper />
</GraphProvider>
\`\`\`

Refer to the [API reference](https://docs.jointjs.com/api/shapes/standard) for full configuration options.
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
