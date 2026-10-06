import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useOnCellsChange } from '../use-on-cells-change';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import {
  selectElementsSizes,
  selectIsMeasured,
  selectMeasuredState,
} from '../../selectors';
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
const noop = () => {};
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

describe('selectMeasuredState', () => {
  it('is 0 until the sizes settle, then changes once per settled change', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnCellsChange(selectMeasuredState, onChange));
    await act(async () => flush());
    // No paper renders these elements, so the seed settles on its own.
    expect(changesOf(onChange)).toEqual([[1, 0]]);

    await commit(() => graph().addCells([element('c'), element('d')]));
    expect(changesOf(onChange)).toEqual([
      [1, 0],
      [2, 1],
    ]);
  });

  it('re-renders a useCells reader once per settled change, not per commit', async () => {
    let renderCount = 0;
    const { result } = renderHook(
      () => {
        renderCount += 1;
        return { version: useCells(selectMeasuredState), graph: useGraphStore().graph };
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.version).toBe(1);
    const rendersBefore = renderCount;

    // A move is a commit, but not a measurement.
    await commit(() => (result.current.graph.getCell('a') as dia.Element).position(9, 9));
    expect(result.current.version).toBe(1);
    expect(renderCount).toBe(rendersBefore);

    await commit(() => result.current.graph.addCell(element('c')));
    expect(result.current.version).toBe(2);
  });

  it('selectIsMeasured turns true once sizes settle and re-renders its reader only then', async () => {
    let renderCount = 0;
    const { result } = renderHook(
      () => {
        renderCount += 1;
        return { isMeasured: useCells(selectIsMeasured), graph: useGraphStore().graph };
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.isMeasured).toBe(true);
    const rendersBefore = renderCount;

    // A later settled change bumps the version, but the diagram stays measured.
    await commit(() => result.current.graph.addCell(element('c')));
    expect(result.current.isMeasured).toBe(true);
    expect(renderCount).toBe(rendersBefore);

    // A reset to a diagram without sizes is not measured.
    await commit(() => result.current.graph.resetCells([]));
    expect(result.current.isMeasured).toBe(false);
  });

  // Regression: read through the cells, the selectors made every commit rebuild
  // the cells array (O(n) per drag frame). Passed directly to a hook they read
  // the measurement itself.
  it.each([
    [
      'useOnCellsChange(selectMeasuredState)',
      () => useOnCellsChange(selectMeasuredState, () => {}),
    ],
    [
      'useCells(selectMeasuredState)',
      () => {
        useCells(selectMeasuredState);
      },
    ],
    [
      'useCells(selectElementsSizes)',
      () => {
        useCells(selectElementsSizes);
      },
    ],
    [
      'useCells(selectIsMeasured)',
      () => {
        useCells(selectIsMeasured);
      },
    ],
  ])('%s does no work on a commit that is not a measurement', async (_name, useReader) => {
    const { getElement, renders } = mount(useReader);
    await act(async () => flush());
    const rendersBefore = renders();
    const buildArray = jest.spyOn(Array, 'from');

    for (let frame = 1; frame <= 10; frame += 1) {
      await commit(() => getElement('a').position(frame, frame));
    }

    // The container builds its cells array with `Array.from`, and only on demand.
    expect(buildArray).not.toHaveBeenCalled();
    expect(renders()).toBe(rendersBefore);
    buildArray.mockRestore();
  });

  it('changes when a measured element is removed, so what is left can be laid out again', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnCellsChange(selectMeasuredState, onChange));
    await act(async () => flush());
    onChange.mockClear();

    await commit(() => graph().getCell('a').remove());

    expect(changesOf(onChange)).toEqual([[2, 1]]);
  });

  // Regression: removing the last sized element left the diagram "measured",
  // while `resetCells([])` did not.
  it('is not measured any more once every element has been removed', async () => {
    const onChange = jest.fn();
    const { result } = renderHook(
      () => {
        useOnCellsChange(selectMeasuredState, onChange);
        return { isMeasured: useCells(selectIsMeasured), graph: useGraphStore().graph };
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.isMeasured).toBe(true);

    await commit(() => {
      result.current.graph.getCell('a').remove();
      result.current.graph.getCell('b').remove();
    });

    expect(result.current.isMeasured).toBe(false);
    expect(onChange.mock.calls.at(-1)).toEqual([0, 1]);
  });

  it('is measured for an external graph that already holds elements', async () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    graph.addCells([element('a'), element('b')] as never);
    const { result } = renderHook(() => useCells(selectIsMeasured), {
      wrapper: ({ children }: { readonly children: React.ReactNode }) => (
        <GraphProvider graph={graph}>{children}</GraphProvider>
      ),
    });
    await act(async () => flush());
    expect(result.current).toBe(true);

    await commit(() => graph.getCell('a').remove());
    expect(result.current).toBe(true);
  });

  // The selectors have no cells to read: scoping them to an id, ids or a
  // collection used to return the neutral value silently, on every commit.
  it('rejects the selectors in the id, ids and collection forms', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const ids = ['a'];

    expect(() => renderHook(() => useCells(ids, selectMeasuredState), { wrapper })).toThrow(
      'all-cells form'
    );
    expect(() =>
      renderHook(() => useOnCellsChange('a', selectIsMeasured, noop), { wrapper })
    ).toThrow('all-cells form');

    error.mockRestore();
  });

  // The selectors read the store through the hook. On their own they have no
  // store to read: TypeScript rejects a call with cells, and at runtime they
  // say so and return their neutral value.
  it('returns the neutral value and warns when called outside a hook', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(selectMeasuredState()).toBe(0);
    expect(selectIsMeasured()).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pass it directly'));

    warn.mockRestore();
  });
});

