import {
  GraphProvider,
  Paper,
  HTMLHost,
  useCellId,
  useGraph,
  useCells,
  useOnElementsMeasured,
  linkRoutingOrthogonal,
  type CellRecord,
  type Computed,
  type ElementRecord,
} from '@joint/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode, Ref, SyntheticEvent } from 'react';

/*
 * Automatic layout & storage
 *
 * Persist a flat array of minimal cells — element `data` plus link
 * source/target ids. Everything else is derived at runtime:
 *   - size     → measured from the rendered DOM by <HTMLHost>
 *   - position → recomputed by a tree layout whenever elements are measured
 *   - styles   → declared in code, never persisted
 *
 * Click a card to edit it inline. "Save .json" downloads the snapshot;
 * "Load .json" reads one back and remounts the graph.
 */

interface NodeData {
  readonly title: string;
  readonly owner: string;
}

// Minimal persisted cell: a unified array, discriminated by `type`.
type SnapshotElement = {
  readonly id: string;
  readonly type: 'element';
  readonly data: NodeData;
};
type SnapshotLink = {
  readonly id: string;
  readonly type: 'link';
  readonly source: string;
  readonly target: string;
};
type SnapshotCell = SnapshotElement | SnapshotLink;
type Snapshot = readonly SnapshotCell[];

const SEED: Snapshot = [
  { id: 'n1', type: 'element', data: { title: 'Discovery', owner: 'Aki' } },
  { id: 'n2', type: 'element', data: { title: 'Research', owner: 'Mira' } },
  { id: 'n3', type: 'element', data: { title: 'Wireframes', owner: 'Theo' } },
  { id: 'n4', type: 'element', data: { title: 'Tech spike', owner: 'June' } },
  { id: 'n5', type: 'element', data: { title: 'Visual design', owner: 'Theo' } },
  { id: 'n6', type: 'element', data: { title: 'Prototype', owner: 'Saya' } },
  { id: 'n7', type: 'element', data: { title: 'Build', owner: 'June' } },
  { id: 'n8', type: 'element', data: { title: 'QA', owner: 'Aki' } },
  { id: 'l1', type: 'link', source: 'n1', target: 'n2' },
  { id: 'l2', type: 'link', source: 'n1', target: 'n3' },
  { id: 'l3', type: 'link', source: 'n1', target: 'n4' },
  { id: 'l4', type: 'link', source: 'n3', target: 'n5' },
  { id: 'l5', type: 'link', source: 'n3', target: 'n6' },
  { id: 'l6', type: 'link', source: 'n4', target: 'n7' },
  { id: 'l7', type: 'link', source: 'n7', target: 'n8' },
];

const LINK_STROKE_COLOR = '#8697A6';

// Links carry style, not geometry — declared once here, never persisted.
const LINK_ATTRS = {
  line: {
    stroke: LINK_STROKE_COLOR,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  },
};

// Orthogonal routing is static, so build it once outside render.
const LINK_ROUTING = linkRoutingOrthogonal({
  sourceOffset: 6,
  targetOffset: 6,
  margin: 18,
  mode: 'bottom-top',
});

/**
 * Expand the minimal snapshot into the `CellRecord[]` the `GraphProvider`
 * expects. Position and size are intentionally omitted — they come from
 * measurement and the layout pass at runtime.
 */
function toCells(snapshot: Snapshot): ReadonlyArray<CellRecord<NodeData>> {
  return snapshot.map((cell) =>
    cell.type === 'element'
      ? { id: cell.id, type: 'element', data: cell.data }
      : {
          id: cell.id,
          type: 'link',
          source: { id: cell.source },
          target: { id: cell.target },
          attrs: LINK_ATTRS,
        }
  );
}

// ── File save / load (a plain .json round-trip) ──────────────────────────────

function saveSnapshotToFile(snapshot: Snapshot, filename: string): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function loadSnapshotFromFile(file: File): Promise<Snapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Snapshot;
  if (!Array.isArray(parsed)) throw new Error('Invalid snapshot');
  return parsed;
}

