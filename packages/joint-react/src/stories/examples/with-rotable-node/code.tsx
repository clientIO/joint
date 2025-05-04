/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  useElements,
  usePaper,
  useSetElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useEffect, useRef } from 'react';
import { PRIMARY } from 'storybook-config/theme';
import { g } from '@joint/core';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 20, y: 100 },
  { id: '2', data: { label: 'Node 2' }, x: 200, y: 100 },
]);

const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RotatableNode({ data, id, width, height }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const paper = usePaper();

  const setRotation = useSetElement(id, 'angle');

  useEffect(() => {

    const node = nodeRef.current;
    if (!node) return;

    const dragHandle = function (event: PointerEvent) {
      const graph = paper.model;
      const point = paper.clientToLocalPoint(event.clientX, event.clientY);
      const center = graph.getCell(id).getBBox().center();
      const deg = center.angleBetween(point, center.clone().offset(0, -1));
      setRotation(Math.round(deg));
    }

    node.addEventListener('mousedown', (event) => {
      // Prevent the default action of the mousedown event
      // to avoid starting a drag operation on the node.
      event.stopPropagation();
    });

    node.addEventListener('pointerdown', (event) => {
      node.setPointerCapture(event.pointerId);
      node.addEventListener('pointermove', dragHandle);
    });

    node.addEventListener('pointerup', (event) => {
      node.removeEventListener('pointermove', dragHandle);
      node.releasePointerCapture(event.pointerId);
    });

  }, [setRotation]);

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <MeasuredNode>
        <div className="node">
          <div className="rotatable-node__handle" ref={nodeRef} />
          {data.label}
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}

function Main() {
  const elementRotation = useElements((items) =>
    items.map(({ angle }) => `${angle.toString().padStart(3, '0')} deg`)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={RotatableNode} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      >
        <u>angle</u>
        {elementRotation.map((rotation, index) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <div key={`${index}-${rotation}`} style={{ marginLeft: 10 }}>
            {index + 1}. {rotation}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
