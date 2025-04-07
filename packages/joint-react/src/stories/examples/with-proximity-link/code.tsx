/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  GraphProvider,
  HTMLNode,
  Paper,
  useElements,
  useGraph,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useEffect, useRef } from 'react';
import { shapes, util } from '@joint/core';
import { PRIMARY } from '.storybook/theme';
import type { dia } from '../../../../../joint-core/types';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
  { id: '3', data: { label: 'Node 3' }, x: 200, y: 100 },
  { id: '4', data: { label: 'Node 4' }, x: 0, y: 100 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

class DashedLink extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(super.defaults, {
      type: 'link',
      attrs: {
        line: {
          stroke: PRIMARY, // Set stroke color
          strokeWidth: 10, // Set stroke width
          strokeDasharray: '5,5', // Makes the line da
        },
      },
    });
  }
}

const BE_CLOSE_DISTANCE = 100;
function getLinkId(id: dia.Cell.ID | null, closeId: dia.Cell.ID | null) {
  return `${id}-${closeId}`;
}

function ResizableNode({ id, data: { label } }: Readonly<BaseElementWithData>) {
  const graph = useGraph();
  const nodeRef = useRef<HTMLDivElement>(null);

  const closeId = useElements<BaseElementWithData, dia.Cell.ID | null>((elements) => {
    const element = graph.getCell(id);
    if (!element) {
      return null;
    }
    for (const [otherId, value] of elements) {
      const otherElement = graph.getCell(otherId);
      const box1 = element.getBBox();
      const box2 = otherElement.getBBox();
      const isClose = box1.center().distance(box2.center()) <= BE_CLOSE_DISTANCE;
      if (otherElement.id !== element.id && isClose) {
        return value.id;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!closeId) {
      return;
    }
    const linkId = getLinkId(id, closeId);
    const link = new DashedLink({
      id: linkId,
      source: { id },
      target: { id: closeId },
      attrs: {
        line: {
          stroke: PRIMARY,
          strokeDasharray: '5,5',
        },
      },
    });
    graph?.addCell(link);
  }, [closeId, graph, id]);

  return (
    <HTMLNode
      onMouseUp={() => {
        graph.removeCells(graph.getLinks());
      }}
      ref={nodeRef}
      className="node"
    >
      {label}
    </HTMLNode>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={ResizableNode} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements} cellNamespace={{ DashedLink }}>
      <Main />
    </GraphProvider>
  );
}
