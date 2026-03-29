/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { GraphProvider, Paper, useElementSize, type ElementRecord, type LinkRecord } from '@joint/react';

// define element type with custom properties
type ElementData = { color: string };

// define initial elements as Record
const initialElements: Record<string, ElementRecord<ElementData>> = {
  '1': { data: { color: PRIMARY }, position: { x: 100, y: 15 }, size: { width: 100, height: 25 } },
  '2': { data: { color: PRIMARY }, position: { x: 100, y: 200 }, size: { width: 100, height: 25 } },
};

// define initial edges as Record
const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: PRIMARY,
    width: 2,
  },
};

function RenderItem({ color }: Readonly<ElementData>) {
  const { width, height } = useElementSize();
  return <rect rx={10} ry={10} width={width} height={height} fill={color} />;
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
