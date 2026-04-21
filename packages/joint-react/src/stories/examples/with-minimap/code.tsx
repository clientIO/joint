/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback } from 'react';
import {
  GraphProvider,
  Paper,
  useElementSize,
  type ElementRecord,
  type LinkRecord,
  type RenderElement,
  HTMLBox,
} from '@joint/react';
import { PRIMARY, SECONDARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': {
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 100, y: 10 },
    size: { width: 120, height: 60 },
  },
  '2': {
    data: { label: 'Node 2', color: SECONDARY },
    position: { x: 100, y: 200 },
    size: { width: 120, height: 60 },
  },
};
const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: LIGHT,
  },
};

function MinimapElement({ color }: Readonly<NodeData>) {
  const { width, height } = useElementSize();
  return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

function MiniMap() {
  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => <MinimapElement {...data} />,
    []
  );

  return (
    <div className="absolute bottom-4 right-6 w-[200px] h-[150px] border border-[#dde6ed] rounded-lg overflow-hidden">
      <Paper
        id="minimap"
        interactive={false}
        scale={0.4}
        className={PAPER_CLASSNAME}
        height="100%"
        renderElement={renderElement}
      />
    </div>
  );
}

function RenderElement({ label, color }: Readonly<NodeData>) {
  return (
    <HTMLBox useModelGeometry style={{ backgroundColor: color, color: 'white', alignItems: 'center', justifyContent: 'center', display: 'flex', borderRadius: 10 }}>
      {label}
    </HTMLBox>
  );
}

function Main() {
  return (
    <div className="flex flex-row relative">
      <Paper
        id="main-view"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={RenderElement}
      />
      <MiniMap />
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
