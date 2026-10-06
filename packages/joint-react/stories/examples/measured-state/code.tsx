/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable sonarjs/pseudo-random -- picks a demo node to resize, not security-sensitive */
import { useRef, useState, type ReactNode } from 'react';
import type { dia } from '@joint/core';
import {
  GraphProvider,
  HTMLBox,
  Paper,
  useCells,
  useGraph,
  useOnCellsChange,
  selectIsMeasured,
  selectMeasuredState,
  selectElementsSizes,
  type CellRecord,
  type ElementRecord,
} from '@joint/react';

interface NodeData {
  readonly label: string;
  readonly isLong?: boolean;
}

const GAP = 24;
const ROW_WIDTH = 560;
const LOG_LIMIT = 9;
const LONG_SUFFIX = ' · with a much longer label';

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: 'n1', type: 'element', data: { label: 'Node 1' }, position: { x: GAP, y: GAP } },
  { id: 'n2', type: 'element', data: { label: 'Node 2' }, position: { x: 140, y: GAP } },
  { id: 'n3', type: 'element', data: { label: 'Node 3' }, position: { x: 260, y: GAP } },
];

/** Flows the elements left to right by their measured width, wrapping at `ROW_WIDTH`. */
function layoutRows(graph: dia.Graph) {
  let x = GAP;
  let y = GAP;
  let rowHeight = 0;
  for (const element of graph.getElements()) {
    const { width, height } = element.size();
    if (x > GAP && x + width > ROW_WIDTH) {
      x = GAP;
      y += rowHeight + GAP;
      rowHeight = 0;
    }
    element.position(x, y);
    x += width + GAP;
    rowHeight = Math.max(rowHeight, height);
  }
}

function renderElement({ label, isLong }: NodeData) {
  // No size on the records: HTMLBox measures its content and writes the size back.
  return <HTMLBox className="jj-node">{isLong ? label + LONG_SUFFIX : label}</HTMLBox>;
}

type Source = 'isMeasured' | 'measuredState' | 'sizes';

interface LogEntry {
  readonly id: number;
  readonly source: Source;
  readonly text: string;
}

const SOURCE_CLASS: Record<Source, string> = {
  isMeasured: 'text-brand',
  measuredState: 'text-accent',
  sizes: 'text-ink',
};

/**
 * Logs every change of the three measurement selectors. `useOnCellsChange`
 * calls back without re-rendering this component; only the log state does.
 */
function useMeasurementLog(isAutoLayout: boolean) {
  const { graph } = useGraph();
  const [entries, setEntries] = useState<readonly LogEntry[]>([]);
  const nextIdRef = useRef(0);

  const log = (source: Source, text: string) => {
    nextIdRef.current += 1;
    const entry = { id: nextIdRef.current, source, text };
    setEntries((previous) => [entry, ...previous].slice(0, LOG_LIMIT));
  };

  // 1. Once per diagram: false → true when the sizes first settle.
  useOnCellsChange(selectIsMeasured, (isMeasured, previous) => {
    log(
      'isMeasured',
      previous === undefined ? `${isMeasured} (mount)` : `${previous} → ${isMeasured}`
    );
  });

  // 2. Every settled change: first pass, add, remove, re-measure. The place to run a layout.
  useOnCellsChange(selectMeasuredState, (measuredState) => {
    log('measuredState', measuredState ? `settled #${measuredState}` : '0 (nothing measured)');
    if (measuredState && isAutoLayout) layoutRows(graph);
  });

  // 3. Any size change, element by element. Moving elements never fires it.
  useOnCellsChange(selectElementsSizes, (sizes, previous) => {
    let changed = 0;
    let kept = 0;
    for (const [id, { width, height }] of sizes) {
      const before = previous?.get(id);
      if (before) kept += 1;
      if (before?.width !== width || before.height !== height) changed += 1;
    }
    const removed = (previous?.size ?? 0) - kept;
    log('sizes', removed > 0 ? `${removed} removed` : `${changed} of ${sizes.size} changed`);
  });

  return entries;
}

