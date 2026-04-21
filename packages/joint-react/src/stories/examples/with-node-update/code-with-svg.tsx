/* eslint-disable react-perf/jsx-no-new-object-as-prop */
 
import { GraphProvider, Paper, useElementSize, type ElementRecord, type LinkRecord } from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const initialElements: Record<string, ElementRecord> = {
  '1': { position: { x: 100, y: 15 }, size: { width: 130, height: 35 } },
  '2': { position: { x: 100, y: 200 }, size: { width: 130, height: 35 } },
};

const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: '#4f46e5',
    width: 1,
  },
};

function RenderElement() {
  const { width, height } = useElementSize();
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
    <GraphProvider initialElements={initialElements} initialLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
