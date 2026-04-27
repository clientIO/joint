/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  HTMLHost,
  Paper,
  type Cells,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

// define element type with custom properties
type ElementData = { label: string };

// Unified cells (elements + links in one array; each requires id + type)
const initialCells: Cells<ElementData> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Hello' },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'World' },
    position: { x: 100, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY, width: 2 },
  },
];

function RenderItem({ label }: ElementData) {
  return (
    <HTMLHost className="node" style={{ width: 100, height: 50 }}>
      {label}
    </HTMLHost>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderItem} />
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
