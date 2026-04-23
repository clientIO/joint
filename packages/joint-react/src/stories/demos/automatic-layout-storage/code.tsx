/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
// We have pre-loaded tailwind css
import {
  GraphProvider,
  Paper,
  HTMLHost,
  useGraph,
  useElement,
  useCells,
  useNodesMeasuredEffect,
  type Cells,
  type CellRecord,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import { linkRoutingOrthogonal } from '@joint/react/presets';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Concept
//
// We persist ONLY the user `data` field of each element, plus link
// source/target. Everything else is automatic:
//
//   - size      → measured by <HTMLHost> from the rendered DOM
//   - position  → recomputed by a tree layout each time nodes are measured
//   - styles    → declared once in code, not persisted
//
// Click any node to edit it inline (uses `useGraph().setCell`).
// "Save .json" downloads a tiny JSON file. "Load .json" reads one back in.
// ─────────────────────────────────────────────────────────────────────────────

interface NodeData {
  readonly title: string;
  readonly owner: string;
}

// The persisted shape mirrors what GraphProvider accepts: keyed by id,
// but stripped to the minimum — data on elements, source/target on links.
interface Snapshot {
  readonly elements: Record<string, { data: NodeData }>;
  readonly links: Record<string, { source: string; target: string }>;
}

const SEED: Snapshot = {
  elements: {
    n1: { data: { title: 'Discovery', owner: 'Aki' } },
    n2: { data: { title: 'Research', owner: 'Mira' } },
    n3: { data: { title: 'Wireframes', owner: 'Theo' } },
    n4: { data: { title: 'Tech spike', owner: 'June' } },
    n5: { data: { title: 'Visual design', owner: 'Theo' } },
    n6: { data: { title: 'Prototype', owner: 'Saya' } },
    n7: { data: { title: 'Build', owner: 'June' } },
    n8: { data: { title: 'QA', owner: 'Aki' } },
  },
  links: {
    l1: { source: 'n1', target: 'n2' },
    l2: { source: 'n1', target: 'n3' },
    l3: { source: 'n1', target: 'n4' },
    l4: { source: 'n3', target: 'n5' },
    l5: { source: 'n3', target: 'n6' },
    l6: { source: 'n4', target: 'n7' },
    l7: { source: 'n7', target: 'n8' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Memo selector: snapshot → unified Cells array the GraphProvider expects.
// Note that we never put position or size here — those come from measurement
// and the layout pass at runtime.
// ─────────────────────────────────────────────────────────────────────────────

const LINK_ATTRS = {
  line: {
    stroke: '#1c2434',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  },
};

function toCells(snapshot: Snapshot): Cells<NodeData> {
  const cells: Array<ElementRecord<NodeData> | LinkRecord> = [];
  for (const [id, node] of Object.entries(snapshot.elements)) {
    cells.push({ id, type: 'ElementModel', data: node.data });
  }
  for (const [id, link] of Object.entries(snapshot.links)) {
    cells.push({
      id,
      type: 'LinkModel',
      source: { id: link.source },
      target: { id: link.target },
      attrs: LINK_ATTRS,
    });
  }
  return cells;
}

// ─────────────────────────────────────────────────────────────────────────────
// File save / load (simple .json round-trip)
// ─────────────────────────────────────────────────────────────────────────────

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
  if (!parsed?.elements || !parsed?.links) throw new Error('Invalid snapshot');
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree layout — DFS assigns each leaf the next column, each parent the
// midpoint of its children. Reruns every time HTMLHost reports new sizes.
// ─────────────────────────────────────────────────────────────────────────────

const COLUMN_WIDTH = 230;
const ROW_GAP = 50;
const PADDING = 40;
const PAPER_ID = 'automatic-layout-storage-paper';

function LayoutRunner() {
  const { graph } = useGraph<NodeData>();

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

  useNodesMeasuredEffect(PAPER_ID, runLayout, [runLayout]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderer — a card with click-to-edit fields.
// Uses `useGraph().setCell` from inside the graph context to update its own data.
// ─────────────────────────────────────────────────────────────────────────────

function NodeCard() {
  const data = useElement<NodeData, NodeData>((element) => element.data);
  const id = useElement((element) => element.id);
  const { title = '', owner = '' } = data ?? {};
  const { setCell } = useGraph<NodeData>();
  const [isEditing, setIsEditing] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isEditing) titleInputRef.current?.focus();
  }, [isEditing]);

  // Exit edit mode when the user clicks/taps anywhere outside the card.
  useEffect(() => {
    if (!isEditing) return;
    const handler = (event: MouseEvent) => {
      if (editorRef.current?.contains(event.target as Node)) return;
      setIsEditing(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing]);

  // Inputs need to swallow the pointer/mouse events so JointJS doesn't try
  // to start a drag on the cell while the user is interacting with them.
  const swallowEditorEvent = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const enterEdit = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  }, []);

  const updateTitle = useCallback(
    (next: string) => setCell({ id, data: { title: next, owner } } as CellRecord<NodeData>),
    [setCell, id, owner]
  );
  const updateOwner = useCallback(
    (next: string) => setCell({ id, data: { title, owner: next } } as CellRecord<NodeData>),
    [setCell, id, title]
  );

  const exitOnEnter = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      setIsEditing(false);
    }
  }, []);

  return (
    <HTMLHost
      className={`w-50 px-4 py-3.5 bg-[#fbf8ee] rounded-[5px] font-sans text-[#1c2434] transition-[border-color,box-shadow] duration-150 border ${
        isEditing
          ? 'cursor-default border-[#b54f23] shadow-[0_0_0_3px_rgba(181,79,35,0.12),0_12px_24px_-16px_rgba(28,36,52,0.4)]'
          : 'cursor-grab border-[rgba(28,36,52,0.18)] shadow-[0_8px_22px_-16px_rgba(28,36,52,0.4)]'
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
            className="flex items-center justify-between w-full p-0 m-0 font-serif text-base font-semibold text-[#1c2434] text-left bg-transparent border-0 cursor-text"
          >
            {title}
            <PencilGlyph />
          </button>
          <div className="text-[11px] text-[rgba(28,36,52,0.55)] mt-1">Owner · {owner}</div>
        </>
      )}
    </HTMLHost>
  );
}

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="text-[8px] tracking-[0.2em] uppercase text-[rgba(28,36,52,0.5)] mb-0.75">
      {children}
    </div>
  );
}

interface InlineInputProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onKeyDown: (event: React.KeyboardEvent) => void;
  readonly font: 'serif' | 'sans';
  readonly ref?: React.Ref<HTMLInputElement>;
}

function InlineInput({ value, onChange, onKeyDown, font, ref }: Readonly<InlineInputProps>) {
  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className={`w-full px-0 py-1 m-0 bg-transparent border-0 border-b border-[rgba(28,36,52,0.25)] outline-none text-[#1c2434] ${
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

// ─────────────────────────────────────────────────────────────────────────────
// Inspector — reads live graph state via hooks and projects it back to the
// minimal Snapshot shape the user actually persists.
// ─────────────────────────────────────────────────────────────────────────────

function useLiveSnapshot(): Snapshot {
  const cells = useCells<NodeData>();
  const { isElement, isLink } = useGraph<NodeData>();

  return useMemo<Snapshot>(() => {
    const out: Snapshot = { elements: {}, links: {} };
    for (const cell of cells) {
      if (isElement(cell)) {
        const element = cell as ElementRecord<NodeData>;
        if (!element.data) continue;
        out.elements[String(element.id)] = { data: element.data };
        continue;
      }
      if (isLink(cell)) {
        const link = cell as LinkRecord;
        const source = link.source as { id?: string } | undefined;
        const target = link.target as { id?: string } | undefined;
        if (!source?.id || !target?.id) continue;
        out.links[String(link.id)] = { source: String(source.id), target: String(target.id) };
      }
    }
    return out;
  }, [cells, isElement, isLink]);
}

function Inspector({ snapshot }: Readonly<{ snapshot: Snapshot }>) {
  const json = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);
  const bytes = new Blob([json]).size;
  const elementCount = Object.keys(snapshot.elements).length;
  const linkCount = Object.keys(snapshot.links).length;

  return (
    <aside className="w-80 shrink-0 bg-[#f1ebda] border-l border-[rgba(28,36,52,0.12)] flex flex-col">
      <div className="px-5.5 pt-5 pb-3">
        <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(28,36,52,0.5)]">
          What gets persisted
        </div>
        <div className="text-lg font-semibold mt-1 leading-[1.3]">
          Just the{' '}
          <code className="font-mono text-xs bg-[rgba(28,36,52,0.08)] px-1.25 py-px rounded-sm">
            data
          </code>{' '}
          field.
        </div>
        <p className="mt-2 mb-0 text-xs text-[rgba(28,36,52,0.6)] leading-normal">
          Click a card to edit its title or owner. Save downloads the JSON below — sizes and
          positions are recomputed on load.
        </p>
      </div>
      <div className="flex justify-between mx-5.5 py-2 border-t border-b border-dashed border-[rgba(28,36,52,0.18)] font-mono text-[10px] text-[rgba(28,36,52,0.6)]">
        <span>
          {elementCount} nodes · {linkCount} links
        </span>
        <span>{bytes} B</span>
      </div>
      <pre className="flex-1 m-0 px-5.5 pt-3.5 pb-5.5 overflow-auto font-mono text-[11px] leading-[1.55] text-[#1c2434] bg-transparent whitespace-pre-wrap break-words">
        {json}
      </pre>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner shell — lives inside GraphProvider and owns add / remove / save.
// All operations talk to the live graph; the snapshot for Save and Inspector
// is derived from `useCells()`.
// ─────────────────────────────────────────────────────────────────────────────

let nextSampleIndex = 1;
const SAMPLE_TITLES = ['Spike', 'QA pass', 'Polish', 'Audit', 'Migrate', 'Demo'];
const SAMPLE_OWNERS = ['Aki', 'Mira', 'Theo', 'June', 'Saya'];

interface InnerShellProps {
  readonly onLoadFile: () => void;
}

function InnerShell({ onLoadFile }: Readonly<InnerShellProps>) {
  const { graph, addCell, removeCell } = useGraph<NodeData>();
  const liveSnapshot = useLiveSnapshot();

  const handleAdd = useCallback(() => {
    const id = `n${Date.now().toString(36)}`;
    const title = SAMPLE_TITLES[nextSampleIndex % SAMPLE_TITLES.length];
    const owner = SAMPLE_OWNERS[nextSampleIndex % SAMPLE_OWNERS.length];
    nextSampleIndex += 1;

    addCell({ id, type: 'ElementModel', data: { title, owner } });

    // Pick a random existing parent so the tree fans out.
    const others = graph.getElements().filter((cell) => String(cell.id) !== id);
    if (others.length > 0) {
      const parent = others[Math.floor(Math.random() * others.length)];
      addCell({
        id: `l${Date.now().toString(36)}`,
        type: 'LinkModel',
        source: { id: String(parent.id) },
        target: { id },
        attrs: LINK_ATTRS,
      } as CellRecord<NodeData>);
    }
  }, [addCell, graph]);

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
    <>
      <header className="flex items-center justify-between px-5.5 py-4.5 border-b border-[rgba(28,36,52,0.12)] gap-4">
        <div>
          <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(28,36,52,0.5)]">
            Demo · click a card to edit · file persistence
          </div>
          <h2 className="mt-1 mb-0 text-[22px] font-semibold tracking-[-0.01em]">
            Save the data. Forget the geometry.
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAdd}>+ Add node</Button>
          <Button onClick={handleRemoveLast}>− Remove last</Button>
          <Button onClick={handleSave} primary>
            Save .json
          </Button>
          <Button onClick={onLoadFile}>Load .json</Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative bg-[radial-gradient(rgba(28,36,52,0.12)_1px,transparent_1px)] bg-[length:20px_20px] [background-position:12px_12px]">
          <Paper
            id={PAPER_ID}
            width="100%"
            height="100%"
            style={{ backgroundColor: 'transparent' }}
            {...linkRoutingOrthogonal({
              sourceOffset: 6,
              targetOffset: 6,
              cornerType: 'cubic',
              margin: 18,
            })}
            renderElement={NodeCard}
          />
          <LayoutRunner />
        </div>
        <Inspector snapshot={liveSnapshot} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App — hosts GraphProvider and the file input. Bumps `reloadKey` on Load
// so the GraphProvider remounts with the new initial cells.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [seed, setSeed] = useState<Snapshot>(SEED);
  const [reloadKey, setReloadKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialCells = useMemo(() => toCells(seed), [seed]);

  const handleLoadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChosen = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const next = await loadSnapshotFromFile(file);
    setSeed(next);
    setReloadKey((value) => value + 1);
  }, []);

  return (
    <div className="w-full h-165 bg-[#f5f0e3] text-[#1c2434] rounded-md overflow-hidden border border-[rgba(28,36,52,0.14)] flex flex-col font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChosen}
      />
      <GraphProvider<NodeData> key={reloadKey} initialCells={initialCells}>
        <InnerShell onLoadFile={handleLoadClick} />
      </GraphProvider>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny reusable bits
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonProps {
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly primary?: boolean;
}

function Button({ children, onClick, primary }: Readonly<ButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 text-xs font-medium font-sans rounded-sm cursor-pointer border ${
        primary
          ? 'border-[#b54f23] bg-[#b54f23] text-[#fbf8ee]'
          : 'border-[rgba(28,36,52,0.2)] bg-[#fbf8ee] text-[#1c2434]'
      }`}
    >
      {children}
    </button>
  );
}
