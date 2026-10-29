import { renderHook, act } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';
import { useCellIds } from '../use-cell-ids';
import { useGraphStore } from '../use-graph-store';
import { useGraphTransaction } from '../use-graph-transaction';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const element = (id: string, value: number): CellRecord => ({
  id,
  type: ELEMENT_MODEL_TYPE,
  position: { x: 0, y: 0 },
  size: { width: 50, height: 50 },
  data: { value },
});

function renderIds(initialCells: readonly CellRecord[] = []) {
  return renderHook(
    () => ({
      ids: useCellIds(),
      store: useGraphStore(),
      transaction: useGraphTransaction(),
    }),
    { wrapper: graphProviderWrapper({ initialCells }) }
  );
}

// Ported from useContainerKeys: dev's immutable container exposes its key
// snapshot through useCellIds, so test the same subscription behavior there.
describe('useCellIds', () => {
  it('returns an empty array when the container is empty', () => {
    const { result } = renderIds();
    expect(result.current.ids).toEqual([]);
  });

  it('reflects current keys after a commit', async () => {
    const { result } = renderIds();
    await act(async () => {
      result.current.transaction(() => {
        result.current.store.graph.addCell(element('a', 1));
        result.current.store.graph.addCell(element('b', 2));
      });
      await flush();
    });

    expect([...result.current.ids].toSorted((a, b) => String(a).localeCompare(String(b)))).toEqual([
      'a',
      'b',
    ]);
  });

  it('returns a stable reference when the key set does not change', async () => {
    const { result } = renderIds([element('a', 1)]);
    const first = result.current.ids;
    await act(async () => {
      result.current.store.graph.getCell('a').set('data', { value: 99 });
      await flush();
    });

    expect(result.current.ids).toBe(first);
  });

  it('updates keys when one id is swapped for another in a single commit', async () => {
    const { result } = renderIds([element('a', 1)]);
    expect(result.current.ids).toEqual(['a']);
    const onCommit = jest.fn();
    const unsubscribe = result.current.store.graphProjection.cells.subscribe(onCommit);
    await act(async () => {
      result.current.transaction(() => {
        result.current.store.graph.getCell('a').remove();
        result.current.store.graph.addCell(element('b', 2));
      });
      await flush();
    });
    unsubscribe();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(result.current.ids).toEqual(['b']);
  });

  it('updates the array when a key is added or removed', async () => {
    const { result } = renderIds([element('a', 1)]);
    await act(async () => {
      result.current.store.graph.addCell(element('b', 2));
      await flush();
    });
    expect(result.current.ids).toHaveLength(2);

    await act(async () => {
      result.current.store.graph.getCell('a').remove();
      await flush();
    });
    expect(result.current.ids).toHaveLength(1);
    expect(result.current.ids[0]).toBe('b');
  });

  it('notifies on reset to the same count with different ids', async () => {
    const { result } = renderIds([element('a', 1), element('b', 2)]);
    const onCommit = jest.fn();
    const unsubscribe = result.current.store.graphProjection.cells.subscribe(onCommit);
    await act(async () => {
      result.current.store.graph.resetCells([element('c', 3), element('d', 4)]);
      await flush();
    });
    unsubscribe();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(result.current.ids).toEqual(['c', 'd']);
  });
});
