/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  GraphProvider,
  Paper,
  type Cells,
} from '@joint/react';
type ElementData = { label: string };
const initialCells: Cells<ElementData> = [
  {
    id: '1',
    type: 'ElementModel',
    data: { label: 'Node 1' },
    position: { x: 100, y: 15 },
  },
  {
    id: '2',
    type: 'ElementModel',
    data: { label: 'Node 2' },
    position: { x: 100, y: 200 },
  },
  {
    id: 'e1-2',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY, width: 2, dasharray: '5,5' },
  },
];

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider<ElementData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