// ── Tree layout ──────────────────────────────────────────────────────────────
// A DFS gives each leaf the next column and each parent the midpoint of its
// children. It reruns every time <HTMLHost> reports new sizes.

const COLUMN_WIDTH = 230;
const ROW_GAP = 50;
const PADDING = 40;

function LayoutRunner() {
  const { graph } = useGraph<ElementRecord<NodeData>>();

  const runLayout = useCallback(() => {
    const elements = graph.getElements();
    if (elements.length === 0) return;

    // Build a tree (first incoming edge per node wins).
    const children = new Map<string, string[]>();
    const hasParent = new Set<string>();
    for (const cell of elements) children.set(String(cell.id), []);
    for (const link of graph.getLinks()) {
      const source = String(link.get('source')?.id ?? '');
      const target = String(link.get('target')?.id ?? '');
      if (!children.has(source) || !children.has(target) || hasParent.has(target)) continue;
      hasParent.add(target);
      children.get(source)?.push(target);
    }

    // DFS: leaves take the next column; parents sit centered above their kids.
    const column = new Map<string, number>();
    const depth = new Map<string, number>();
    let nextColumn = 0;
    const visit = (id: string, d: number): void => {
      depth.set(id, d);
      const kids = children.get(id) ?? [];
      if (kids.length === 0) {
        column.set(id, nextColumn);
        nextColumn += 1;
        return;
      }
      for (const kid of kids) visit(kid, d + 1);
      const first = column.get(kids[0]) ?? 0;
      const last = column.get(kids.at(-1) ?? '') ?? first;
      column.set(id, (first + last) / 2);
    };
    for (const cell of elements) {
      if (!hasParent.has(String(cell.id))) visit(String(cell.id), 0);
    }

    // Each row's Y is the cumulative height of the rows above it.
    const rowHeight = new Map<number, number>();
    for (const cell of elements) {
      const d = depth.get(String(cell.id)) ?? 0;
      rowHeight.set(d, Math.max(rowHeight.get(d) ?? 0, cell.size().height));
    }
    const rowY = new Map<number, number>();
    let cursorY = PADDING;
    for (const d of [...rowHeight.keys()].toSorted((a, b) => a - b)) {
      rowY.set(d, cursorY);
      cursorY += (rowHeight.get(d) ?? 0) + ROW_GAP;
    }

    for (const cell of elements) {
      const id = String(cell.id);
      cell.position(
        PADDING + (column.get(id) ?? 0) * COLUMN_WIDTH,
        rowY.get(depth.get(id) ?? 0) ?? PADDING
      );
    }
  }, [graph]);

  useOnElementsMeasured(runLayout);
  return null;
}

// ── Node card ────────────────────────────────────────────────────────────────
// A card with click-to-edit fields. Uses `useGraph().setCell` from inside the
// graph context to update its own data.

