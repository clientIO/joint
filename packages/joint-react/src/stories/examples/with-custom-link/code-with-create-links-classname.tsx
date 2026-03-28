/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { GraphProvider, Paper, type Element, type Link } from '@joint/react';
import './code-with-create-links-classname.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
type ElementData = { label: string };
const initialElements: Record<string, Element<ElementData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
};

const initialEdges: Record<string, Link> = {
  'e1-2': {
    source: '1',
    target: '2',
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
