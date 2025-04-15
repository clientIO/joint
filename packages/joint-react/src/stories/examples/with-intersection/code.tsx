/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  GraphProvider,
  MeasuredNode,
  Paper,
  useElements,
  useGraph,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import { g } from '@joint/core';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
  { id: '3', data: { label: 'Node 3' }, x: 200, y: 100 },
  { id: '4', data: { label: 'Node 4' }, x: 0, y: 100 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ResizableNode({ id, data: { label }, width, height }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const graph = useGraph();
  const isIntersected = useElements<BaseElementWithData, boolean>((elements) => {
    const element = graph.getCell(id);
    if (!element) {
      return false;
    }

    // g.intersection.exists(el1.getBBox, el2.getBBox())
    for (const [otherId, value] of elements) {
      const otherElement = graph.getCell(otherId);
      const box1 = element.getBBox();
      const box2 = otherElement.getBBox();
      const isIntersect = g.intersection.exists(box1, box2);
      if (value.id !== id && isIntersect) {
        return true;
      }
    }
    return false;
  });

  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div ref={nodeRef} className={`node ${isIntersected ? 'intersected' : ''}`}>
          {label}
        </div>
      </MeasuredNode>
    </foreignObject>
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
    <GraphProvider defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
