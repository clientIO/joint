/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { GraphProvider, Paper, type PortalElementRecord, type PortalLinkRecord } from '@joint/react';
import './code-with-create-links-classname.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
type ElementData = { label: string };
const initialElements: Record<string, PortalElementRecord<ElementData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
};

const initialEdges: Record<string, PortalLinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: PRIMARY,
    className: 'link',
  },
};

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider links={initialEdges} elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