function NodeCard({ title, owner }: Readonly<NodeData>) {
  const id = useCellId();
  const { setCell } = useGraph<ElementRecord<NodeData>>();
  const [isEditing, setIsEditing] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isEditing) titleInputRef.current?.focus();
  }, [isEditing]);

  // Exit edit mode when the user clicks/taps anywhere outside the card.
  useEffect(() => {
    if (!isEditing) return;
    const handler = (event: Event) => {
      if (editorRef.current?.contains(event.target as Node)) return;
      setIsEditing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing]);

  // Inputs must swallow the pointer/mouse events so JointJS doesn't start a
  // drag on the cell while the user is interacting with them.
  const swallowEditorEvent = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const enterEdit = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  }, []);

  const updateTitle = useCallback(
    (next: string) => setCell({ id, type: 'element', data: { title: next, owner } }),
    [setCell, id, owner]
  );
  const updateOwner = useCallback(
    (next: string) => setCell({ id, type: 'element', data: { title, owner: next } }),
    [setCell, id, title]
  );

  const exitOnEnter = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      setIsEditing(false);
    }
  }, []);

  return (
    <HTMLHost
      className={`w-50 border px-4 py-3.5 rounded-[10px] font-sans text-ink transition-[border-color,box-shadow] duration-150 bg-surface-2 ${
        isEditing
          ? 'cursor-default border-brand shadow-[0_0_0_3px_rgba(237,38,55,0.15),0_12px_24px_-16px_rgba(0,0,0,0.7)]'
          : 'cursor-grab border-hairline-strong shadow-[0_8px_22px_-16px_rgba(0,0,0,0.8)]'
      }`}
    >
      {isEditing ? (
        <div
          ref={editorRef}
          onMouseDown={swallowEditorEvent}
          onPointerDown={swallowEditorEvent}
          onClick={swallowEditorEvent}
        >
          <FieldLabel>Title</FieldLabel>
          <InlineInput
            ref={titleInputRef}
            value={title}
            onChange={updateTitle}
            onKeyDown={exitOnEnter}
            font="serif"
          />
          <div className="h-2" />
          <FieldLabel>Owner</FieldLabel>
          <InlineInput value={owner} onChange={updateOwner} onKeyDown={exitOnEnter} font="sans" />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={enterEdit}
            onPointerDown={swallowEditorEvent}
            className="flex items-center justify-between w-full p-0 m-0 font-serif text-base font-semibold text-ink text-left bg-transparent border-0 cursor-text"
          >
            {title}
            <PencilGlyph />
          </button>
          <div className="text-[11px] text-ink-muted mt-1">Owner · {owner}</div>
        </>
      )}
    </HTMLHost>
  );
}

function FieldLabel({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="text-[8px] tracking-[0.2em] uppercase text-ink-faint mb-0.75">{children}</div>
  );
}

interface InlineInputProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly font: 'serif' | 'sans';
  readonly ref?: Ref<HTMLInputElement>;
}

function InlineInput({ value, onChange, onKeyDown, font, ref }: Readonly<InlineInputProps>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange]
  );
  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      className={`w-full px-0 py-1 m-0 bg-transparent border-0 border-b border-hairline-strong outline-none text-ink ${
        font === 'serif' ? 'font-serif text-base font-semibold' : 'font-sans text-xs font-medium'
      }`}
    />
  );
}

function PencilGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-35 ml-1.5 shrink-0"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// ── Inspector ────────────────────────────────────────────────────────────────
// Reads live graph state via hooks and projects it back to the minimal
// Snapshot shape the user actually persists.

function useLiveSnapshot(): Snapshot {
  const cells = useCells<Computed<CellRecord<NodeData>>>();

  return useMemo<Snapshot>(() => {
    const out: SnapshotCell[] = [];
    for (const cell of cells) {
      if (cell.type === 'element') {
        if (!cell.data) continue;
        out.push({ id: String(cell.id), type: 'element', data: cell.data });
        continue;
      }
      if (cell.type === 'link') {
        const sourceId = cell.source?.id;
        const targetId = cell.target?.id;
        if (sourceId == undefined || targetId == undefined) continue;
        out.push({
          id: String(cell.id),
          type: 'link',
          source: String(sourceId),
          target: String(targetId),
        });
      }
    }
    return out;
  }, [cells]);
}

function Inspector({ snapshot }: Readonly<{ snapshot: Snapshot }>) {
  const json = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);
  const bytes = new Blob([json]).size;
  const elementCount = snapshot.filter((cell) => cell.type === 'element').length;
  const linkCount = snapshot.filter((cell) => cell.type === 'link').length;

  return (
    <aside className="w-72 shrink-0 bg-surface border-l border-hairline flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <div className="text-[9px] tracking-[0.18em] uppercase text-ink-faint">
          What gets persisted
        </div>
        <div className="text-lg font-semibold mt-1 leading-[1.3] text-ink">
          Just the{' '}
          <code className="font-mono text-xs bg-surface-2 text-ink px-1.25 py-px rounded-sm">
            data
          </code>{' '}
          field.
        </div>
        <p className="mt-2 mb-0 text-xs text-ink-muted leading-normal">
          Click a card to edit its title or owner. Save downloads the JSON below — sizes and
          positions are recomputed on load.
        </p>
      </div>
      <div className="flex justify-between mx-5 py-2 border-t border-b border-dashed border-hairline font-mono text-[10px] text-ink-muted">
        <span>
          {elementCount} nodes · {linkCount} links
        </span>
        <span>{bytes} B</span>
      </div>
      <pre className="flex-1 m-0 px-5 pt-3.5 pb-5 overflow-auto font-mono text-[11px] leading-[1.55] text-ink bg-transparent whitespace-pre-wrap break-words">
        {json}
      </pre>
    </aside>
  );
}

