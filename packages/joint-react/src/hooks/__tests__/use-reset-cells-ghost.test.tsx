/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, renderHook, act, waitFor, fireEvent } from '@testing-library/react';
import { GraphProvider } from '../../components';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';
import { useCells } from '../use-cells';
import { useSetCell, useResetCells } from '../use-cell-setters';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';

const initial: readonly CellRecord[] = [
  { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
  { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 50, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
];

const extra: CellRecord = {
  id: 'extra',
  type: ELEMENT_MODEL_TYPE,
  position: { x: 200, y: 0 },
  size: { width: 10, height: 10 },
} as CellRecord;

// Regression: `resetCells` calls `graph.resetCells()`, whose bulk `reset` event
// emits only `add`s for the surviving cells and no per-cell `remove`s. The
// reactive container must still drop the cells the reset removed — otherwise
// `useCells()` keeps counting ghost cells the canvas (rendered from the graph)
// no longer shows.
describe('resetCells reactive-container reconciliation', () => {
  it('useCells((cells) => cells.length) reflects resetCells, not a stale ghost count', async () => {
    function CountProbe() {
      const { setCell, resetCells } = useGraph();
      const count = useCells((cells) => cells.length);
      return (
        <div>
          <span data-testid="count">{count}</span>
          <button data-testid="add" onClick={() => setCell(extra)}>add</button>
          <button data-testid="reset" onClick={() => resetCells(initial)}>reset</button>
        </div>
      );
    }

    const { getByTestId } = render(
      <GraphProvider initialCells={initial}>
        <CountProbe />
      </GraphProvider>
    );

    await waitFor(() => expect(getByTestId('count').textContent).toBe('2'));
    act(() => fireEvent.click(getByTestId('add')));
    await waitFor(() => expect(getByTestId('count').textContent).toBe('3'));

    // After reset the count must return to 2 — the removed 'extra' is gone.
    act(() => fireEvent.click(getByTestId('reset')));
    await waitFor(() => expect(getByTestId('count').textContent).toBe('2'));
  });

  it('drops cells removed by resetCells from the reactive container (no ghosts)', async () => {
    const wrapper = graphProviderWrapper({ initialCells: initial });
    const { result } = renderHook(
      () => ({ setCell: useSetCell(), resetCells: useResetCells(), store: useGraphStore() }),
      { wrapper }
    );

    act(() => result.current.setCell(extra));
    await waitFor(() => {
      expect(result.current.store.graphProjection.cells.getSnapshot()).toHaveLength(3);
    });

    act(() => result.current.resetCells(initial));
    await waitFor(() => {
      const ids = result.current.store.graphProjection.cells.getSnapshot().map((cell) => cell.id);
      expect(ids).toHaveLength(2);
      expect(ids).not.toContain('extra');
    });
  });
});
