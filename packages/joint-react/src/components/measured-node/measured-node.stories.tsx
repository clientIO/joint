/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { MeasuredNode } from './measured-node';
import { PRIMARY } from 'storybook-config/theme';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { useElement } from '../../hooks';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';

const API_URL = getAPILink('MeasuredNode', 'variables');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ForeignObjectDecorator(Story: any) {
  const { width, height } = useElement();
  return (
    <foreignObject overflow="visible" width={width} height={height}>
      <Story />
    </foreignObject>
  );
}
export type Story = StoryObj<typeof MeasuredNode>;

const meta: Meta<typeof MeasuredNode> = {
  title: 'Components/MeasuredNode',
  component: MeasuredNode,
  decorators: [ForeignObjectDecorator, SimpleRenderItemDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **MeasuredNode** component automatically measures the size of its children and updates the parent element's dimensions in the graph. This is essential for HTML content where the size is determined by the content itself.

**Key Features:**
- Automatically measures child component dimensions
- Updates element size in the graph when content changes
- Supports custom size calculation via \`setSize\` prop
- Must be used inside \`renderElement\` within a \`<foreignObject>\`
    `,
    usage: `
\`\`\`tsx
import { MeasuredNode } from '@joint/react';

function RenderElement({ width, height }) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div style={{ padding: 10 }}>
          Dynamic content that determines size
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}
\`\`\`
    `,
    props: `
- **children**: React node to measure (required)
- **setSize**: Optional callback to customize size calculation
  - Receives: \`{ element, size }\` where size is the measured dimensions
  - Can modify the size before it's applied to the element
    `,
    code: `import { MeasuredNode } from '@joint/react'

<foreignObject width={width} height={height}>
  <MeasuredNode>
    <div style={{ padding: 10 }}>Content</div>
  </MeasuredNode>
</foreignObject>
    `,
  }),
};

export default meta;

export const DivWithExactSize = makeStory<Story>({
  args: {
    children: (
      <div style={{ width: 100, height: 50, backgroundColor: PRIMARY, borderRadius: 10 }} />
    ),
  },
  apiURL: API_URL,
  name: 'Measured div with exact size',
  description: 'Div with exact size.',
});

export const DivWithPaddingAndText = makeStory<Story>({
  args: {
    children: (
      <div
        style={{
          padding: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: PRIMARY,
          borderRadius: 10,
        }}
      >
        Hello world!
      </div>
    ),
  },
  apiURL: API_URL,
  name: 'Measured div with padding and text',
  description: 'Div with padding and text content.',
});

export const TailwindSizing = makeStory<Story>({
  args: {
    children: (
      <div className="flex items-center justify-center text-center bg-primary rounded-lg p-2 bg-red-500">
        Hello world!
      </div>
    ),
  },
  apiURL: API_URL,
  name: 'Tailwind sizing',
  description: 'Div with tailwind classes.',
});
