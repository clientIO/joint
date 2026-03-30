/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  HTMLHost,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

// define element type with custom properties
type ElementData = { label: string };

// define initial elements as Record
const initialElements: Record<string, ElementRecord<ElementData>> = {
  '1': { data: { label: 'Hello' }, position: { x: 100, y: 15 }, size: { width: 100, height: 50 } },
  '2': { data: { label: 'World' }, position: { x: 100, y: 200 }, size: { width: 100, height: 50 } },
};

// define initial edges as Record
const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY, width: 2 },
  },
};
function RenderItem({ label }: Readonly<ElementData>) {
  return <HTMLHost className="node">{label}</HTMLHost>;
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
    <GraphProvider links={initialEdges} elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
