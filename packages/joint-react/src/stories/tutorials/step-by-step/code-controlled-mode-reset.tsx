/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * STEP-BY-STEP: CONTROLLED MODE + RESET BUTTON
 * ============================================================================
 *
 * A minimal controlled-mode tutorial showing how React state can drive the
 * graph AND how resetting the graph to its initial layout is just a
 * `setState(initialCells)` call — no imperative graph.resetCells, no ref, no
 * escape hatch needed.
 *
 * KEY IDEAS (new unified-cells API):
 *
 *   1. One slot, one array.
 *        A single `cells: ReadonlyArray<CellRecord<NodeData>>` array holds both elements AND
 *        links. Each record carries its own `id` and `type` — either
 *        `'element'` or `'link'` — so TypeScript narrows the
 *        shape on the type discriminator.
 *
 *   2. Controlled mode = `cells` + `onCellsChange`.
 *        Passing `cells` (not `initialCells`) makes React the source of
 *        truth. Every graph mutation flows back through `onCellsChange` so
 *        React state always matches what JointJS is rendering.
 *
 *   3. Reset is trivial.
 *        To snap the graph back to its starting layout, call
 *        `setCells(initialCells)`. GraphProvider syncs the snapshot into
 *        JointJS and the paper re-renders.
 *
 *   4. `renderElement` receives `data` only.
 *        Position, size, angle etc. are handled by JointJS's view layer and
 *        do NOT re-invoke the user renderer. If a renderer needs more than
 *        `data`, use `useCellId()` / `useCell()` / `useCell(selectElementSize)`.
 * ============================================================================
 */
import { type ElementRecord,  type CellRecord, GraphProvider, HTMLHost, Paper, type RenderElement } from '@joint/react';
import '../../examples/index.css';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCallback, useState } from 'react';

// ── Data types ──────────────────────────────────────────────────────────────

type NodeKind = 'source' | 'step' | 'sink';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly kind: NodeKind;
}

// ── Visual tokens ───────────────────────────────────────────────────────────

const KIND_STYLES: Record<NodeKind, { background: string; color: string }> = {
  source: { background: '#dbeafe', color: '#1d4ed8' },
  step: { background: '#fef3c7', color: '#b45309' },
  sink: { background: '#d1fae5', color: '#047857' },
};

const LINK_STYLE = { color: PRIMARY, width: 2, targetMarker: 'arrow' } as const;

// ── Initial layout ──────────────────────────────────────────────────────────
//
// One unified array. Three elements (source / step / sink), two links
// connecting them in order. Each record carries `id` and `type`.

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: 'ingest',
    type: 'element',
    position: { x: 40, y: 100 },
    size: { width: 140, height: 60 },
    data: { label: 'Ingest', kind: 'source' },
  },
  {
    id: 'transform',
    type: 'element',
    position: { x: 240, y: 100 },
    size: { width: 140, height: 60 },
    data: { label: 'Transform', kind: 'step' },
  },
  {
    id: 'export',
    type: 'element',
    position: { x: 440, y: 100 },
    size: { width: 140, height: 60 },
    data: { label: 'Export', kind: 'sink' },
  },
  {
    id: 'ingest-transform',
    type: 'link',
    source: { id: 'ingest' },
    target: { id: 'transform' },
    style: LINK_STYLE,
  },
  {
    id: 'transform-export',
    type: 'link',
    source: { id: 'transform' },
    target: { id: 'export' },
    style: LINK_STYLE,
  },
];

// ── Node view — renderElement receives just `data` ──────────────────────────
//
// `renderElement` is called ONLY when the cell's `data` slice changes.
// Position / size updates from dragging go straight to JointJS's view
// transform and never re-invoke this function, so there is no per-frame
// React work during a drag.

function WorkflowNode(data: NodeData) {
  const { background, color } = KIND_STYLES[data.kind];
  return (
    <HTMLHost
      className="min-w-[120px] bg-white rounded-lg border border-gray-300 shadow-md"
      style={{ padding: 8 }}
    >
      <div className="flex flex-col gap-1 items-center">
        <span className="text-sm font-medium text-black">{data.label}</span>
        <span
          className="text-xs font-semibold uppercase rounded px-2 py-0.5"
          style={{ background, color }}
        >
          {data.kind}
        </span>
      </div>
    </HTMLHost>
  );
}

const renderWorkflowNode: RenderElement<NodeData> = WorkflowNode;

// ── App — controlled mode + reset ──────────────────────────────────────────

export default function App() {
  // React state owns the single source of truth. Typed as `ReadonlyArray<CellRecord<NodeData>>`
  // so TypeScript narrows on `type === 'element' | 'link'`.
  const [cells, setCells] = useState<ReadonlyArray<CellRecord<NodeData>>>(initialCells);

  // Reset is literally "set state back to the initial snapshot". No imperative
  // `graph.resetCells` call, no ref chasing — the provider syncs the new
  // cells array into JointJS on the next render.
  const reset = useCallback(() => setCells(initialCells), []);

  return (
    <GraphProvider cells={cells} onCellsChange={setCells}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
          <button type="button" className={BUTTON_CLASSNAME} onClick={reset}>
            Reset
          </button>
        </div>
        <Paper className={PAPER_CLASSNAME} height={400} renderElement={renderWorkflowNode} />
      </div>
    </GraphProvider>
  );
}
