/* eslint-disable sonarjs/pseudo-random */
import {
  HTMLBox,
  GraphProvider,
  Paper,
  type Cells,
  type CellRecord,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import '../index.css';
import React, { useCallback, useState, startTransition } from 'react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

interface StressNodeData {
  readonly label: string;
  readonly fontSize: number;
}

const RENDER_ELEMENT_STYLE: React.CSSProperties = {
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function RenderElement(data: StressNodeData) {
  return <HTMLBox useModelGeometry style={RENDER_ELEMENT_STYLE}>{data.label}</HTMLBox>;
}

function buildInitialCells(xNodes = 15, yNodes = 30): Cells<StressNodeData> {
  const cells: Array<CellRecord<StressNodeData>> = [];
  let nodeId = 1;
  let edgeId = 1;
  let recentNodeId: number | null = null;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      const id = `stress-${nodeId.toString()}`;
      cells.push({
        id,
        type: 'element',
        data: { label: `Node ${nodeId}`, fontSize: 11 },
        position: { x: x * 100, y: y * 50 },
        size: { width: 80, height: 30 },
      } satisfies ElementRecord<StressNodeData>);

      if (recentNodeId !== null && nodeId <= xNodes * yNodes) {
        cells.push({
          id: `edge-${edgeId.toString()}`,
          type: 'link',
          source: { id: `stress-${recentNodeId.toString()}` },
          target: { id: `stress-${nodeId.toString()}` },
          z: -1,
          style: { color: '#999999', dasharray: '5 2', width: 1 },
        } satisfies LinkRecord);
        edgeId++;
      }

      recentNodeId = nodeId;
      nodeId++;
    }
  }

  return cells;
}

const initialCells = buildInitialCells(15, 30);

function Main({
  setCells,
}: Readonly<{
  setCells: React.Dispatch<React.SetStateAction<Cells<StressNodeData>>>;
}>) {
  const randomizePosition = useCallback(
    (cell: CellRecord<StressNodeData>): CellRecord<StressNodeData> => {
      if (cell.type !== 'element') return cell;
      return {
        ...(cell as ElementRecord<StressNodeData>),
        position: { x: Math.random() * 1500, y: Math.random() * 1500 },
      };
    },
    []
  );
  const updatePos = useCallback(() => {
    startTransition(() => {
      setCells((previous) => previous.map(randomizePosition));
    });
  }, [setCells, randomizePosition]);

  return (
    <div className="flex flex-row relative">
      <Paper id="main-view" className={PAPER_CLASSNAME} height={600} renderElement={RenderElement}/>
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={updatePos}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          change pos
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [cells, setCells] = useState<Cells<StressNodeData>>(initialCells);

  return (
    <GraphProvider<StressNodeData> cells={cells} onCellsChange={setCells}>
      <Main setCells={setCells} />
    </GraphProvider>
  );
}
