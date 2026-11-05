import React from 'react';
import { renderHook, act } from '@testing-library/react';
import type { dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useOnCellsChange } from '../use-on-cells-change';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';

const element = (id: string, x = 0): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y: 0 },
    size: { width: 10, height: 10 },
  }) as CellRecord;

const initialCells: readonly CellRecord[] = [element('a'), element('b', 50)];

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
/** Runs a graph mutation and drains the store's microtask commit. */
const commit = (run: () => void) =>
  act(async () => {
    run();
    await flush();
  });

const selectCount = (cells: readonly unknown[]) => cells.length;
const isSameParity = (a: number, b: number) => a % 2 === b % 2;
const selectX = (cell: { readonly position?: { readonly x: number } } | undefined) =>
  cell?.position?.x;

/** Mounts the hook under test next to a handle on the graph, counting renders. */
function mount(useHook: () => void) {
  let renderCount = 0;
  const { result, unmount } = renderHook(
    () => {
      renderCount += 1;
      useHook();
      return useGraphStore().graph;
    },
    { wrapper }
  );
  const getElement = (id: string) => result.current.getCell(id) as dia.Element;
  return { graph: () => result.current, getElement, renders: () => renderCount, unmount };
}

/** The calls made since mount, without StrictMode's repeated mount call. */
const changesOf = (onChange: jest.Mock) =>
  onChange.mock.calls.filter(([, previous]) => previous !== undefined);