// ── Inner shell ──────────────────────────────────────────────────────────────
// Lives inside GraphProvider and owns add / remove / save. All operations talk
// to the live graph; the snapshot for Save and Inspector comes from `useCells`.

let nextSampleIndex = 1;
const SAMPLE_TITLES = ['Spike', 'QA pass', 'Polish', 'Audit', 'Migrate', 'Demo'];
const SAMPLE_OWNERS = ['Aki', 'Mira', 'Theo', 'June', 'Saya'];

interface InnerShellProps {
  readonly onLoadFile: () => void;
}

function InnerShell({ onLoadFile }: Readonly<InnerShellProps>) {
  const { graph, setCell, removeCell } = useGraph<ElementRecord<NodeData>>();
  const liveSnapshot = useLiveSnapshot();

  const handleAdd = useCallback(() => {
    const id = `n${Date.now().toString(36)}`;
    const title = SAMPLE_TITLES[nextSampleIndex % SAMPLE_TITLES.length];
    const owner = SAMPLE_OWNERS[nextSampleIndex % SAMPLE_OWNERS.length];
    nextSampleIndex += 1;

    setCell({ id, type: 'element', data: { title, owner } });

    // Pick a random existing parent so the tree fans out.
    const others = graph.getElements().filter((cell) => String(cell.id) !== id);
    if (others.length > 0) {
      // eslint-disable-next-line sonarjs/pseudo-random -- demo only: any existing node is a fine parent
      const parent = others[Math.floor(Math.random() * others.length)];
      setCell({
        id: `l${Date.now().toString(36)}`,
        type: 'link',
        source: { id: String(parent.id) },
        target: { id },
        attrs: LINK_ATTRS,
      });
    }
  }, [setCell, graph]);

  const handleRemoveLast = useCallback(() => {
    const elements = graph.getElements();
    if (elements.length <= 1) return;
    const last = elements.at(-1);
    if (last) removeCell(String(last.id));
  }, [graph, removeCell]);

  const handleSave = useCallback(() => {
    saveSnapshotToFile(liveSnapshot, `graph-${Date.now()}.json`);
  }, [liveSnapshot]);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn" onClick={handleAdd}>
          + Add node
        </button>
        <button type="button" className="jj-btn" onClick={handleRemoveLast}>
          − Remove last
        </button>
        <button type="button" className="jj-btn jj-btn--primary" onClick={handleSave}>
          Save .json
        </button>
        <button type="button" className="jj-btn" onClick={onLoadFile}>
          Load .json
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Paper className="size-full" linkRouting={LINK_ROUTING} renderElement={NodeCard} />
          <LayoutRunner />
        </div>
        <Inspector snapshot={liveSnapshot} />
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
// Hosts GraphProvider and the file input. Bumps `reloadKey` on Load so the
// GraphProvider remounts with the new initial cells.

export default function App() {
  const [seed, setSeed] = useState<Snapshot>(SEED);
  const [reloadKey, setReloadKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialCells = useMemo(() => toCells(seed), [seed]);

  const handleLoadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChosen = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const next = await loadSnapshotFromFile(file);
    setSeed(next);
    setReloadKey((value) => value + 1);
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChosen}
      />
      <GraphProvider key={reloadKey} initialCells={initialCells}>
        <InnerShell onLoadFile={handleLoadClick} />
      </GraphProvider>
    </>
  );
}
