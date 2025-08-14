/* eslint-disable sonarjs/no-unused-vars */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable @eslint-react/dom/no-missing-button-type */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { GraphProvider } from './graph-provider';
import { createElements, createLinks, type InferElement, ReactElement } from '@joint/react';
import { Paper, type RenderElement } from '../paper/paper';
import { dia } from '@joint/core';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { makeRootDocumentation, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';

const API_URL = getAPILink('GraphProvider');

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Components/GraphProvider',
  component: GraphProvider,
  parameters: makeRootDocumentation({
    description: `
GraphProvider is a component that provides a graph context to its children. It is used to manage and render graph elements.
    `,
    apiURL: API_URL,
    code: `import { GraphProvider } from '@joint/react'
<GraphProvider>
  <Paper renderElement={({width, height}) => <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />} />
</GraphProvider>
    `,
  }),
};

export default meta;

const STYLE = { padding: 10, backgroundColor: PRIMARY, borderRadius: 10, width: 80 };

const initialElementsWithSize = createElements([
  { id: 1, width: 100, height: 50, x: 20, y: 200, color: PRIMARY },
  { id: 2, width: 100, height: 50, x: 200, y: 200, color: PRIMARY },
]);
const initialElementsWithoutSize = createElements([
  { id: 1, x: 20, y: 200, color: PRIMARY },
  { id: 2, x: 200, y: 200, color: PRIMARY },
]);
const initialLinks = createLinks([
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

type ElementType = InferElement<typeof initialElementsWithSize>;

function RenderElement({ color, width, height }: ElementType) {
  return <rect rx={10} ry={10} className="node" width={width} height={height} fill={color} />;
}
function PaperChildren(props: Readonly<{ renderElement?: RenderElement<ElementType> }>) {
  const { renderElement = RenderElement } = props;
  return <Paper className={PAPER_CLASSNAME} renderElement={renderElement} width={'100%'} />;
}

export const Default = makeStory<Story>({
  args: {
    initialElements: initialElementsWithSize,
    children: <PaperChildren />,
  },

  apiURL: API_URL,
  description: 'Default graph provider with rectangle children.',
});

export const WithExternalGraph = makeStory<Story>({
  args: {
    initialElements: initialElementsWithSize,
    children: <PaperChildren />,
    graph: new dia.Graph({}, { cellNamespace: { ReactElement } }),
  },

  apiURL: API_URL,
  description: 'Graph provider with external graph.',
  code: `import { GraphProvider } from '@joint/react'
import { dia } from '@joint/core';
import { Paper } from '../paper/paper';
import { ReactElement } from '@joint/react/src/core/react-element';
const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
<GraphProvider graph={graph}>
  <Paper renderElement={({width, height}) => <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />} />
</GraphProvider>
  `,
});

export const WithLink = makeStory<Story>({
  args: {
    initialLinks,
    initialElements: initialElementsWithSize,
    children: <PaperChildren />,
  },

  apiURL: API_URL,
  description: 'Graph provider with links.',
});

export const WithoutSizeDefinedInElements = makeStory<Story>({
  args: {
    initialLinks,
    initialElements: initialElementsWithoutSize,
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
      color: 'magenta',
    }))
  );
}

export const WithExternalGraphAndLayout = makeStory<Story>({
  args: {
    graph,
    initialElements: generateRandomElements(20),
    children: (
      <>
        <button
          className={BUTTON_CLASSNAME}
          onClick={() => {
            const elements = graph.getCells(); // Get all elements in the graph
            const rowWidth = 500; // Define the maximum width of each row
            let currentX = 0;
            let currentY = 0;
            let rowWidthUsed = 0;

            for (const [_, element] of elements.entries()) {
              const elementWidth = 100; // Set width for the element (you can use element.getBBox().width if dynamic)
              if (rowWidthUsed + elementWidth > rowWidth) {
                // Move to the next row
                currentX = 0;
                currentY += 85; // Add some vertical space between rows
                rowWidthUsed = 0;
              }
              if (!element.isElement()) {
                continue;
              }

              // Set the new position for the element
              element.position(currentX, currentY);

              // Update the current X and row width used
              currentX += elementWidth;
              rowWidthUsed += elementWidth;
            }
          }}
        >
          Make layout
        </button>
        <PaperChildren renderElement={() => <HTMLNode style={STYLE}>Hello world!</HTMLNode>} />
      </>
    ),
  },

  apiURL: API_URL,
  description: 'Graph provider with external graph and layout.',
  code: `import { GraphProvider } from '@joint/react'
import { dia } from '@joint/core';
import { Paper } from '../paper/paper';
import { ReactElement } from '@joint/react/src/core/react-element';
import { DirectedGraph } from '@joint/layout-directed-graph';
const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });
const elements = generateRandomElements(20);
<GraphProvider graph={graph} initialElements={elements}>
  <button
    onClick={() => {
      DirectedGraph.layout(graph, {
        setLinkVertices: true,
        marginX: 2,
        marginY: 2,
        align: 'DR',
      });
    }
  >
    Make layout
  </button>
  <Paper renderElement={({ width, height }) => <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />} />
</GraphProvider>
  `,
});

const initialElements = createElements([
  { id: 1, width: 100, height: 50, x: 20, y: 200, color: PRIMARY, type: 'ReactElement' },
  { id: 2, width: 100, height: 50, x: 200, y: 200, color: PRIMARY, type: 'ReactElement' },
]);

export const WithCustomType = makeStory<Story>({
  args: {
    initialLinks,
    initialElements,
    children: <PaperChildren />,
  },

  apiURL: API_URL,
  description: 'Graph provider with links.',
});
