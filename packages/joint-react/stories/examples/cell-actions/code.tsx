/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useState } from 'react';
import {
  GraphProvider,
  Paper,
  HTMLHost,
  useGraph,
  useCells,
  type CellRecord,
  type ElementRecord,
  type LinkRecord,
  type Computed,
} from '@joint/react';

// Colors — unified dark diagram palette. Node colors are the point of this demo
// (they are editable at runtime), these are only the starting values.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const LINK_COLOR = '#8697A6';
const NODE_TEXT_COLOR = '#DDE6ED';

type NodeData = {
  readonly label: string;
  readonly color: string;
};

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node A', color: PRIMARY },
    position: { x: 60, y: 60 },
    size: { width: 120, height: 60 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node B', color: SECONDARY },
    position: { x: 260, y: 60 },
    size: { width: 120, height: 60 },
  },
  {
    id: '3',
    type: 'element',
    data: { label: 'Node C', color: PRIMARY },
    position: { x: 160, y: 200 },
    size: { width: 120, height: 60 },
  },
  {
    id: 'link-1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: LINK_COLOR },
  },
  {
    id: 'link-1-3',
    type: 'link',
    source: { id: '1' },
    target: { id: '3' },
    style: { color: LINK_COLOR },
  },
];

function RenderElement({ label, color }: Readonly<NodeData>) {
  return (
    <HTMLHost
      useModelGeometry
      className="jj-node"
      style={{ backgroundColor: color, color: NODE_TEXT_COLOR }}
    >
      {label}
    </HTMLHost>
  );
}

interface ElementControlsProps {
  readonly id: string;
  readonly element: Computed<ElementRecord<NodeData>>;
}

function ElementControls({ id, element }: Readonly<ElementControlsProps>) {
  const { setCell, setCellData, removeCell } = useGraph<ElementRecord<NodeData>>();
  const { label, color } = element.data;
  const { x, y } = element.position;
  const { width, height } = element.size;
  const { angle } = element;

  return (
    <div className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-2 p-3">
      <div className="flex items-center justify-between text-sm font-semibold text-ink">
        <span>{label}</span>
        <span className="text-xs font-normal text-ink-faint">#{id}</span>
      </div>

      <label className="jj-field flex w-full">
        <span className="jj-label w-12 shrink-0">Label</span>
        <input
          className="jj-input min-w-0 flex-1"
          type="text"
          value={label}
          onChange={(event) => setCellData(id, (data) => ({ ...data, label: event.target.value }))}
        />
      </label>

      <label className="jj-field flex w-full">
        <span className="jj-label w-12 shrink-0">Color</span>
        <input
          className="jj-input h-9 w-12 p-1"
          type="color"
          value={color}
          onChange={(event) => setCellData(id, (data) => ({ ...data, color: event.target.value }))}
        />
      </label>

      <div className="jj-field flex w-full">
        <span className="jj-label w-12 shrink-0">Pos</span>
        <input
          className="jj-input min-w-0 flex-1"
          type="number"
          aria-label="Position X"
          value={Math.round(x)}
          onChange={(event) =>
            setCell(id, (previous) => ({
              ...previous,
              position: { x: Number(event.target.value), y: previous.position?.y ?? 0 },
            }))
          }
        />
        <input
          className="jj-input min-w-0 flex-1"
          type="number"
          aria-label="Position Y"
          value={Math.round(y)}
          onChange={(event) =>
            setCell(id, (previous) => ({
              ...previous,
              position: { x: previous.position?.x ?? 0, y: Number(event.target.value) },
            }))
          }
        />
      </div>

      <div className="jj-field flex w-full">
        <span className="jj-label w-12 shrink-0">Size</span>
        <input
          className="jj-input min-w-0 flex-1"
          type="number"
          aria-label="Width"
          value={Math.round(width)}
          onChange={(event) =>
            setCell(id, (previous) => ({
              ...previous,
              size: { width: Number(event.target.value), height: previous.size?.height ?? 0 },
            }))
          }
        />
        <input
          className="jj-input min-w-0 flex-1"
          type="number"
          aria-label="Height"
          value={Math.round(height)}
          onChange={(event) =>
            setCell(id, (previous) => ({
              ...previous,
              size: { width: previous.size?.width ?? 0, height: Number(event.target.value) },
            }))
          }
        />
      </div>

      <label className="jj-field flex w-full">
        <span className="jj-label w-12 shrink-0">Angle</span>
        <input
          className="min-w-0 flex-1"
          type="range"
          min={0}
          max={360}
          value={Math.round(angle)}
          style={{ accentColor: PRIMARY }}
          onChange={(event) => setCell(id, (previous) => ({ ...previous, angle: Number(event.target.value) }))}
        />
        <span className="w-8 shrink-0 text-right text-xs text-ink-muted">{Math.round(angle)}°</span>
      </label>

      <button type="button" className="jj-btn jj-btn--sm" onClick={() => removeCell(id)}>
        Remove
      </button>
    </div>
  );
}