/** Reads the sizes and the graph, counting renders. */
function mountSizes() {
  let renderCount = 0;
  const { result } = renderHook(
    () => {
      renderCount += 1;
      return { sizes: useCells(selectElementsSizes), graph: useGraphStore().graph };
    },
    { wrapper }
  );
  const getElement = (id: string) => result.current.graph.getCell(id) as dia.Element;
  return { result, getElement, renders: () => renderCount };
}

describe('selectElementsSizes', () => {
  it('returns the size of every element by id', () => {
    const { result } = mountSizes();

    expect([...result.current.sizes]).toEqual([
      ['a', { width: 10, height: 10 }],
      ['b', { width: 10, height: 10 }],
    ]);
  });

  it('keeps the same map, and does not re-render, while elements only move', async () => {
    const { result, getElement, renders } = mountSizes();
    const before = result.current.sizes;
    const rendersBefore = renders();

    await commit(() => getElement('a').position(40, 40));

    expect(result.current.sizes).toBe(before);
    expect(renders()).toBe(rendersBefore);
  });

  it('returns a new map when a size changes, whoever wrote it', async () => {
    const { result, getElement } = mountSizes();
    const initial = result.current.sizes;

    await commit(() => getElement('a').resize(30, 20));
    const afterResize = result.current.sizes;
    expect(afterResize).not.toBe(initial);
    expect(afterResize.get('a')).toEqual({ width: 30, height: 20 });
    // The untouched snapshot is left as it was.
    expect(initial.get('a')).toEqual({ width: 10, height: 10 });

    await commit(() => getElement('b').set('size', { width: 5, height: 5 }, { autoSize: true }));
    expect(result.current.sizes).not.toBe(afterResize);
    expect(result.current.sizes.get('b')).toEqual({ width: 5, height: 5 });
  });

  it('follows elements being added, removed and reset', async () => {
    const { result } = mountSizes();

    await commit(() => result.current.graph.addCell(element('c')));
    expect([...result.current.sizes.keys()]).toEqual(['a', 'b', 'c']);

    await commit(() => result.current.graph.getCell('a').remove());
    expect([...result.current.sizes.keys()]).toEqual(['b', 'c']);

    await commit(() => result.current.graph.resetCells([element('x')] as never));
    expect([...result.current.sizes.keys()]).toEqual(['x']);
  });

  it('re-renders once for several sizes changed together', async () => {
    const { result, getElement, renders } = mountSizes();
    const before = result.current.sizes;
    let rendersForOneResize = 0;
    {
      const start = renders();
      await commit(() => getElement('a').resize(11, 11));
      rendersForOneResize = renders() - start;
    }

    const start = renders();
    await commit(() => {
      getElement('a').resize(30, 30);
      getElement('b').resize(40, 40);
    });

    expect(renders() - start).toBe(rendersForOneResize);
    expect(result.current.sizes).not.toBe(before);
    expect(result.current.sizes.get('b')).toEqual({ width: 40, height: 40 });
  });

  it('calls a useOnCellsChange callback with the new and the previous sizes', async () => {
    const onChange = jest.fn();
    const { getElement } = mount(() => useOnCellsChange(selectElementsSizes, onChange));

    await commit(() => getElement('a').resize(30, 20));

    const [[sizes, previous]] = changesOf(onChange);
    expect(sizes.get('a')).toEqual({ width: 30, height: 20 });
    expect(previous.get('a')).toEqual({ width: 10, height: 10 });
  });
});
