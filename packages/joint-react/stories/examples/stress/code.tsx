/* eslint-disable sonarjs/pseudo-random */
import { HTMLBox, GraphProvider, Paper, type CellRecord, type ElementRecord, type LinkRecord } from '@joint/react';
import { useCallback, useState, startTransition, type Dispatch, type SetStateAction } from 'react';

const X_NODES = 15;
const Y_NODES = 30;
const NODE_WIDTH = 80;
const NODE_HEIGHT = 30;
const RANDOM_SPREAD = 1500;

// Colors — unified dark diagram palette.
const LINK_COLOR = '#8697A6';

// Shared by every link, so the hundreds of them allocate a single style object.
const LINK_STYLE = { color: LINK_COLOR, dasharray: '5 2', width: 1 };

interface StressNodeData {
  readonly label: string;
}

function RenderElement({ label }: Readonly<StressNodeData>) {
  return (
    <HTMLBox useModelGeometry className="jj-node">
      {label}
    </HTMLBox>
  );
}

/** Build a grid of nodes chained together by links, to exercise rendering at scale. */
function buildInitialCells(xNodes: number, yNodes: number): ReadonlyArray<CellRecord<StressNodeData>> {
  const cells: Array<CellRecord<StressNodeData>> = [];
  let nodeId = 1;
  let edgeId = 1;
  let previousNodeId: number | null = null;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      cells.push({
        id: `stress-${nodeId}`,
        type: 'element',
        data: { label: `Node ${nodeId}` },
        position: { x: x * 100, y: y * 50 },
        size: { width: NODE_WIDTH, height: NODE_HEIGHT },
      } satisfies ElementRecord<StressNodeData>);

      if (previousNodeId !== null) {
        cells.push({
          id: `edge-${edgeId}`,
          type: 'link',
          source: { id: `stress-${previousNodeId}` },
          target: { id: `stress-${nodeId}` },
          z: -1,
          style: LINK_STYLE,
        } satisfies LinkRecord);
        edgeId++;
      }

      previousNodeId = nodeId;
      nodeId++;
    }
  }

  return cells;
}

const initialCells = buildInitialCells(X_NODES, Y_NODES);

function randomizePosition(cell: CellRecord<StressNodeData>): CellRecord<StressNodeData> {
  if (cell.type !== 'element') return cell;
  return {
    ...cell,
    position: { x: Math.random() * RANDOM_SPREAD, y: Math.random() * RANDOM_SPREAD },
  };
}

function Main({
  setCells,
}: Readonly<{
  setCells: Dispatch<SetStateAction<ReadonlyArray<CellRecord<StressNodeData>>>>;
}>) {
  const randomizePositions = useCallback(() => {
    startTransition(() => {
      setCells((previous) => previous.map(randomizePosition));
    });
  }, [setCells]);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn jj-btn--primary" onClick={randomizePositions}>
          Randomize positions
        </button>
      </div>
      {/* Zoomed out so the whole 450-node grid stays visible while it re-renders. */}
      <Paper className="min-h-0 flex-1" transform="scale(0.4)" renderElement={RenderElement} />
    </div>
  );
}

export default function App() {
  const [cells, setCells] = useState<ReadonlyArray<CellRecord<StressNodeData>>>(initialCells);

  return (
    <GraphProvider cells={cells} onCellsChange={setCells}>
      <Main setCells={setCells} />
    </GraphProvider>
  );
}