function Controls({ onMove }: Readonly<{ onMove: () => void }>) {
  const { graph, setCell, setCellData, removeCell, resetCells } =
    useGraph<ElementRecord<NodeData>>();
  const nextIdRef = useRef(initialCells.length);

  const addNode = () => {
    nextIdRef.current += 1;
    const id = `n${nextIdRef.current}`;
    setCell({ id, type: 'element', data: { label: `Node ${nextIdRef.current}` } });
  };

  const removeLast = () => {
    const last = graph.getElements().at(-1);
    if (last) removeCell(last);
  };

  const toggleLabel = () => {
    const elements = graph.getElements();
    const element = elements[Math.floor(Math.random() * elements.length)];
    if (!element) return;
    setCellData(element.id, (previous) => ({ ...previous, isLong: !previous.isLong }));
  };

  const moveAll = () => {
    for (const element of graph.getElements()) element.translate(0, GAP);
    onMove();
  };

  return (
    <div className="jj-controls m-3">
      <button type="button" className="jj-btn jj-btn--primary" onClick={addNode}>
        Add node
      </button>
      <button type="button" className="jj-btn" onClick={removeLast}>
        Remove last
      </button>
      <button type="button" className="jj-btn" onClick={toggleLabel}>
        Resize a label
      </button>
      <button type="button" className="jj-btn" onClick={moveAll}>
        Move all
      </button>
      <button type="button" className="jj-btn jj-btn--ghost" onClick={() => resetCells([])}>
        Clear
      </button>
      <button
        type="button"
        className="jj-btn jj-btn--ghost"
        onClick={() => resetCells(initialCells)}
      >
        Reset
      </button>
    </div>
  );
}

function SizesTable() {
  // Same map reference until a size changes, so dragging does not re-render this.
  const sizes = useCells(selectElementsSizes);
  if (sizes.size === 0) return <p className="text-ink-faint">No elements.</p>;
  return (
    <ul className="flex flex-col gap-0.5 font-mono text-[12px]">
      {[...sizes].map(([id, { width, height }]) => (
        <li key={id} className="flex justify-between">
          <span className="text-ink-muted">{id}</span>
          <span className="tabular-nums text-ink">
            {Math.round(width)} × {Math.round(height)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-2 border-b border-hairline px-4 py-3">
      <h3 className="font-mono text-[11px] font-semibold text-ink-faint">{title}</h3>
      {children}
    </section>
  );
}

function Inspector({ entries, moves }: Readonly<{ entries: readonly LogEntry[]; moves: number }>) {
  const isMeasured = useCells(selectIsMeasured);
  const measuredState = useCells(selectMeasuredState);
  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-hairline bg-surface text-[13px]">
      <Section title="useCells(selectIsMeasured)">
        <div>
          <span className="jj-chip">
            <span className={`size-2 rounded-full ${isMeasured ? 'bg-brand' : 'bg-ink-faint'}`} />
            {isMeasured ? 'measured' : 'measuring…'}
          </span>
        </div>
      </Section>
      <Section title="useCells(selectMeasuredState)">
        <span className="font-mono text-[20px] tabular-nums text-ink">{measuredState}</span>
      </Section>
      <Section title="useCells(selectElementsSizes)">
        <SizesTable />
      </Section>
      <Section title={`useOnCellsChange · moves ignored: ${moves}`}>
        <ol className="flex flex-col gap-1 font-mono text-[12px]">
          {entries.map(({ id, source, text }) => (
            <li key={id} className="fade-in flex gap-2">
              <span className={SOURCE_CLASS[source]}>{source}</span>
              <span className="text-ink-muted">{text}</span>
            </li>
          ))}
        </ol>
      </Section>
    </aside>
  );
}

function Main() {
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [moves, setMoves] = useState(0);
  const entries = useMeasurementLog(isAutoLayout);

  return (
    <div className="flex size-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <Controls onMove={() => setMoves((count) => count + 1)} />
        <label className="jj-field mx-3">
          <input
            type="checkbox"
            checked={isAutoLayout}
            onChange={(event) => setIsAutoLayout(event.target.checked)}
            className="accent-accent"
          />
          <span className="jj-label">re-run the layout on each measuredState change</span>
        </label>
        <Paper className="min-h-0 flex-1" renderElement={renderElement} />
      </div>
      <Inspector entries={entries} moves={moves} />
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
