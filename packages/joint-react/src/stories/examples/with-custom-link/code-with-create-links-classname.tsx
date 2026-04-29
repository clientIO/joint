/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { type CellRecord, GraphProvider, Paper } from '@joint/react';
import './code-with-create-links-classname.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

type ElementData = { label: string };

const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY, className: 'link' },
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
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
