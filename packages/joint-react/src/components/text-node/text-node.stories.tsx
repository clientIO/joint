/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { makeRootDocumentation, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { TextNode } from './text-node';
import { PRIMARY } from 'storybook-config/theme';
import { useElement } from '../../hooks';
import { MeasuredNode } from '../measured-node/measured-node';

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
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    code: `
    import { TextNode } from '@joint/react'
    <TextNode
      fill="white"
      width={19}
      textWrap
      >
      Hello world
    </TextNode>
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
