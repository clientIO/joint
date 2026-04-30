/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback } from 'react';
import { type CellRecord, GraphProvider, useCell, HTMLBox, Paper, type RenderElement, selectElementSize } from '@joint/react';
import { PRIMARY, SECONDARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 100, y: 10 },
    size: { width: 120, height: 60 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', color: SECONDARY },
    position: { x: 100, y: 200 },
    size: { width: 120, height: 60 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    color: LIGHT,
  },
];

function MinimapElement({ color }: Readonly<NodeData>) {
  const { width, height } = useCell(selectElementSize);
  return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

function MiniMap() {
  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => <MinimapElement {...(data as NodeData)} />,
    []
  );

  return (
    <div className="absolute bottom-4 right-6 w-[200px] h-[150px] border border-[#dde6ed] rounded-lg overflow-hidden">
      <Paper
        id="minimap"
        interactive={false}
        transform={'scale(0.4)'}
        className={PAPER_CLASSNAME}
        height="100%"
        renderElement={renderElement}
      />
    </div>
  );
}

function RenderNode({ data }: Readonly<{ data: NodeData }>) {
  const { label, color } = data;
  return (
    <HTMLBox useModelGeometry style={{ backgroundColor: color, color: 'white', alignItems: 'center', justifyContent: 'center', display: 'flex', borderRadius: 10 }}>
      {label}
    </HTMLBox>
  );
}

function Main() {
  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => <RenderNode data={data} />,
    []
  );
  return (
    <div className="flex flex-row relative">
      <Paper
        id="main-view"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={renderElement}
      />
      <MiniMap />
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
