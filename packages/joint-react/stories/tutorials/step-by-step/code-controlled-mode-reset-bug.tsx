/**
 * ============================================================================
 * BUG REPRO: CONTROLLED MODE + ADD/RESET
 * ============================================================================
 *
 * Cells lack an explicit `size` field. Steps:
 *  1. Click "Add task" twice (creates task-1, task-2).
 *  2. Click "Reset" — should restore the initial three cells (a, b, a-b).
 *  3. Drag element `a` or `b`.
 *
 * Two observed symptoms:
 *   - A previously-removed task cell can reappear in the paper.
 *   - After Reset, elements collapse to a 0×0 size because
 *     `mapElementToAttributes` fills missing `size` with `{0, 0}` and pushes
 *     that into the existing cell on the next `applyControlled` pass.
 * ============================================================================
 */
import { useRef, useState } from 'react';
import { type CellRecord, GraphProvider, Paper } from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import '../../examples/index.css';

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: 'element',
    position: { x: 60, y: 60 },
    data: { label: 'A' },
  },
  {
    id: 'b',
    type: 'element',
    position: { x: 240, y: 60 },
    data: { label: 'B' },
  },
  {
    id: 'a-b',
    type: 'link',
    source: { id: 'a' },
    target: { id: 'b' },
  },
];

const TOOLBAR_STYLE = { marginBottom: 8, display: 'flex', gap: 8 } as const;

export default function App() {
  const [cells, setCells] = useState<readonly CellRecord[]>(initialCells);
  const counterRef = useRef(0);

  function addTask() {
    counterRef.current += 1;
    const id = `task-${counterRef.current}`;
    setCells((previous) => [
      ...previous,
      {
        id,
        type: 'element',
        position: { x: 60 + counterRef.current * 80, y: 200 },
        data: { label: `Task ${counterRef.current}` },
      },
    ]);
  }

  function reset() {
    counterRef.current = 0;
    setCells(initialCells);
  }

  return (
    <div>
      <div style={TOOLBAR_STYLE}>
        <button type="button" onClick={addTask}>
          Add task
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <GraphProvider cells={cells} onCellsChange={setCells}>
        <Paper className={PAPER_CLASSNAME} />
      </GraphProvider>
    </div>
  );
}
