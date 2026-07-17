import { type CellRecord, GraphProvider, Paper, selectElementSize, useCell } from '@joint/react';

const PRIMARY = '#ED2637';
const NODE_FILL = '#1c2836';

const initialCells: readonly CellRecord[] = [
  { id: '1', type: 'element', position: { x: 100, y: 15 }, size: { width: 130, height: 35 } },
  { id: '2', type: 'element', position: { x: 100, y: 200 }, size: { width: 130, height: 35 } },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY, width: 1 },
  },
];

function SizedRect() {
  const { width, height } = useCell(selectElementSize);
  return (
    <rect
      rx={10}
      ry={10}
      width={width}
      height={height}
      fill={NODE_FILL}
      stroke={PRIMARY}
      strokeWidth={2}
    />
  );
}

function Main() {
  return <Paper className="size-full" renderElement={SizedRect} />;
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
