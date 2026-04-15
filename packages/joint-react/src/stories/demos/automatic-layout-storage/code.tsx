/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
import {
  GraphProvider,
  Paper,
  HTMLHost,
  useGraph,
  useElementId,
  useElements,
  useLinks,
  useSetElement,
  useRemoveElement,
  useNodesMeasuredEffect,
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
// Click any node to edit it inline (uses `useSetElement`).
// "Save .json" downloads a tiny JSON file. "Load .json" reads one back in.
// ─────────────────────────────────────────────────────────────────────────────

interface NodeData {
  readonly title: string;
  readonly owner: string;
}

// The persisted shape mirrors what GraphProvider accepts: Record-keyed by id.
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
// Memo selectors: snapshot → records the GraphProvider expects.
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

function toElementRecords(snapshot: Snapshot): Record<string, ElementRecord<NodeData>> {
  const result: Record<string, ElementRecord<NodeData>> = {};
  for (const [id, node] of Object.entries(snapshot.elements)) {
    result[id] = { data: node.data };
  }
  return result;
}

function toLinkRecords(snapshot: Snapshot): Record<string, LinkRecord> {
  const result: Record<string, LinkRecord> = {};
  for (const [id, link] of Object.entries(snapshot.links)) {
    result[id] = {
      source: { id: link.source },
      target: { id: link.target },
      attrs: LINK_ATTRS,
    };
  }
  return result;
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
// Uses `useSetElement` from inside the graph context to update its own data.
// ─────────────────────────────────────────────────────────────────────────────

function NodeCard({ title, owner }: Readonly<NodeData>) {
  const id = useElementId();
  const setElement = useSetElement<NodeData>();
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
    (next: string) => setElement(id, { data: { title: next, owner } }),
    [setElement, id, owner]
  );
  const updateOwner = useCallback(
    (next: string) => setElement(id, { data: { title, owner: next } }),
    [setElement, id, title]
  );

  const exitOnEnter = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      setIsEditing(false);
    }
  }, []);

  return (
    <HTMLHost
      style={{
        width: 200,
        padding: '14px 16px',
        backgroundColor: '#fbf8ee',
        border: `1px solid ${isEditing ? '#b54f23' : 'rgba(28,36,52,0.18)'}`,
        borderRadius: 5,
        boxShadow: isEditing
          ? '0 0 0 3px rgba(181,79,35,0.12), 0 12px 24px -16px rgba(28,36,52,0.4)'
          : '0 8px 22px -16px rgba(28,36,52,0.4)',
        fontFamily: 'system-ui, sans-serif',
        color: '#1c2434',
        cursor: isEditing ? 'default' : 'grab',
        transition: 'border-color 120ms ease, box-shadow 160ms ease',
      }}
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
          <div style={{ height: 8 }} />
          <FieldLabel>Owner</FieldLabel>
          <InlineInput value={owner} onChange={updateOwner} onKeyDown={exitOnEnter} font="sans" />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={enterEdit}
            onPointerDown={swallowEditorEvent}
            style={titleButtonStyle}
          >
            {title}
            <PencilGlyph />
          </button>
          <div style={{ fontSize: 11, color: 'rgba(28,36,52,0.55)', marginTop: 4 }}>
            Owner · {owner}
          </div>
        </>
      )}
    </HTMLHost>
  );
}

function FieldLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      style={{
        fontSize: 8,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(28,36,52,0.5)',
        marginBottom: 3,
      }}
    >
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
      style={{
        width: '100%',
        padding: '4px 0',
        margin: 0,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(28,36,52,0.25)',
        outline: 'none',
        color: '#1c2434',
        fontFamily:
          font === 'serif'
            ? '"Iowan Old Style", "Palatino Linotype", Georgia, serif'
            : 'system-ui, sans-serif',
        fontSize: font === 'serif' ? 16 : 12,
        fontWeight: font === 'serif' ? 600 : 500,
      }}
    />
  );
}

const titleButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: 0,
  margin: 0,
  fontFamily: '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
  fontSize: 16,
  fontWeight: 600,
  color: '#1c2434',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  cursor: 'text',
};

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
      style={{ opacity: 0.35, marginLeft: 6, flexShrink: 0 }}
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
  const elements = useElements<NodeData>();
  const links = useLinks();

  return useMemo<Snapshot>(() => {
    const out: Snapshot = { elements: {}, links: {} };
    for (const [id, element] of elements) {
      const { data } = element;
      if (!data) continue;
      out.elements[id] = { data };
    }
    for (const [id, link] of links) {
      const source = link.source as { id?: string } | undefined;
      const target = link.target as { id?: string } | undefined;
      if (!source?.id || !target?.id) continue;
      out.links[id] = { source: source.id, target: target.id };
    }
    return out;
  }, [elements, links]);
}

