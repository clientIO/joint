import {
  GraphProvider,
  Paper,
  useGraph,
  useCells,
  HTMLBox,
  useOnElementsMeasured,
  type CellRecord,
  type ElementRecord,
  type Computed,
} from '@joint/react';
import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import type { dia } from '@joint/core';

const GAP = 20;

type ElementData = { label: string };

const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' } },
  { id: '2', type: 'element', data: { label: 'Node 2' } },
  { id: '3', type: 'element', data: { label: 'Node 3' } },
  { id: '4', type: 'element', data: { label: 'Node 4' } },
  { id: '5', type: 'element', data: { label: 'Node 5' } },
  { id: '6', type: 'element', data: { label: 'Node 6' } },
  { id: '7', type: 'element', data: { label: 'Node 7' } },
  { id: '8', type: 'element', data: { label: 'Node 8' } },
  { id: '9', type: 'element', data: { label: 'Node 9' } },
];

/** Arrange every element into a grid with the given number of columns. */
function layoutGrid(graph: dia.Graph, columns: number) {
  const cols = Math.max(1, columns);
  for (const [index, element] of graph.getElements().entries()) {
    const { width, height } = element.size();
    const col = index % cols;
    const row = Math.floor(index / cols);
    element.position(GAP + col * (width + GAP), GAP + row * (height + GAP));
  }
}

function Main() {
  const { graph, setCell } = useGraph<ElementRecord<ElementData>>();
  const [columns, setColumns] = useState(3);
  const nextIdRef = useRef(initialCells.length);

  // Re-run the grid layout every time an element is (re)measured.
  useOnElementsMeasured(() => layoutGrid(graph, columns));

  const elementCount = useCells<Computed<CellRecord>, number>((cells) => {
    let total = 0;
    for (const cell of cells) if (cell.type === 'element') total += 1;
    return total;
  });

  const renderElement = useCallback(
    (data: ElementData) => <HTMLBox className="jj-node">{data.label}</HTMLBox>,
    []
  );

  const handleColumns = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      setColumns(next);
      layoutGrid(graph, next);
    },
    [graph]
  );

  const addNode = useCallback(() => {
    nextIdRef.current += 1;
    setCell({ id: `${nextIdRef.current}`, type: 'element', data: { label: `Node ${elementCount + 1}` } });
  }, [elementCount, setCell]);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <label className="jj-field">
          <span className="jj-label">Elements per row</span>
          <input
            className="jj-input w-16"
            type="number"
            min={1}
            value={columns}
            onChange={handleColumns}
          />
        </label>
        <button type="button" className="jj-btn jj-btn--primary" onClick={addNode}>
          Add node
        </button>
      </div>
      <Paper className="min-h-0 flex-1" renderElement={renderElement} />
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
