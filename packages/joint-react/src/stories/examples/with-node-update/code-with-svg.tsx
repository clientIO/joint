/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import {
  type DiaCellRecord,
  GraphProvider,
  useCell,
  Paper,
  selectElementSize,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const initialCells: readonly DiaCellRecord[] = [
  {
    id: '1',
    type: 'element',
    position: { x: 100, y: 15 },
    size: { width: 130, height: 35 },
  },
  {
    id: '2',
    type: 'element',
    position: { x: 100, y: 200 },
    size: { width: 130, height: 35 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    color: '#4f46e5',
    width: 1,
  },
];

function RenderElement() {
  const { width, height } = useCell(selectElementSize);
  return (
    <rect
      rx={10}
      ry={10}
      className="node"
      width={width}
      height={height}
      fill="white"
      stroke="#4f46e5"
    />
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
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
