/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable sonarjs/pseudo-random -- cosmetic node shuffle in a demo, not security-sensitive */
import { useState } from 'react';
import {
  type CellRecord,
  GraphProvider,
  Paper,
  useGraph,
  type ElementRecord,
} from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const NODE_TEXT = '#DDE6ED';

interface NodeData {
  readonly label: string;
}

const NODE_WIDTH = 76;
const NODE_HEIGHT = 46;
const NODE_COUNT = 6;
const SCATTER = { x: 560, y: 250 } as const;

// A neat starting row: a shuffle visibly scatters it, a rollback visibly restores it.
const initialCells: ReadonlyArray<CellRecord<NodeData>> = Array.from(
  { length: NODE_COUNT },
  (_, index) => ({
    id: `n${index + 1}`,
    type: 'element',
    data: { label: `N${index + 1}` },
    position: { x: 28 + index * 108, y: 24 },
    size: { width: NODE_WIDTH, height: NODE_HEIGHT },
  })
);

const NODE_IDS = initialCells.map((cell) => String(cell.id));

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const randomSpot = () => ({
  x: 28 + Math.floor(Math.random() * SCATTER.x),
  y: 96 + Math.floor(Math.random() * SCATTER.y),
});

function NodeShape({ label }: Readonly<NodeData>) {
  return (
    <>
      <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx={13} fill={PRIMARY} />
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 + 5}
        textAnchor="middle"
        fill={NODE_TEXT}
        fontSize={15}
        fontWeight={600}
      >
        {label}
      </text>
    </>
  );
}

type Tone = 'idle' | 'ok' | 'fail';

const TONE_COLOR: Record<Tone, string> = {
  idle: 'rgba(221, 230, 237, 0.5)',
  ok: PRIMARY,
  fail: SECONDARY,
};

function Controls() {
  const { setCell, transaction: tx } = useGraph<ElementRecord<NodeData>>();
  const [isRunning, setIsRunning] = useState(false);
  const [withRollback, setWithRollback] = useState(true);
  const [tone, setTone] = useState<Tone>('idle');
  const [message, setMessage] = useState('Move all six nodes as one atomic step.');

  const scatter = (id: string) =>
    setCell(id, (previous) => ({ ...previous, position: randomSpot() }));

  // Sync: many setCell writes collapse into one undo entry and one re-render.
  function shuffleSync() {
    tx(() => {
      for (const id of NODE_IDS) scatter(id);
    });
    setTone('ok');
    setMessage(`Moved ${NODE_COUNT} nodes in one synchronous transaction.`);
  }

  // Async: awaited writes still commit once, when the transaction closes.
  // Papers stay live by default, so the cascade is visible (pass
  // `deferPaint: true` to instead coalesce the repaint to the end).
  async function cascadeAsync() {
    setIsRunning(true);
    setTone('idle');
    setMessage('Cascading moves, awaiting between each…');
    await tx(async () => {
      for (const id of NODE_IDS) {
        scatter(id);
        await delay(150);
      }
    });
    setTone('ok');
    setMessage('One async transaction: six awaited moves, a single commit.');
    setIsRunning(false);
  }

  // Rollback: the same async run, but it rejects at the end.
  async function cascadeThenFail() {
    setIsRunning(true);
    setTone('idle');
    setMessage('Cascading, then rejecting the whole thing…');
    try {
      await tx(
        async () => {
          for (const id of NODE_IDS) {
            scatter(id);
            await delay(150);
          }
          throw new Error('layout rejected');
        },
        { rollbackOnError: withRollback }
      );
    } catch {
      setTone('fail');
      setMessage(
        withRollback
          ? 'Rejected → every node snapped back to the neat row.'
          : 'Rejected with rollback off → the partial scatter stayed.'
      );
    }
    setIsRunning(false);
  }

  function reset() {
    tx(
      () => {
        for (const cell of initialCells) {
          setCell(String(cell.id), (previous) => ({
            ...previous,
            position: cell.position ?? previous.position,
          }));
        }
      },
      { rollbackOnError: false }
    );
    setTone('idle');
    setMessage('Back to the neat row.');
  }

  return (
    <div className="jj-controls m-3">
      <button
        type="button"
        className="jj-btn jj-btn--primary"
        disabled={isRunning}
        onClick={shuffleSync}
      >
        Shuffle · sync
      </button>
      <button type="button" className="jj-btn" disabled={isRunning} onClick={cascadeAsync}>
        Cascade · async
      </button>
      <button type="button" className="jj-btn" disabled={isRunning} onClick={cascadeThenFail}>
        Cascade, then fail
      </button>
      <button type="button" className="jj-btn jj-btn--ghost" disabled={isRunning} onClick={reset}>
        Reset
      </button>
      <label className="jj-field">
        <input
          type="checkbox"
          checked={withRollback}
          disabled={isRunning}
          onChange={(event) => setWithRollback(event.target.checked)}
          style={{ accentColor: SECONDARY }}
        />
        <span className="jj-label">auto-rollback</span>
      </label>
      <span className="jj-chip">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: TONE_COLOR[tone],
          }}
        />
        {message}
      </span>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <div className="flex size-full flex-col">
        <Controls />
        <Paper className="min-h-0 flex-1" renderElement={NodeShape} />
      </div>
    </GraphProvider>
  );
}
