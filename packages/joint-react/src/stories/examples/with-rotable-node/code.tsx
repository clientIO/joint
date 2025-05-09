/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  useElements,
  usePaper,
  useUpdateElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useCallback } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 20, y: 100 },
  { id: '2', label: 'Node 2', x: 200, y: 100 },
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

function RotatableNode({ label, id, width, height }: Readonly<BaseElementWithData>) {
  const paper = usePaper();
  const setRotation = useUpdateElement(id, 'angle');

  const dragHandle = useCallback(
    (event: PointerEvent) => {
      const graph = paper.model;
      const point = paper.clientToLocalPoint(event.clientX, event.clientY);
      const center = graph.getCell(id).getBBox().center();
      const deg = center.angleBetween(point, center.clone().offset(0, -1));
      setRotation(Math.round(deg));
    },
    [id, paper, setRotation]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      const node = event.currentTarget as HTMLDivElement;
      if (!node) {
        return;
      }
      node.setPointerCapture(event.pointerId);
      node.addEventListener('pointermove', dragHandle);
    },
    [dragHandle]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      const node = event.currentTarget as HTMLDivElement;
      if (!node) {
        return;
      }
      node.removeEventListener('pointermove', dragHandle);
      node.releasePointerCapture(event.pointerId);
    },
    [dragHandle]
  );

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <MeasuredNode>
        <div className="node">
          <div
            className="rotatable-node__handle"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          />
          {label}
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
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RotatableNode} />
      <div>
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
    <GraphProvider initialElements={initialElements} initialLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
