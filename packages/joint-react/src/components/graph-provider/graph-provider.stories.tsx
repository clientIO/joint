/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable @eslint-react/dom/no-missing-button-type */
/* eslint-disable @eslint-react/no-unstable-default-props */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { GraphProvider } from './graph-provider';
import { createElements, createLinks, type InferElement } from 'src/utils/create';
import { Paper, type RenderElement } from '../paper/paper';
import { dia } from '@joint/core';
import { ReactElement } from 'src/models/react-element';
import { HTMLNode } from '../html-node/html-node';
import { DirectedGraph } from '@joint/layout-directed-graph';

export type Story = StoryObj<typeof GraphProvider>;
export default {
  title: 'Components/GraphProvider',
  component: GraphProvider,
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
} satisfies Meta<typeof GraphProvider>;

const defaultElementsWithSize = createElements([
  { id: 1, width: 100, height: 50, x: 20, y: 200, data: { color: 'magenta' } },
  { id: 2, width: 100, height: 50, x: 200, y: 200, data: { color: 'cyan' } },
]);
const defaultElementsWithoutSize = createElements([
  { id: 1, x: 20, y: 200, data: { color: 'magenta' } },
  { id: 2, x: 200, y: 200, data: { color: 'cyan' } },
]);
const defaultLinks = createLinks([{ id: '1-1', source: 2, target: 1 }]);

type ElementType = InferElement<typeof defaultElementsWithSize>;

function PaperChildren(props: Readonly<{ renderElement?: RenderElement<ElementType> }>) {
  const {
    renderElement = ({ width, height, data: { color } }: ElementType) => (
      <rect width={width} height={height} fill={color} />
    ),
  } = props;
  return <Paper renderElement={renderElement} />;
}
export const Default: Story = {
  args: {
    defaultElements: defaultElementsWithSize,
    children: <PaperChildren />,
  },
};

export const WithExternalGraph: Story = {
  args: {
    defaultElements: defaultElementsWithSize,
    children: <PaperChildren />,
    graph: new dia.Graph({}, { cellNamespace: { ReactElement } }),
  },
};

export const WithLink: Story = {
  args: {
    defaultLinks,
    defaultElements: defaultElementsWithSize,
    children: <PaperChildren />,
  },
};

export const WithoutSizeDefinedInElements: Story = {
  args: {
    defaultLinks,
    defaultElements: defaultElementsWithoutSize,
    children: (
      <PaperChildren
        renderElement={() => (
          <HTMLNode style={{ padding: 10, backgroundColor: 'cyan' }}>Hello world!</HTMLNode>
        )}
      />
    ),
  },
};

const graph = new dia.Graph({}, { cellNamespace: { ReactElement } });

function generateaRandomElements(length: number) {
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
export const WithExternalGraphAndLayout: Story = {
  args: {
    graph,
    defaultElements: generateaRandomElements(5),
    children: (
      <>
        <button
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
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
        <PaperChildren
          renderElement={() => (
            <HTMLNode style={{ padding: 10, backgroundColor: 'cyan' }}>Hello world!</HTMLNode>
          )}
        />
      </>
    ),
  },
};
