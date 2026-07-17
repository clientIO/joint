import {
  GraphProvider,
  Paper,
  useCell,
  useMeasureElement,
  type CellRecord,
  type Computed,
  type ElementRecord,
} from '@joint/react';
import { useCallback, useRef, type CSSProperties, type MouseEvent } from 'react';

const PRIMARY = '#ED2637';
const NODE_FILL = '#1c2836';
const NODE_TEXT = '#DDE6ED';

// Distance from the bottom-right corner (px) treated as the native resize handle.
const RESIZE_HANDLE = 20;

type NodeData = { readonly label: string };

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

const nodeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 100,
  padding: 10,
  borderRadius: 8,
  border: `1px solid ${PRIMARY}`,
  backgroundColor: NODE_FILL,
  color: NODE_TEXT,
  cursor: 'move',
  resize: 'both',
  overflow: 'auto',
};

function ResizableNode() {
  const divRef = useRef<HTMLDivElement>(null);
  const label = useCell((element: Computed<ElementRecord<NodeData>>) => element.data.label);

  // Clicking inside the bottom-right resize zone must not start a JointJS drag.
  const handleMouseDown = useCallback((event: MouseEvent) => {
    const node = divRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    if (rect.width - offsetX < RESIZE_HANDLE && rect.height - offsetY < RESIZE_HANDLE) {
      event.stopPropagation();
    }
  }, []);

  const { width, height } = useMeasureElement(divRef);

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={divRef} style={nodeStyle} onMouseDown={handleMouseDown}>
        {label}
      </div>
    </foreignObject>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" renderElement={ResizableNode} />
    </GraphProvider>
  );
}