describe('useOnCellsChange', () => {
  it('calls back on mount with the current value and no previous one', () => {
    const onChange = jest.fn();
    mount(() => useOnCellsChange(selectCount, onChange));

    expect(onChange).toHaveBeenCalledWith(2);
    expect(changesOf(onChange)).toHaveLength(0);
  });

  it('calls back with the new and the previous value when the selection changes', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnCellsChange(selectCount, onChange));

    await commit(() => graph().addCell(element('c')));
    await commit(() => graph().getCell('a').remove());

    expect(changesOf(onChange)).toEqual([
      [3, 2],
      [2, 3],
    ]);
  });

  it('does not call back, or re-render, for a commit that leaves the selection unchanged', async () => {
    const onChange = jest.fn();
    const { getElement, renders } = mount(() => useOnCellsChange(selectCount, onChange));
    const rendersBefore = renders();

    await commit(() => getElement('a').position(30, 30));

    expect(changesOf(onChange)).toHaveLength(0);
    expect(renders()).toBe(rendersBefore);
  });

  it('never re-renders the component, unlike useCells', async () => {
    const onChange = jest.fn();
    const watching = mount(() => useOnCellsChange(selectCount, onChange));
    const reading = mount(() => useCells(selectCount));
    const watchingBefore = watching.renders();
    const readingBefore = reading.renders();

    await commit(() => watching.graph().addCell(element('c')));
    await commit(() => reading.graph().addCell(element('c')));

    expect(changesOf(onChange)).toEqual([[3, 2]]);
    expect(watching.renders()).toBe(watchingBefore);
    expect(reading.renders()).toBeGreaterThan(readingBefore);
  });

  it('watches one cell by id, ignoring the others', async () => {
    const onChange = jest.fn();
    const { getElement } = mount(() => useOnCellsChange('a', selectX, onChange));
    expect(onChange).toHaveBeenCalledWith(0);

    await commit(() => getElement('b').position(70, 0));
    expect(changesOf(onChange)).toHaveLength(0);

    await commit(() => getElement('a').position(30, 0));
    expect(changesOf(onChange)).toEqual([[30, 0]]);
  });

  it('passes undefined to the selector for a missing cell', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnCellsChange('late', selectX, onChange));
    expect(onChange.mock.calls[0]).toEqual([undefined]);

    await commit(() => graph().addCell(element('late', 5)));
    // The cell appeared: from `undefined` to its x.
    expect(onChange.mock.calls.at(-1)).toEqual([5, undefined]);
  });

  it('watches several cells by ids', async () => {
    const onChange = jest.fn();
    const ids = ['a', 'missing'] as const;
    const { graph } = mount(() => useOnCellsChange(ids, selectCount, onChange));
    expect(onChange).toHaveBeenCalledWith(1);

    await commit(() => graph().addCell(element('c')));
    expect(changesOf(onChange)).toHaveLength(0);

    await commit(() => graph().addCell(element('missing')));
    expect(changesOf(onChange)).toEqual([[2, 1]]);
  });

  it('uses the custom equality to decide what a change is', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnCellsChange(selectCount, onChange, isSameParity));

    await commit(() => graph().addCells([element('c'), element('d')]));
    expect(changesOf(onChange)).toHaveLength(0);

    await commit(() => graph().addCell(element('e')));
    expect(changesOf(onChange)).toEqual([[5, 2]]);
  });

  // Regression: the equality function was a dependency of the subscription, so
  // an inline one re-subscribed on every render and repeated the mount call.
  it('does not call back again when re-rendered with an inline isEqual', () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      () => useOnCellsChange(selectCount, onChange, (a, b) => a === b),
      { wrapper }
    );
    const callsAfterMount = onChange.mock.calls.length;

    rerender();
    rerender();

    expect(onChange).toHaveBeenCalledTimes(callsAfterMount);
  });

  it('calls the latest callback without subscribing again', async () => {
    const first = jest.fn();
    const second = jest.fn();
    let onChange = first;
    const { result, rerender } = renderHook(
      () => {
        useOnCellsChange(selectCount, onChange);
        return useGraphStore().graph;
      },
      { wrapper }
    );
    const mountCalls = first.mock.calls.length;

    onChange = second;
    rerender();
    // A new callback is not a new subscription: no mount call for it.
    expect(first).toHaveBeenCalledTimes(mountCalls);
    expect(second).not.toHaveBeenCalled();

    await commit(() => result.current.addCell(element('c')));
    expect(first).toHaveBeenCalledTimes(mountCalls);
    expect(second.mock.calls).toEqual([[3, 2]]);
  });

  // Regression: the callback runs inside the store's notification. An error
  // thrown there used to stop the store for good, and to skip the other
  // subscribers of that change.
  it('survives a callback that throws, and still surfaces the error', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    let shouldThrow = false;
    const throwOnDemand = () => {
      if (shouldThrow) throw new Error('boom from a callback');
    };
    const { result } = renderHook(
      () => {
        useOnCellsChange(selectCount, throwOnDemand);
        return { count: useCells(selectCount), graph: useGraphStore().graph };
      },
      { wrapper }
    );

    shouldThrow = true;
    await commit(() => result.current.graph.addCell(element('c')));
    // The other subscriber of the same change was still notified.
    expect(result.current.count).toBe(3);
    expect(() => jest.runOnlyPendingTimers()).toThrow('boom from a callback');

    shouldThrow = false;
    await commit(() => result.current.graph.addCell(element('d')));
    expect(result.current.count).toBe(4);
    jest.useRealTimers();
  });

  // Regression: the projection cleared its pending changes only after notifying
  // its subscribers, so a change a callback made to the graph during that
  // notification was dropped and the store no longer matched the graph.
  it('keeps the store in sync when the callback changes the graph', async () => {
    const { result } = renderHook(
      () => {
        const { graph } = useGraphStore();
        useOnCellsChange(selectCount, (count) => {
          if (count !== 3) return;
          graph.addCell(element('added-by-callback'));
          (graph.getCell('a') as dia.Element).position(77, 0);
        });
        return { graph, count: useCells(selectCount), x: useCells('a', selectX) };
      },
      { wrapper }
    );

    await commit(() => result.current.graph.addCell(element('c')));

    expect(result.current.graph.getCells()).toHaveLength(4);
    expect(result.current.count).toBe(4);
    expect(result.current.x).toBe(77);
  });

  // Regression: a callback that changes what it listens to re-triggered itself
  // inside one endless microtask and froze the page.
  it('does not freeze when the callback keeps changing the cells', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const LAST_CALL = 400;
    let calls = 0;
    const { result } = renderHook(
      () => {
        const { graph } = useGraphStore();
        useOnCellsChange(selectCount, (count) => {
          calls += 1;
          if (calls < LAST_CALL) graph.addCell(element(`extra-${count}`));
        });
        return { graph, count: useCells(selectCount) };
      },
      { wrapper }
    );
    await act(async () => flush());

    // The flush handed control back long before the callback stopped by itself.
    expect(calls).toBeLessThan(LAST_CALL);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('keeps scheduling'));

    // The rest runs over later tasks, and the store ends in sync with the graph.
    for (let task = 0; task < 50 && calls < LAST_CALL; task += 1) {
      await act(async () => {
        jest.runOnlyPendingTimers();
        await flush();
      });
    }
    expect(calls).toBe(LAST_CALL);
    expect(result.current.count).toBe(result.current.graph.getCells().length);

    error.mockRestore();
    jest.useRealTimers();
  });

  it('stops calling back after unmount', async () => {
    const onChange = jest.fn();
    const { graph, unmount } = mount(() => useOnCellsChange(selectCount, onChange));
    const liveGraph = graph();
    unmount();
    onChange.mockClear();

    await commit(() => liveGraph.addCell(element('c')));

    expect(onChange).not.toHaveBeenCalled();
  });
});
