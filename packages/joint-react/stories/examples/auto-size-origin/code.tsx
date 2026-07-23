import {
  type AutoSizeOrigin,
  type CellRecord,
  type Computed,
  type ElementRecord,
  GraphProvider,
  Paper,
  useCell,
  useCellId,
  useGraph,
  useMeasureElement,
} from '@joint/react';
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const NODE_BODY_COLOR = '#1c2836';
const TEXT_COLOR = '#DDE6ED';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'edit me' }, position: { x: 100, y: 60 } },
  { id: '2', type: 'element', data: { label: 'edit me too' }, position: { x: 100, y: 240 } },
  {
    id: 'l',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

const cardStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  backgroundColor: NODE_BODY_COLOR,
  border: `1px solid ${PRIMARY}`,
  borderRadius: 8,
  color: TEXT_COLOR,
  cursor: 'move',
};

const inputStyle: CSSProperties = {
  minWidth: 40,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'inherit',
  cursor: 'text',
};

/** Keep clicks inside the input from starting a paper drag. */
function stopDrag(event: SyntheticEvent) {
  event.stopPropagation();
}

/**
 * A node that grows to fit its editable label. `useMeasureElement` reports the
 * card's rendered size, which drives the `foreignObject` box and the auto-size
 * write governed by `autoSizeOrigin`.
 */
function EditableNode() {
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useCellId();
  const { graph } = useGraph();
  const label = useCell((element: Computed<ElementRecord<NodeData>>) => element.data.label);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      graph.getCell(id)?.prop('data/label', event.target.value);
    },
    [graph, id]
  );

  const { width, height } = useMeasureElement(contentRef);

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={contentRef} style={cardStyle}>
        <input
          value={label}
          onChange={handleChange}
          onMouseDown={stopDrag}
          onPointerDown={stopDrag}
          size={Math.max(label.length, 6)}
          style={inputStyle}
        />
      </div>
    </foreignObject>
  );
}

export default function App() {
  const [origin, setOrigin] = useState<AutoSizeOrigin>('top-left');

  const handleOrigin = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setOrigin(event.target.value as AutoSizeOrigin);
  }, []);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <label className="jj-field">
          <span className="jj-label">autoSizeOrigin</span>
          <select className="jj-select" value={origin} onChange={handleOrigin}>
            <option value="top-left">top-left</option>
            <option value="center">center</option>
          </select>
        </label>
        <span className="jj-chip">switching remounts the provider — edits reset</span>
      </div>
      {/* `autoSizeOrigin` is read once when the store is constructed, so remount the provider via `key` to apply a new value. */}
      <GraphProvider key={origin} initialCells={initialCells} autoSizeOrigin={origin}>
        <Paper className="min-h-0 flex-1" renderElement={EditableNode} />
      </GraphProvider>
    </div>
  );
}
