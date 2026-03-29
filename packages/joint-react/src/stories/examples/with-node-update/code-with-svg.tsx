/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useElementSize, type PortalElementRecord, type PortalLinkRecord } from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

const initialElements: Record<string, PortalElementRecord> = {
  '1': { position: { x: 100, y: 15 }, size: { width: 130, height: 35 } },
  '2': { position: { x: 100, y: 200 }, size: { width: 130, height: 35 } },
};

const initialEdges: Record<string, PortalLinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: '#4f46e5',
    width: 1,
  },
};

function Element({ id, color }: Readonly<{ id: string; color: string }>) {
  const { setElement } = useGraph();
  return (
    <input
      className="nodrag"
      type="color"
      value={color}
      onChange={(event) =>
        setElement(id, (previous) => ({
          ...previous,
          data: { ...previous.data, color: event.target.value },
        }))
      }
    />
  );
}

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
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
