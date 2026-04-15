/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
import {
  GraphProvider,
  Paper,
  HTMLHost,
  useGraph,
  useNodesMeasuredEffect,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import { useCallback, useMemo, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Concept
//
// We persist ONLY the user `data` field of each element, plus link
// source/target. Everything else is automatic:
//
//   - size      → measured by <HTMLHost> from the rendered DOM
//   - position  → recomputed by a BFS layout each time nodes are measured
//   - styles    → declared once in code, not persisted
//
// "Save" downloads a tiny JSON file. "Load" reads one back in.
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
// and layout at runtime.
// ─────────────────────────────────────────────────────────────────────────────

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
      attrs: { line: { stroke: '#1c2434', strokeWidth: 1.5 } },
    };
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// File save / load
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

function loadSnapshotFromFile(file: File): Promise<Snapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '')) as Snapshot;
        if (!parsed?.elements || !parsed?.links) throw new Error('Invalid snapshot');
        resolve(parsed);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    reader.addEventListener('error', () => reject(new Error('Read failed')));
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree layout — places each parent centered over its children's subtree.
// Runs every time HTMLHost reports new measurements.
// ─────────────────────────────────────────────────────────────────────────────

const SIBLING_GAP = 32;
const ROW_GAP = 60;
const PADDING = 40;

const PAPER_ID = 'automatic-layout-storage-paper';

