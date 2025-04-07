/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  useElements,
  useSetElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useEffect, useRef } from 'react';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { PRIMARY } from '.storybook/theme';

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

function ResizableNode({ data, id }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const setRotation = useSetElement(id, 'angle');
  useEffect(() => {
    if (!nodeRef.current) {
      return;
    }

    const selection = select(nodeRef.current);
    const dragHandler = drag().on('drag', (event) => {
      const offset = 60;
      const dx = event.x - offset;
      const dy = event.y - offset;
      const rad = Math.atan2(dx, dy);
      const deg = rad * (180 / Math.PI);

      setRotation(180 - deg);
    });

    selection.call(dragHandler as never);
  }, [setRotation]);

  return (
    <HTMLNode className="node">
      <div className="rotatable-node__handle" ref={nodeRef} />
      {data.label}
    </HTMLNode>
  );
}

function Main() {
  const elementRotation = useElements((items) =>
    items.map(({ angle }) => `${angle?.toFixed(2)} deg`)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={ResizableNode} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      >
        NodeID,Width, Height:
        {elementRotation.map((position, index) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <div key={`${index}-${position}`} style={{ marginLeft: 10 }}>
            {index}, {position}
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
