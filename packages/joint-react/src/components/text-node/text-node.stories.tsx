/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import type { Meta, StoryObj } from '@storybook/react';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { TextNode } from './text-node';
import { PRIMARY } from 'storybook-config/theme';
import { useElement } from '../../hooks';
import { MeasuredNode } from '../measured-node/measured-node';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';

const API_URL = getAPILink('TextNode', 'variables');
export type Story = StoryObj<typeof TextNode>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SVGDecorator(Story: any) {
  const { width, height } = useElement();

  return (
    <>
      <rect width={width} height={height} fill={PRIMARY} rx={10} ry={10} />
      <MeasuredNode
        setSize={({ element, size }) => {
          const padding = 20;
          element.set('size', {
            width: size.width + padding,
            height: size.height + padding,
          });
        }}
      >
        <g transform="translate(10, 10)">
          <Story />
        </g>
      </MeasuredNode>
    </>
  );
}

const meta: Meta<typeof TextNode> = {
  title: 'Components/TextNode',
  component: TextNode,
  decorators: [SVGDecorator, SimpleRenderItemDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **TextNode** component renders SVG text with automatic sizing and wrapping capabilities. It's designed to work seamlessly with MeasuredNode for dynamic text content.

**Key Features:**
- Renders SVG text elements
- Supports automatic text wrapping
- Integrates with MeasuredNode for dynamic sizing
- Supports all standard SVG text properties
    `,
    usage: `
\`\`\`tsx
import { TextNode, MeasuredNode } from '@joint/react';
import { useElement } from '@joint/react';

function RenderElement() {
  const { width, height } = useElement();
  return (
    <>
      <rect width={width} height={height} fill="blue" />
      <MeasuredNode>
        <g transform="translate(10, 10)">
          <TextNode fill="white" width={width - 20} textWrap>
            Your text content here
          </TextNode>
        </g>
      </MeasuredNode>
    </>
  );
}
\`\`\`
    `,
    props: `
- **children**: Text content to render
- **fill**: Text color
- **width**: Maximum width before wrapping
- **textWrap**: Enable automatic text wrapping
- **fontSize**: Text size (default: 14)
- And other standard SVG text properties
    `,
    code: `import { TextNode, MeasuredNode } from '@joint/react'

<MeasuredNode>
  <TextNode fill="white" width={100} textWrap>
    Hello world
  </TextNode>
</MeasuredNode>
    `,
  }),
};

export default meta;

export const Default = makeStory<Story>({
  args: {
    children: 'Hello world',
    fill: 'white',
    width: 19,
  },
  apiURL: API_URL,
  name: 'Measured div with exact size',
  description: 'Div with exact size.',
});

export const WithBreakText = makeStory<Story>({
  args: {
    children: 'Hello world Hello world',
    fill: 'white',
    width: 100,
    textWrap: true,
  },
  apiURL: API_URL,
  name: 'Measured div with exact size',
  description: 'Div with exact size.',
});

export const WithBreakTextWithoutDefinedWith = makeStory<Story>({
  args: {
    children: 'Hello world Hello world',
    fill: 'white',
    textWrap: true,
  },
  apiURL: API_URL,
  name: 'Measured div with exact size',
  description: 'Div with exact size.',
});

export const WithEllipsis = makeStory<Story>({
  args: {
    children: 'Hello world Hello world Hello world',
    fill: 'white',
    width: 100,
    textWrap: {
      ellipsis: true,
      maxLineCount: 1,
    },
  },
  apiURL: API_URL,
  name: 'Measured div with exact size',
  description: 'Div with exact size.',
});
