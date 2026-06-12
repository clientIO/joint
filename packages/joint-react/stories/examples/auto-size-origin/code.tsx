/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  type AutoSizeOrigin,
  type CellRecord,
  type ElementRecord,
  type Computed,
  GraphProvider,
  Paper,
  useCell,
  useCellId,
  useGraph,
  useMeasureElement,
} from '@joint/react';
import { useCallback, useRef, useState } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

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

const STOP_DRAG = (event: React.MouseEvent | React.PointerEvent) => event.stopPropagation();

function EditableNode() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const id = useCellId();
  const { graph } = useGraph();
  const label = useCell((element: Computed<ElementRecord<NodeData>>) => element.data.label);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      graph.getCell(id)?.prop('data/label', event.target.value);
    },
    [graph, id]
  );

  const { width, height } = useMeasureElement(nodeRef);

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div
        ref={nodeRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#fff',
          border: `1px solid ${PRIMARY}`,
          borderRadius: 8,
          fontFamily: 'Ppfraktionsans, sans-serif',
          color: '#131e29',
          cursor: 'move',
        }}
      >
        <input
          value={label}
          onChange={handleChange}
          onMouseDown={STOP_DRAG}
          onPointerDown={STOP_DRAG}
          size={Math.max(label.length, 6)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            font: 'inherit',
            color: 'inherit',
            cursor: 'text',
            minWidth: 40,
          }}
        />
      </div>
    </foreignObject>
  );
}

function Diagram() {
  return (
    <Paper
      style={{ height: 380 }}
      className={PAPER_CLASSNAME}
      renderElement={EditableNode}
    />
  );
}

export default function App() {
  const [origin, setOrigin] = useState<AutoSizeOrigin>('top-left');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8 }}>
        <label htmlFor="autoSizeOriginToggle" style={{ fontFamily: 'Ppfraktionsans, sans-serif' }}>
          autoSizeOrigin:
        </label>
        <select
          id="autoSizeOriginToggle"
          value={origin}
          onChange={(event) => setOrigin(event.target.value as AutoSizeOrigin)}
        >
          <option value="top-left">top-left</option>
          <option value="center">center</option>
        </select>
        <span style={{ opacity: 0.7, fontFamily: 'Ppfraktionsans, sans-serif' }}>
          (switching remounts the provider — current edits reset to initial)
        </span>
      </div>
      {/*
        Workaround: `autoSizeOrigin` is read at GraphStore construction time.
        Remount via `key` so the new value takes effect — keeps example logic
        trivial without plumbing live-prop updates into the store.
      */}
      <GraphProvider key={origin} initialCells={initialCells} autoSizeOrigin={origin}>
        <Diagram />
      </GraphProvider>
    </div>
  );
}
