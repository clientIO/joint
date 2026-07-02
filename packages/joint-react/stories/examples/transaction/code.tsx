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
import '../index.css';
import { PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, SECONDARY, LIGHT, BG } from 'storybook-config/theme';

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
        fill={LIGHT}
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

function Action({
  label,
  color,
  filled,
  disabled,
  onClick,
}: Readonly<{
  label: string;
  color: string;
  filled?: boolean;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '9px 16px',
        borderRadius: 10,
        border: `1.5px solid ${color}`,
        background: filled ? color : 'transparent',
        color: filled ? BG : color,
        fontWeight: 600,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'opacity 140ms ease-out',
      }}
    >
      {label}
    </button>
  );
}

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
  // `freezePapers: true` to instead coalesce the repaint to the end).
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
        { rollback: withRollback }
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
      { rollback: false }
    );
    setTone('idle');
    setMessage('Back to the neat row.');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Action label="Shuffle · sync" color={PRIMARY} filled disabled={isRunning} onClick={shuffleSync} />
        <Action label="Cascade · async" color={PRIMARY} disabled={isRunning} onClick={cascadeAsync} />
        <Action label="Cascade, then fail" color={SECONDARY} disabled={isRunning} onClick={cascadeThenFail} />
        <Action label="Reset" color="rgba(221, 230, 237, 0.6)" disabled={isRunning} onClick={reset} />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            marginLeft: 4,
            fontSize: 13,
            color: LIGHT,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.45 : 1,
          }}
        >
          <input
            type="checkbox"
            checked={withRollback}
            disabled={isRunning}
            onChange={(event) => setWithRollback(event.target.checked)}
            style={{ accentColor: SECONDARY, width: 15, height: 15 }}
          />
          auto-rollback
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 20 }}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: TONE_COLOR[tone],
            boxShadow: tone === 'idle' ? 'none' : `0 0 10px ${TONE_COLOR[tone]}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13.5, color: LIGHT }}>{message}</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
        <Controls />
        <Paper
          style={{ ...PAPER_STYLE, height: 360 }}
          className={PAPER_CLASSNAME}
          renderElement={NodeShape}
        />
      </div>
    </GraphProvider>
  );
}
