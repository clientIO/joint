/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  type CellRecord,
  GraphProvider,
  HTMLHost,
  Paper,
  useCell,
  useCellId,
  useCells,
  useGraph,
  usePaper,
  type ElementRecord,
  type Internal,
} from '@joint/react';
import '../index.css';
import { useCallback } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 20, y: 100 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 200, y: 100 } },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

function RotatableNode() {
  const label = useCell((element: Internal<ElementRecord<NodeData>>) => element.data.label);
  const id = useCellId();
  const { paper } = usePaper();
  const { setCell } = useGraph();

  const dragHandle = useCallback(
    (event: PointerEvent) => {
      if (!paper) return;
      const graph = paper.model;
      const point = paper.clientToLocalPoint(event.clientX, event.clientY);
      const cell = graph.getCell(id);
      if (!cell) return;
      const center = cell.getBBox().center();
      const deg = center.angleBetween(point, center.clone().offset(0, -1));
      setCell({ id, angle: Math.round(deg) } as ElementRecord<NodeData>);
    },
    [id, paper, setCell]
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
    <HTMLHost className="rotatable-node">
      <div
        className="rotatable-node__handle"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      {label}
    </HTMLHost>
  );
}

function Main() {
  const { isElement } = useGraph<ElementRecord<NodeData>>();
  const elementRotation = useCells<Internal<ElementRecord<NodeData>>, readonly string[]>((cells) =>
    cells
      .filter((cell) => isElement(cell))
      .map((cell) => {
        const element = cell as ElementRecord<NodeData>;
        return `${(element.angle ?? 0).toString().padStart(3, '0')} deg`;
      })
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RotatableNode} />
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
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