interface LinkControlsProps {
  readonly id: string;
  readonly link: Computed<LinkRecord>;
}

function LinkControls({ id, link }: Readonly<LinkControlsProps>) {
  const { setCell, removeCell } = useGraph();
  const sourceId = String(link.source?.id ?? '?');
  const targetId = String(link.target?.id ?? '?');
  const color = link.style?.color || LINK_COLOR;

  return (
    <div className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-2 p-3">
      <div className="flex items-center gap-1 text-sm font-semibold text-ink">
        {sourceId} <span className="text-ink-faint">→</span> {targetId}
      </div>

      <label className="jj-field flex w-full">
        <span className="jj-label w-12 shrink-0">Color</span>
        <input
          className="jj-input h-9 w-12 p-1"
          type="color"
          value={color}
          onChange={(event) =>
            setCell(id, (previous) =>
              previous.type === 'link'
                ? { ...previous, style: { ...previous.style, color: event.target.value } }
                : previous
            )
          }
        />
      </label>

      <button type="button" className="jj-btn jj-btn--sm" onClick={() => removeCell(id)}>
        Remove
      </button>
    </div>
  );
}

function AddElementForm() {
  const { setCell } = useGraph<ElementRecord<NodeData>>();
  const elementIds = useCells<Computed<CellRecord<NodeData>>, readonly string[]>((cells) =>
    cells.filter((cell) => cell.type === 'element').map((cell) => String(cell.id))
  );
  const [label, setLabel] = useState('');

  const addNode = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const numericIds = elementIds.map(Number).filter((value) => !Number.isNaN(value));
    const nextId = String(Math.max(0, ...numericIds) + 1);
    // eslint-disable-next-line sonarjs/pseudo-random -- random spawn position is cosmetic, not security-sensitive
    const position = { x: 60 + Math.random() * 200, y: 60 + Math.random() * 160 };
    setCell({
      id: nextId,
      type: 'element',
      data: { label: trimmed, color: PRIMARY },
      position,
      size: { width: 120, height: 60 },
    });
    setLabel('');
  };

  return (
    <div className="jj-controls">
      <input
        className="jj-input min-w-0 flex-1"
        type="text"
        placeholder="New node label…"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') addNode();
        }}
      />
      <button type="button" className="jj-btn jj-btn--primary" onClick={addNode}>
        Add node
      </button>
    </div>
  );
}

function AddLinkForm() {
  const { setCell } = useGraph();
  const elements = useCells<Computed<CellRecord<NodeData>>, ReadonlyArray<{ id: string; label: string }>>(
    (cells) => {
      const list: Array<{ id: string; label: string }> = [];
      for (const cell of cells) {
        if (cell.type === 'element') list.push({ id: String(cell.id), label: cell.data.label });
      }
      return list;
    }
  );
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  const addLink = () => {
    if (!source || !target || source === target) return;
    setCell({
      id: `link-${source}-${target}-${Date.now()}`,
      type: 'link',
      source: { id: source },
      target: { id: target },
      style: { color: LINK_COLOR },
    });
    setSource('');
    setTarget('');
  };

  return (
    <div className="jj-controls">
      <select
        className="jj-select min-w-0 flex-1"
        aria-label="Link source"
        value={source}
        onChange={(event) => setSource(event.target.value)}
      >
        <option value="">From…</option>
        {elements.map((element) => (
          <option key={element.id} value={element.id}>
            {element.label}
          </option>
        ))}
      </select>
      <select
        className="jj-select min-w-0 flex-1"
        aria-label="Link target"
        value={target}
        onChange={(event) => setTarget(event.target.value)}
      >
        <option value="">To…</option>
        {elements.map((element) => (
          <option key={element.id} value={element.id}>
            {element.label}
          </option>
        ))}
      </select>
      <button type="button" className="jj-btn jj-btn--primary" onClick={addLink}>
        Add link
      </button>
    </div>
  );
}

function Main() {
  const cells = useCells<Computed<CellRecord<NodeData>>>();
  const elements: Array<Computed<ElementRecord<NodeData>>> = [];
  const links: Array<Computed<LinkRecord>> = [];
  for (const cell of cells) {
    if (cell.type === 'element') {
      elements.push(cell);
    } else if (cell.type === 'link') {
      links.push(cell);
    }
  }

  return (
    <div className="flex size-full">
      <Paper className="min-w-0 flex-1" renderElement={RenderElement} />
      <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-hairline bg-surface p-3">
        <div className="text-sm font-semibold text-ink">Cell actions</div>

        <AddElementForm />
        <AddLinkForm />

        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Nodes ({elements.length})
        </div>
        {elements.map((element) => (
          <ElementControls key={element.id} id={String(element.id)} element={element} />
        ))}

        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Links ({links.length})
        </div>
        {links.map((link) => (
          <LinkControls key={link.id} id={String(link.id)} link={link} />
        ))}
      </aside>
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