function LayoutRunner() {
  const { graph } = useGraph<NodeData>();

  const runLayout = useCallback(() => {
    const elements = graph.getElements();
    if (elements.length === 0) return;

    // Build adjacency + parent map. We treat the graph as a tree by keeping
    // only the FIRST incoming edge per node.
    const childrenOf = new Map<string, string[]>();
    const parentOf = new Map<string, string>();
    for (const cell of elements) childrenOf.set(String(cell.id), []);
    for (const link of graph.getLinks()) {
      const source = String(link.get('source')?.id ?? '');
      const target = String(link.get('target')?.id ?? '');
      if (!childrenOf.has(source) || !childrenOf.has(target)) continue;
      if (parentOf.has(target)) continue;
      parentOf.set(target, source);
      childrenOf.get(source)?.push(target);
    }
    const roots = elements
      .map((cell) => String(cell.id))
      .filter((id) => !parentOf.has(id));

    const sizeOf = new Map<string, { width: number; height: number }>();
    for (const cell of elements) {
      const { width, height } = cell.size();
      sizeOf.set(String(cell.id), { width, height });
    }

    // Bottom-up: compute the horizontal footprint of each subtree.
    const subtreeWidth = new Map<string, number>();
    function widthOf(id: string): number {
      const cached = subtreeWidth.get(id);
      if (cached !== undefined) return cached;
      const own = sizeOf.get(id)?.width ?? 0;
      const kids = childrenOf.get(id) ?? [];
      if (kids.length === 0) {
        subtreeWidth.set(id, own);
        return own;
      }
      const childrenWidth =
        kids.reduce((sum, kid) => sum + widthOf(kid), 0) + SIBLING_GAP * (kids.length - 1);
      const result = Math.max(own, childrenWidth);
      subtreeWidth.set(id, result);
      return result;
    }
    for (const root of roots) widthOf(root);

    // Top-down: place each node centered above its allotted slot.
    const positions = new Map<string, { x: number; y: number }>();
    function place(id: string, leftX: number, topY: number): void {
      const own = sizeOf.get(id) ?? { width: 0, height: 0 };
      const allotted = subtreeWidth.get(id) ?? own.width;
      positions.set(id, { x: leftX + (allotted - own.width) / 2, y: topY });

      const kids = childrenOf.get(id) ?? [];
      const childY = topY + own.height + ROW_GAP;
      let cursorX = leftX;
      for (const kid of kids) {
        place(kid, cursorX, childY);
        cursorX += (subtreeWidth.get(kid) ?? 0) + SIBLING_GAP;
      }
    }
    let rootCursorX = PADDING;
    for (const root of roots) {
      place(root, rootCursorX, PADDING);
      rootCursorX += (subtreeWidth.get(root) ?? 0) + SIBLING_GAP;
    }

    for (const cell of elements) {
      const next = positions.get(String(cell.id));
      if (next) cell.position(next.x, next.y);
    }
  }, [graph]);

  useNodesMeasuredEffect(PAPER_ID, runLayout, [runLayout]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderer — a plain HTMLHost card. HTMLHost measures it for us.
// ─────────────────────────────────────────────────────────────────────────────

function NodeCard({ title, owner }: Readonly<NodeData>) {
  return (
    <HTMLHost
      style={{
        width: 180,
        padding: '14px 16px',
        backgroundColor: '#fbf8ee',
        border: '1px solid rgba(28,36,52,0.18)',
        borderRadius: 4,
        boxShadow: '0 8px 20px -16px rgba(28,36,52,0.4)',
        fontFamily: 'system-ui, sans-serif',
        color: '#1c2434',
        cursor: 'grab',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'rgba(28,36,52,0.55)' }}>Owner · {owner}</div>
    </HTMLHost>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

let nextNodeIndex = 1;
const SAMPLE_TITLES = ['Spike', 'QA pass', 'Polish', 'Audit', 'Migrate', 'Demo'];
const SAMPLE_OWNERS = ['Aki', 'Mira', 'Theo', 'June', 'Saya'];

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(SEED);
  const [reloadKey, setReloadKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Memoize the records we hand to GraphProvider so we don't rebuild every render.
  const elements = useMemo(() => toElementRecords(snapshot), [snapshot]);
  const links = useMemo(() => toLinkRecords(snapshot), [snapshot]);

  const handleAdd = useCallback(() => {
    const id = `n${Date.now().toString(36)}`;
    const title = SAMPLE_TITLES[nextNodeIndex % SAMPLE_TITLES.length];
    const owner = SAMPLE_OWNERS[nextNodeIndex % SAMPLE_OWNERS.length];
    nextNodeIndex += 1;

    setSnapshot((previous) => {
      const existingIds = Object.keys(previous.elements);
      // Pick a random existing node as parent so the tree fans out instead
      // of growing as a single chain on the right edge.
      const parent =
        existingIds.length > 0
          ? existingIds[Math.floor(Math.random() * existingIds.length)]
          : undefined;
      const linkId = `l${Date.now().toString(36)}`;
      return {
        elements: { ...previous.elements, [id]: { data: { title, owner } } },
        links: parent
          ? { ...previous.links, [linkId]: { source: parent, target: id } }
          : previous.links,
      };
    });
    setReloadKey((value) => value + 1);
  }, []);

  const handleRemoveLast = useCallback(() => {
    setSnapshot((previous) => {
      const ids = Object.keys(previous.elements);
      if (ids.length <= 1) return previous;
      const lastId = ids.at(-1);
      if (!lastId) return previous;
      const nextElements = { ...previous.elements };
      delete nextElements[lastId];
      const nextLinks: Snapshot['links'] = {};
      for (const [id, link] of Object.entries(previous.links)) {
        if (link.source === lastId || link.target === lastId) continue;
        nextLinks[id] = link;
      }
      return { elements: nextElements, links: nextLinks };
    });
    setReloadKey((value) => value + 1);
  }, []);

  const handleSave = useCallback(() => {
    saveSnapshotToFile(snapshot, `graph-${Date.now()}.json`);
  }, [snapshot]);

  const handleLoadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChosen = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const next = await loadSnapshotFromFile(file);
    setSnapshot(next);
    setReloadKey((value) => value + 1);
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

      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Demo · automatic layout & file persistence</div>
          <h2 style={titleStyle}>Save the data. Forget the geometry.</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={handleAdd}>+ Add node</Button>
          <Button onClick={handleRemoveLast}>− Remove last</Button>
          <Button onClick={handleSave} primary>
            Save .json
          </Button>
          <Button onClick={handleLoadClick}>Load .json</Button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={canvasStyle}>
          <GraphProvider<NodeData> key={reloadKey} elements={elements} links={links}>
            <Paper
              id={PAPER_ID}
              width="100%"
              height="100%"
              style={{ backgroundColor: 'transparent' }}
              renderElement={NodeCard}
            />
            <LayoutRunner />
          </GraphProvider>
        </div>

        <Inspector snapshot={snapshot} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inspector — shows exactly what gets persisted.
// ─────────────────────────────────────────────────────────────────────────────

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
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(28,36,52,0.6)', lineHeight: 1.5 }}>
          Sizes come from <code style={inlineCodeStyle}>HTMLHost</code> measurement. Positions come
          from a layout pass after every measure. Neither is saved.
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const shellStyle: React.CSSProperties = {
  width: '100%',
  height: 640,
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
