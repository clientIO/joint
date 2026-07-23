import { useCallback, useMemo, type ChangeEvent, type CSSProperties } from 'react';
import {
  type CellRecord,
  type ElementRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  useCellId,
  useGraph,
} from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
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
    position: { x: 100, y: 15 },
    size: { width: 100, height: 50 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', color: SECONDARY },
    position: { x: 100, y: 200 },
    size: { width: 100, height: 50 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: LINK_COLOR },
  },
];

function ColorNode({ color }: Readonly<NodeData>) {
  const id = useCellId();
  const { setCell, isElement } = useGraph<ElementRecord<NodeData>>();
  const handleColor = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setCell(id, (previous) => {
        if (!isElement(previous)) return previous;
        return { ...previous, data: { ...previous.data, color: next } };
      });
    },
    [id, isElement, setCell]
  );
  const style = useMemo<CSSProperties>(() => ({ backgroundColor: color }), [color]);
  return (
    <HTMLBox useModelGeometry className="jj-node" style={style}>
      <input type="color" value={color} onChange={handleColor} />
    </HTMLBox>
  );
}

function Main() {
  return <Paper className="size-full" renderElement={ColorNode} />;
}

export default function WithColor() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
