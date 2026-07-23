import {
  GraphProvider,
  HTMLHost,
  Paper,
  useCell,
  useCellId,
  useCells,
  useGraph,
  usePaper,
} from '@joint/react';
import type { CellRecord, Computed, ElementRecord } from '@joint/react';
import { useCallback } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

const PRIMARY = '#ED2637';

const HANDLE_STYLE: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: -30,
  width: 10,
  height: 10,
  borderRadius: '100%',
  background: PRIMARY,
  transform: 'translate(-50%, -50%)',
  cursor: 'alias',
};

const HANDLE_LINE_STYLE: CSSProperties = {
  position: 'absolute',
  left: 4,
  top: 5,
  width: 2,
  height: 30,
  background: PRIMARY,
};

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
  const label = useCell((element: Computed<ElementRecord<NodeData>>) => element.data.label);
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
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
      const node = event.currentTarget;
      node.setPointerCapture(event.pointerId);
      node.addEventListener('pointermove', dragHandle);
    },
    [dragHandle]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const node = event.currentTarget;
      node.removeEventListener('pointermove', dragHandle);
      node.releasePointerCapture(event.pointerId);
    },
    [dragHandle]
  );

  return (
    <HTMLHost className="jj-node">
      <div style={HANDLE_STYLE} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <div style={HANDLE_LINE_STYLE} />
      </div>
      {label}
    </HTMLHost>
  );
}

function Main() {
  const { isElement } = useGraph<ElementRecord<NodeData>>();
  const angles = useCells<Computed<ElementRecord<NodeData>>, readonly string[]>((cells) =>
    cells
      .filter((cell) => isElement(cell))
      .map((cell) => {
        const element = cell as ElementRecord<NodeData>;
        return `${element.data.label}: ${element.angle ?? 0}°`;
      })
  );

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <span className="jj-label">Drag a node&apos;s handle to rotate it</span>
        {angles.map((angle) => (
          <span key={angle} className="jj-chip">
            {angle}
          </span>
        ))}
      </div>
      <Paper className="min-h-0 flex-1" renderElement={RotatableNode} />
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
