import { useCallback, useMemo } from 'react';
import {
  type CellRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  type RenderElement,
  selectElementSize,
  useCell,
} from '@joint/react';

// Colors — unified dark diagram palette. Node fills stay distinct so each node
// stays recognizable in the minimap.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const TEXT_COLOR = '#DDE6ED';
const LINK_COLOR = '#8697A6';

interface NodeData {
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
    style: { color: LINK_COLOR },
  },
];

/** Scaled-down node for the minimap: a filled rect matching the element size. */
function MinimapNode({ color }: Readonly<Pick<NodeData, 'color'>>) {
  const { width, height } = useCell(selectElementSize);
  return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

/** Full node for the main, interactive view. */
function MainNode({ label, color }: Readonly<NodeData>) {
  const style = useMemo(() => ({ background: color, color: TEXT_COLOR }), [color]);
  return (
    <HTMLBox useModelGeometry className="jj-node" style={style}>
      {label}
    </HTMLBox>
  );
}

function Diagram() {
  const renderMain: RenderElement<NodeData> = useCallback(
    (data) => <MainNode label={data.label} color={data.color} />,
    []
  );
  const renderMinimap: RenderElement<NodeData> = useCallback(
    (data) => <MinimapNode color={data.color} />,
    []
  );

  return (
    <div className="relative size-full">
      <Paper className="size-full" renderElement={renderMain} />
      <div className="absolute bottom-4 right-4 h-[150px] w-[200px] overflow-hidden rounded-lg border border-[rgba(221,230,237,0.18)] bg-[rgba(12,20,28,0.72)]">
        <Paper
          className="size-full"
          interactive={false}
          transform="scale(0.4)"
          renderElement={renderMinimap}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Diagram />
    </GraphProvider>
  );
}