function Inspector({ snapshot }: Readonly<{ snapshot: Snapshot }>) {
  const json = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);
  const bytes = new Blob([json]).size;
  const elementCount = Object.keys(snapshot.elements).length;
  const linkCount = Object.keys(snapshot.links).length;

  return (
    <aside style={inspectorStyle}>
      <div style={{ padding: '20px 22px 12px' }}>
        <div style={eyebrowStyle}>What gets persisted</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>
          Just the <code style={inlineCodeStyle}>data</code> field.
        </div>
        <p
          style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(28,36,52,0.6)', lineHeight: 1.5 }}
        >
          Click a card to edit its title or owner. Save downloads the JSON below — sizes and
          positions are recomputed on load.
        </p>
      </div>
      <div style={statsRowStyle}>
        <span>
          {elementCount} nodes · {linkCount} links
        </span>
        <span>{bytes} B</span>
      </div>
      <pre style={preStyle}>{json}</pre>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner shell — lives inside GraphProvider and owns add / remove / save.
// All operations talk to the live graph; the snapshot for Save and Inspector
// is derived from `useElements` / `useLinks`.
// ─────────────────────────────────────────────────────────────────────────────

let nextSampleIndex = 1;
const SAMPLE_TITLES = ['Spike', 'QA pass', 'Polish', 'Audit', 'Migrate', 'Demo'];
const SAMPLE_OWNERS = ['Aki', 'Mira', 'Theo', 'June', 'Saya'];

interface InnerShellProps {
  readonly onLoadFile: () => void;
}

function InnerShell({ onLoadFile }: Readonly<InnerShellProps>) {
  const { graph } = useGraph<NodeData>();
  const setElement = useSetElement<NodeData>();
  const removeElement = useRemoveElement();
  const liveSnapshot = useLiveSnapshot();

  const handleAdd = useCallback(() => {
    const id = `n${Date.now().toString(36)}`;
    const title = SAMPLE_TITLES[nextSampleIndex % SAMPLE_TITLES.length];
    const owner = SAMPLE_OWNERS[nextSampleIndex % SAMPLE_OWNERS.length];
    nextSampleIndex += 1;

    setElement(id, { data: { title, owner } });

    // Pick a random existing parent so the tree fans out.
    const others = graph.getElements().filter((cell) => String(cell.id) !== id);
    if (others.length > 0) {
      const parent = others[Math.floor(Math.random() * others.length)];
      graph.addCell({
        type: 'standard.Link',
        id: `l${Date.now().toString(36)}`,
        source: { id: String(parent.id) },
        target: { id },
        attrs: LINK_ATTRS,
      });
    }
  }, [setElement, graph]);

  const handleRemoveLast = useCallback(() => {
    const elements = graph.getElements();
    if (elements.length <= 1) return;
    const last = elements.at(-1);
    if (last) removeElement(String(last.id));
  }, [graph, removeElement]);

  const handleSave = useCallback(() => {
    saveSnapshotToFile(liveSnapshot, `graph-${Date.now()}.json`);
  }, [liveSnapshot]);

  return (
    <>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Demo · click a card to edit · file persistence</div>
          <h2 style={titleStyle}>Save the data. Forget the geometry.</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={handleAdd}>+ Add node</Button>
          <Button onClick={handleRemoveLast}>− Remove last</Button>
          <Button onClick={handleSave} primary>
            Save .json
          </Button>
          <Button onClick={onLoadFile}>Load .json</Button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={canvasStyle}>
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
// so the GraphProvider remounts with the new initial elements.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [seed, setSeed] = useState<Snapshot>(SEED);
  const [reloadKey, setReloadKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialElements = useMemo(() => toElementRecords(seed), [seed]);
  const initialLinks = useMemo(() => toLinkRecords(seed), [seed]);

  const handleLoadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChosen = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const next = await loadSnapshotFromFile(file);
      setSeed(next);
      setReloadKey((value) => value + 1);
    } catch (error) {
      console.warn('Failed to load snapshot:', error);
    }
  }, []);

  return (
    <div style={shellStyle}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChosen}
      />
      <GraphProvider<NodeData> key={reloadKey} elements={initialElements} links={initialLinks}>
        <InnerShell onLoadFile={handleLoadClick} />
      </GraphProvider>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny reusable bits + styles
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
      style={{
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'system-ui, sans-serif',
        borderRadius: 3,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: primary ? '#b54f23' : 'rgba(28,36,52,0.2)',
        backgroundColor: primary ? '#b54f23' : '#fbf8ee',
        color: primary ? '#fbf8ee' : '#1c2434',
      }}
    >
      {children}
    </button>
  );
}

const shellStyle: React.CSSProperties = {
  width: '100%',
  height: 660,
  backgroundColor: '#f5f0e3',
  color: '#1c2434',
  borderRadius: 6,
  overflow: 'hidden',
  border: '1px solid rgba(28,36,52,0.14)',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 22px',
  borderBottom: '1px solid rgba(28,36,52,0.12)',
  gap: 16,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(28,36,52,0.5)',
};

const titleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: '-0.01em',
};

const canvasStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  backgroundImage: 'radial-gradient(rgba(28,36,52,0.12) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
  backgroundPosition: '12px 12px',
};

const inspectorStyle: React.CSSProperties = {
  width: 320,
  flexShrink: 0,
  backgroundColor: '#f1ebda',
  borderLeft: '1px solid rgba(28,36,52,0.12)',
  display: 'flex',
  flexDirection: 'column',
};

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
  backgroundColor: 'rgba(28,36,52,0.08)',
  padding: '1px 5px',
  borderRadius: 3,
};

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '0 22px',
  padding: '8px 0',
  borderTop: '1px dashed rgba(28,36,52,0.18)',
  borderBottom: '1px dashed rgba(28,36,52,0.18)',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 10,
  color: 'rgba(28,36,52,0.6)',
};

const preStyle: React.CSSProperties = {
  flex: 1,
  margin: 0,
  padding: '14px 22px 22px',
  overflow: 'auto',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 11,
  lineHeight: 1.55,
  color: '#1c2434',
  backgroundColor: 'transparent',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};
