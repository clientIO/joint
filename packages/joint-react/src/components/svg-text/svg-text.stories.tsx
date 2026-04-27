import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { SVGText } from './svg-text';
import { PRIMARY } from 'storybook-config/theme';
import { useMeasureNode } from '../../hooks/use-measure-node';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';

const API_URL = getAPILink('SVGText', 'variables');
export type Story = StoryObj<typeof SVGText>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SVGDecorator(Story: any) {
  const gRef = React.useRef<SVGGElement>(null);
  const { width, height } = useMeasureNode(gRef, {
    transform: ({ x, y, width: measuredWidth, height: measuredHeight }) => ({
      x: x - PADDING,
      y: y - PADDING,
      width: measuredWidth + PADDING * 2,
      height: measuredHeight + PADDING * 2,
    }),
  });

  const PADDING = 10;
  return (
    <>
      <rect width={width} height={height} fill={PRIMARY} rx={PADDING} ry={PADDING} />
      <g ref={gRef} transform={`translate(${PADDING}, ${PADDING})`}>
        <Story />
      </g>
    </>
  );
}

const meta: Meta<typeof SVGText> = {
  title: 'Components/SVGText',
  component: SVGText,
  decorators: [SVGDecorator, SimpleRenderItemDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **SVGText** component renders SVG text with automatic sizing and wrapping capabilities. It's designed to work seamlessly with \`useMeasureNode\` hook for dynamic text content.

**Key Features:**
- Renders SVG text elements
- Supports automatic text wrapping
- Integrates with \`useMeasureNode\` hook for dynamic sizing
- Supports all standard SVG text properties
    `,
    usage: `
\`\`\`tsx
import { SVGText, useMeasureNode, useElement, selectElementSize } from '@joint/react';
import { useRef } from 'react';

function RenderElement() {
  const { width, height } = useElement(selectElementSize);
  const gRef = useRef<SVGGElement>(null);
  useMeasureNode(gRef);
  return (
    <>
      <rect width={width} height={height} fill="blue" />
      <g ref={gRef} transform="translate(10, 10)">
        <SVGText fill="white" width={width - 20} textWrap>
          Your text content here
        </SVGText>
      </g>
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
    code: `import { SVGText, useMeasureNode } from '@joint/react'
import { useRef } from 'react';

const gRef = useRef<SVGGElement>(null);
useMeasureNode(gRef);

<g ref={gRef}>
  <SVGText fill="white" width={100} textWrap>
    Hello world
  </SVGText>
</g>
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
