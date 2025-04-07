/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { MeasuredNode } from './measured-node';
import { useElement } from '@joint/react/src/hooks/use-element';
import { PRIMARY } from '.storybook/theme';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';

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
  parameters: makeRootDocs({
    apiURL: API_URL,
    code: `import { MeasuredNode } from '@joint/react'
// This will automatically measure component size and update the parent node size
<MeasuredNode>
  <div style={{ width: 100, height: 50 }}>Content</div>
</MeasuredNode>
    `,
    description: `
Measured node component automatically detects the size of its \`children\` and updates the graph element (node) width and height automatically when elements resize.
It must be used inside \`renderElement\` context. 
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
