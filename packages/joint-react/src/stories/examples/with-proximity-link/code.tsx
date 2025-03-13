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
      type: 'asd',
      attrs: {
        line: {
          stroke: 'cyan', // Set stroke color
          strokeWidth: 10, // Set stroke width
          strokeDasharray: '5,5', // Makes the line da
        },
      },
    });
  }
}

function areTwoElementsClose(
  element1: BaseElementWithData,
  element2: BaseElementWithData,
  closeDistance = 10
) {
  const x1 = element1.x;
  const y1 = element1.y;
  const x2 = element2.x;
  const y2 = element2.y;
  const width1 = element1.width ?? 0;
  const height1 = element1.height ?? 0;
  const width2 = element2.width ?? 0;
  const height2 = element2.height ?? 0;

  return (
    x1 < x2 + width2 + closeDistance &&
    x1 + width1 + closeDistance > x2 &&
    y1 < y2 + height2 + closeDistance &&
    y1 + height1 + closeDistance > y2
  );
}

const BE_CLOSE_DISTANCE = 25;
function getLinkId(id: string, closeId: string | null) {
  return `${id}-${closeId}`;
}
function ResizableNode({ id, data: { label } }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const closeId = useElements<BaseElementWithData, string | null>((elements) => {
    const element = elements.get(id);
    if (!element) {
      return null;
    }
    for (const [, value] of elements) {
      if (value.id !== id && areTwoElementsClose(element, value, BE_CLOSE_DISTANCE)) {
        return value.id;
      }
    }
    return null;
  });

  const graph = useGraph();

  useEffect(() => {
    if (!closeId) {
      return;
    }
    const linkId = getLinkId(id, closeId);
    const link = new DashedLink({
      id: linkId,
      source: { id },
      target: { id: closeId },
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
