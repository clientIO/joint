import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GraphProvider,
  Paper,
  useCell,
  type CellRecord,
  type Computed,
  type ElementRecord,
} from '@joint/react';
import { useCallback, useMemo, useState, type CSSProperties } from 'react';

/**
 * Minimal reproduction: removing a cell from a controlled `cells` array throws
 * `useCell(): no cell with id "…"` and takes the whole paper down with it.
 *
 * The trigger is a `renderElement` subtree that *subscribes* to its own cell.
 * When the cell disappears from the store, React re-runs that subtree's
 * selector before the parent reconciles the removal, so the selector looks up a
 * cell that is already gone and throws:
 *
 *     Error: useCell(): no cell with id "b"
 *         at use-cell.ts:31
 *         at computeNext (use-cells.ts:51)
 *
 * `useCell` is called directly here to keep the repro small, but
 * `useMeasureElement` reaches the same code path — it calls
 * `useCell(selectElementSize)` internally, which is how any content-sized node
 * runs into this without naming `useCell` at all.
 *
 * Renaming a node is the everyday way to hit it: an id is often authored data
 * (a node name in a text source), so editing that name is a remove plus an add.
 *
 * See the three stories below for what does and does not trigger it.
 */

interface NodeData {
  readonly label: string;
}

type Cells = ReadonlyArray<CellRecord<NodeData>>;

const GEOMETRY = { size: { width: 120, height: 50 } } as const;

const BUTTON_STYLE: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  fontSize: 15,
  fontWeight: 600,
  color: '#ffffff',
  background: '#ed2637',
  border: 'none',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  cursor: 'pointer',
};

const LAYOUT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 12,
};

const PAPER_STYLE: CSSProperties = { width: '100%', height: 200 };

function buildCells(secondId: string): Cells {
  return [
    { id: 'a', type: 'element', position: { x: 30, y: 40 }, ...GEOMETRY, data: { label: 'a' } },
    {
      id: secondId,
      type: 'element',
      position: { x: 230, y: 40 },
      ...GEOMETRY,
      data: { label: secondId },
    },
  ];
}

function NodeBody({ label }: Readonly<{ label: string }>) {
  return (
    <>
      <rect width={120} height={50} rx={6} fill="#ececff" stroke="#9370db" strokeWidth={2} />
      <text x={60} y={25} textAnchor="middle" dominantBaseline="middle" fill="#1f2430">
        {label}
      </text>
    </>
  );
}

/** Subscribes to its own cell — the ingredient the crash needs. */
function SubscribingNode() {
  const label = useCell((cell: Computed<ElementRecord<NodeData>>) => cell.data.label);
  return <NodeBody label={label} />;
}

/** Reads only the `data` argument, never subscribing. */
function PlainNode(data: Readonly<NodeData>) {
  return <NodeBody label={data.label} />;
}

interface ReproProps {
  /** Render nodes that subscribe to their cell via `useCell`. */
  readonly subscribe: boolean;
  /** Remount the provider whenever the set of ids changes. */
  readonly remountOnIdChange: boolean;
}

function Repro({ subscribe, remountOnIdChange }: Readonly<ReproProps>) {
  const [renamed, setRenamed] = useState(false);
  const secondId = renamed ? 'c' : 'b';
  const cells = useMemo(() => buildCells(secondId), [secondId]);
  const rename = useCallback(() => setRenamed((value) => !value), []);

  const provider = (
    <GraphProvider cells={cells}>
      <Paper style={PAPER_STYLE} renderElement={subscribe ? SubscribingNode : PlainNode} />
    </GraphProvider>
  );

  return (
    <div style={LAYOUT_STYLE}>
      <button type="button" onClick={rename} style={BUTTON_STYLE}>
        Rename second cell id ({secondId} → {renamed ? 'b' : 'c'})
      </button>
      {remountOnIdChange ? (
        <div key={cells.map((cell) => cell.id).join(' ')}>{provider}</div>
      ) : (
        provider
      )}
    </div>
  );
}

export default {
  title: 'Bugs/Controlled cells: removing a cell',
  component: Repro,
} satisfies Meta<typeof Repro>;

type Story = StoryObj<typeof Repro>;

/**
 * Press the button once: the paper goes blank and the console shows
 * `useCell(): no cell with id "b"`.
 */
export const Broken: Story = {
  args: { subscribe: true, remountOnIdChange: false },
};

/**
 * Narrowing case — identical cell updates, but `renderElement` only reads its
 * `data` argument instead of subscribing. No throw, so the subscription is the
 * necessary ingredient rather than the removal on its own.
 */
export const WithoutSubscription: Story = {
  args: { subscribe: false, remountOnIdChange: false },
};

/**
 * Workaround — keying the provider on the set of ids unmounts the subscribed
 * subtrees before the new cells are applied, so nothing is left asking about a
 * removed cell. It costs a full graph rebuild on every id change.
 */
export const WorkaroundRemountOnIdChange: Story = {
  args: { subscribe: true, remountOnIdChange: true },
};
