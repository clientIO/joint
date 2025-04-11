/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { HTMLNode } from './html-node';
import { PRIMARY } from 'storybook/theme';
import type { CSSProperties } from 'react';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';

const API_URL = getAPILink('HTMLNode', 'variables');

export type Story = StoryObj<typeof HTMLNode>;
const meta: Meta<typeof HTMLNode> = {
  title: 'Components/HTMLNode',
  component: HTMLNode,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocs({
    description: `
HTMLNode is a component wrapper around \`foreignObject\` and \`measuredNode\` element with \`HTML\` element inside.
    `,
    apiURL: API_URL,
    code: `import { HTMLNode } from '@joint/react'
// This will automatically measure component size and set the HTMLElement size
<HTMLNode>
  Content of div
</HTMLNode>
    `,
  }),
};

const STYLE: CSSProperties = {
  width: 100,
  height: 35,
  backgroundColor: PRIMARY,
  borderRadius: 10,
};
export default meta;

export const DivWithAutoSize = makeStory<Story>({
  args: {
    style: STYLE,
  },
  name: 'Rectangle',
  apiURL: API_URL,
  description: 'A rectangle with a label.',
});

export const DivWithAutoSizeAndPadding = makeStory<Story>({
  args: {
    style: { ...STYLE, padding: 10 },
  },
  name: 'Div with auto size and padding',
  apiURL: API_URL,
  description: 'Div with automatic measured size and padding.',
});

export const DivWithSizedChildren = makeStory<Story>({
  args: {
    children: <div style={STYLE} />,
  },
  name: 'Div with sized children',
  apiURL: API_URL,
  description: 'Div with a child div element with a specific size.',
});
