/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable @eslint-react/dom/no-missing-button-type */
/* eslint-disable @eslint-react/no-unstable-default-props */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { GraphProvider } from './graph-provider';
import { createElements, createLinks, type InferElement, ReactElement } from '@joint/react';
import { Paper, type RenderElement } from '../paper/paper';
import { dia } from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';
import { PRIMARY } from 'storybook-config/theme';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';

const API_URL = getAPILink('GraphProvider');

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Components/GraphProvider',
  component: GraphProvider,
  parameters: makeRootDocs({
    description: `
GraphProvider is a component that provides a graph context to its children. It is used to manage and render graph elements.
    `,
    apiURL: API_URL,
    code: `import { GraphProvider } from '@joint/react'
<GraphProvider>
  <Paper renderElement={() => <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />} />
</GraphProvider>
    `,
  }),
};

export default meta;

const STYLE = { padding: 10, backgroundColor: PRIMARY, borderRadius: 10 };

const defaultElementsWithSize = createElements([
  { id: 1, width: 100, height: 50, x: 20, y: 200, data: { color: PRIMARY } },
  { id: 2, width: 100, height: 50, x: 200, y: 200, data: { color: PRIMARY } },
]);
const defaultElementsWithoutSize = createElements([
  { id: 1, x: 20, y: 200, data: { color: PRIMARY } },
  { id: 2, x: 200, y: 200, data: { color: PRIMARY } },
]);
const defaultLinks = createLinks([
  {
    id: '1-1',
    source: 2,
    target: 1,
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type ElementType = InferElement<typeof defaultElementsWithSize>;

function PaperChildren(props: Readonly<{ renderElement?: RenderElement<ElementType> }>) {
  const {
    renderElement = ({ width, height, data: { color } }: ElementType) => (
      <rect rx={10} ry={10} width={width} height={height} fill={color} />
    ),
  } = props;
  return <Paper renderElement={renderElement} />;
}

export const Default = makeStory<Story>({
  args: {
    defaultElements: defaultElementsWithSize,
    children: <PaperChildren />,
  },

  apiURL: API_URL,
  description: 'Default graph provider with rectangle children.',
});

export const WithExternalGraph = makeStory<Story>({
  args: {
    defaultElements: defaultElementsWithSize,
    children: <PaperChildren />,
    graph: new dia.Graph({}, { cellNamespace: { ReactElement } }),
  },

  apiURL: API_URL,
  description: 'Graph provider with external graph.',
});

export const WithLink = makeStory<Story>({
  args: {
    defaultLinks,
    defaultElements: defaultElementsWithSize,
    children: <PaperChildren />,
  },

  apiURL: API_URL,
  description: 'Graph provider with links.',
});

export const WithoutSizeDefinedInElements = makeStory<Story>({
  args: {
    defaultLinks,
    defaultElements: defaultElementsWithoutSize,
    children: (
      <PaperChildren renderElement={() => <HTMLNode style={STYLE}>Hello world!</HTMLNode>} />
    ),
  },

  apiURL: API_URL,
  description: 'Graph provider without size defined in elements.',
});

const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });

function generateRandomElements(length: number) {
  return createElements(
    Array.from({ length }, (_, index) => ({
      id: `node-${index}`,
      width: 100,
      height: 50,
      x: Math.random() * 500,
      y: Math.random() * 500,
      data: { color: 'magenta' },
    }))
  );
}

export const WithExternalGraphAndLayout = makeStory<Story>({
  args: {
    graph,
    defaultElements: generateRandomElements(20),
    children: (
      <>
        <button
          onClick={() => {
            DirectedGraph.layout(graph, {
              setLinkVertices: true,
              marginX: 5,
              marginY: 5,
              align: 'DR',
            });
          }}
        >
          Layout
        </button>
        <PaperChildren renderElement={() => <HTMLNode style={STYLE}>Hello world!</HTMLNode>} />
      </>
    ),
  },

  apiURL: API_URL,
  description: 'Graph provider with external graph and layout.',
});
