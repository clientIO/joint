/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// We have pre-loaded tailwind css
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  type InferElement,
} from '@joint/react';
import { dia } from '@joint/core';
import { PRIMARY } from '.storybook/theme';
const NUMBER_OF_NODES = 2;

function generateNodesAndLinks(numberOfNodes: number) {
  const nodes = [];
  const links = [];
  const offsetY = 250;
  const offsetX = 250;
  for (let index = 0; index < numberOfNodes; index++) {
    const x = index * offsetX;
    const y = index * offsetY;
    const id = `node${index}`;
    nodes.push({
      id,
      data: { title: `Node ${index}`, description: `Description ${index}` },
      x,
      y,
    });
    if (index > 0) {
      links.push({
        id: `link${index - 1}`,
        source: `node${index - 1}`,
        target: `node${index}`,
        type: 'standard.Link',
        attrs: {
          line: {
            class: 'jj-flow-line',
            stroke: PRIMARY,
            strokeWidth: 4,
          },
        },
      });
    }
  }
  return { nodes: createElements(nodes), links: createLinks(links) };
}

const { nodes, links } = generateNodesAndLinks(NUMBER_OF_NODES);

type NodeType = InferElement<typeof nodes>;

function RenderElement({ data: { title, description } }: NodeType) {
  return (
    <HTMLNode className="text-white h-40 w-100 bg-white rounded-lg shadow-md text-black px-4 py-2 flex flex-col border border-gray-300">
      <div className="flex flex-1 flex-col">
        <div className="text-black text-bold text-lg">{title}</div>
        <div className="text-black">{description}</div>
      </div>
    </HTMLNode>
  );
}

function Main() {
  return (
    <Paper
      gridSize={5}
      isTransformToFitContentEnabled
      height={600}
      width={900}
      renderElement={RenderElement}
      scrollWhileDragging
      sorting={dia.Paper.sorting.APPROX}
      snapLabels
      clickThreshold={10}
      interactive={{ linkMove: false }}
      defaultConnectionPoint={{
        name: 'boundary',
        args: {
          offset: 10,
          extrapolate: true,
        },
      }}
      defaultRouter={{ name: 'rightAngle', args: { margin: 20 } }}
      defaultConnector={{
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true },
      }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={nodes} defaultLinks={links}>
      <Main />
    </GraphProvider>
  );
}
