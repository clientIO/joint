import React, { Suspense, startTransition, useState } from 'react';
import { render, renderHook, act, screen } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useGraphState } from '../use-graph-state';
import { useOnGraphStateChange } from '../use-on-graph-state-change';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
import { selectIsGraphSizingComplete, selectGraphSizingVersion } from '../../selectors';
import type { GraphState } from '../../store/graph-state';
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

const selectCount = (state: GraphState) => state.cells.length;
const selectIds = (state: GraphState) => state.cells.map((cell) => cell.id);
const isSameParity = (a: number, b: number) => a % 2 === b % 2;
const selectXOf = (id: string) => (state: GraphState) => state.getCell(id)?.position?.x;
const selectAX = selectXOf('a');
const noop = () => {};
const selectCountOrThrow = (state: GraphState) => {
  if (state.cells.length > 2) throw new Error('too many cells');
  return state.cells.length;
};
// Custom selectors derived from the shipped ones: plain functions compose.
const selectHasSettledTwice = (state: GraphState) => selectGraphSizingVersion(state) > 1;
const selectMeasuredCount = (state: GraphState) =>
  selectIsGraphSizingComplete(state) ? state.cells.length : 0;

/** Mounts a hook next to a handle on the graph, counting renders. */
function mount<Result>(useHook: () => Result) {
  let renderCount = 0;
  const view = renderHook(
    () => {
      renderCount += 1;
      return { value: useHook(), graph: useGraphStore().graph };
    },
    { wrapper }
  );
  const getElement = (id: string) => view.result.current.graph.getCell(id) as dia.Element;
  return {
    ...view,
    value: () => view.result.current.value,
    graph: () => view.result.current.graph,
    getElement,
    renders: () => renderCount,
  };
}

/** The calls made since mount, without StrictMode's repeated mount call. */
const changesOf = (onChange: jest.Mock) =>
  onChange.mock.calls.filter(([, previous]) => previous !== undefined);

describe('useGraphState', () => {
  it('selects from the cells and re-renders when the selected value changes', async () => {
    const { value, graph } = mount(() => useGraphState(selectCount));
    expect(value()).toBe(2);

    await commit(() => graph().addCell(element('c')));

    expect(value()).toBe(3);
  });

  it('does not re-render for a change that leaves the selected value equal', async () => {
    const { getElement, renders } = mount(() => useGraphState(selectCount));
    const rendersBefore = renders();

    await commit(() => getElement('a').position(30, 30));

    expect(renders()).toBe(rendersBefore);
  });

  it('reads one cell without running its selector when another cell changes', async () => {
    const selector = jest.fn(selectAX);
    const { value, getElement, renders } = mount(() => useGraphState(selector));
    const rendersBefore = renders();
    const callsBefore = selector.mock.calls.length;

    await commit(() => getElement('b').position(70, 0));
    expect(selector).toHaveBeenCalledTimes(callsBefore);
    expect(renders()).toBe(rendersBefore);

    await commit(() => getElement('a').position(30, 0));
    expect(value()).toBe(30);
  });

  it('keeps the selected reference stable across re-renders and equal results', async () => {
    const { value, getElement, rerender } = mount(() => useGraphState(selectIds));
    const before = value();

    rerender();
    await commit(() => getElement('a').position(30, 0));

    expect(value()).toBe(before);
  });

  it('uses the custom equality to decide what a change is', async () => {
    const { value, graph } = mount(() => useGraphState(selectCount, isSameParity));

    await commit(() => graph().addCells([element('c'), element('d')]));
    expect(value()).toBe(2);

    await commit(() => graph().addCell(element('e')));
    expect(value()).toBe(5);
  });

  // The selector is part of what the hook renders: a new one (a changed prop
  // captured by an inline selector) is read at once, not on the next store change.
  it('runs a new selector on re-render, without a store change', () => {
    const { result } = renderHook(
      () => {
        const [id, setId] = useState('a');
        return { x: useGraphState((state) => state.getCell(id)?.position?.x), setId };
      },
      { wrapper }
    );
    expect(result.current.x).toBe(0);

    act(() => result.current.setId('b'));

    expect(result.current.x).toBe(50);
  });

  it('follows the cell a re-rendered selector reads, and drops the previous one', async () => {
    const { result } = renderHook(
      () => {
        const [id, setId] = useState('a');
        const { graph } = useGraphStore();
        return { x: useGraphState((state) => state.getCell(id)?.position?.x), setId, graph };
      },
      { wrapper }
    );
    act(() => result.current.setId('b'));

    await commit(() => (result.current.graph.getCell('b') as dia.Element).position(70, 0));

    expect(result.current.x).toBe(70);
  });

  // Regression: a consumer mounted after the graph settled has to see the
  // settled state on its first render, with no change to wake it.
  it('reads the current state when mounted after the graph settled', async () => {
    const { result } = renderHook(
      () => {
        const [isShown, setIsShown] = useState(false);
        return { isShown, setIsShown };
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.isShown).toBe(false);

    const late = mount(() => useGraphState(selectIsGraphSizingComplete));
    await act(async () => flush());

    expect(late.value()).toBe(true);
  });

  describe('sizing version', () => {
    it('re-renders its reader once per settled change, not per commit', async () => {
      const { value, getElement, graph, renders } = mount(() => useGraphState(selectGraphSizingVersion));
      await act(async () => flush());
      expect(value()).toBe(1);
      const rendersBefore = renders();

      // A move is a commit, but not a measurement.
      await commit(() => getElement('a').position(9, 9));
      expect(value()).toBe(1);
      expect(renders()).toBe(rendersBefore);

      await commit(() => graph().addCell(element('c')));
      expect(value()).toBe(2);
    });

    it('selectIsGraphSizingComplete turns true once sizes settle and re-renders its reader only then', async () => {
      const { value, graph, renders } = mount(() => useGraphState(selectIsGraphSizingComplete));
      await act(async () => flush());
      expect(value()).toBe(true);
      const rendersBefore = renders();

      // A later settled change bumps the sizing version, but the diagram stays measured.
      await commit(() => graph().addCell(element('c')));
      expect(value()).toBe(true);
      expect(renders()).toBe(rendersBefore);

      // A reset to a diagram without sizes is not measured.
      await commit(() => graph().resetCells([]));
      expect(value()).toBe(false);
    });

    it('is measured for an external graph that already holds elements', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      graph.addCells([element('a'), element('b')] as never);
      const { result } = renderHook(() => useGraphState(selectIsGraphSizingComplete), {
        wrapper: ({ children }: { readonly children: React.ReactNode }) => (
          <GraphProvider graph={graph}>{children}</GraphProvider>
        ),
      });
      await act(async () => flush());
      expect(result.current).toBe(true);

      await commit(() => graph.getCell('a').remove());
      expect(result.current).toBe(true);
    });

    // A selector derived from a shipped one is a selector like any other.
    it('re-renders a custom selector derived from selectGraphSizingVersion only when its value changes', async () => {
      const { value, graph, renders } = mount(() => useGraphState(selectHasSettledTwice));
      await act(async () => flush());
      expect(value()).toBe(false);
      const rendersBefore = renders();

      await commit(() => graph().addCell(element('c')));
      expect(value()).toBe(true);
      const rendersAfterChange = renders();
      expect(rendersAfterChange).toBeGreaterThan(rendersBefore);

      // Settles a third time: the sizing version changes, the derived value does not.
      await commit(() => graph().addCell(element('d')));
      expect(value()).toBe(true);
      expect(renders()).toBe(rendersAfterChange);
    });

    it('combines the sizing version with the cells in one selector', async () => {
      const { value, graph } = mount(() => useGraphState(selectMeasuredCount));
      await act(async () => flush());
      expect(value()).toBe(2);

      await commit(() => graph().addCell(element('c')));
      expect(value()).toBe(3);

      await commit(() => graph().resetCells([]));
      expect(value()).toBe(0);
    });

    // Regression: read through the cells, a measurement selector made every
    // commit rebuild the cells array (O(n) per drag frame). A selector that
    // reads only the sizing version is not even run on such a commit.
    it.each([
      [
        'useOnGraphStateChange(selectGraphSizingVersion)',
        () => useOnGraphStateChange(selectGraphSizingVersion, () => {}),
      ],
      ['useGraphState(selectGraphSizingVersion)', () => useGraphState(selectGraphSizingVersion)],
      ['useGraphState(selectIsGraphSizingComplete)', () => useGraphState(selectIsGraphSizingComplete)],
      ['useGraphState(a derived selector)', () => useGraphState(selectHasSettledTwice)],
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
  });
});

// Regression: the subscription followed every read, and React reads while
// rendering. A render it never commits (here a transition that suspends) moved
// the subscription away from the cell the committed tree shows.
describe('useGraphState — a render React throws away', () => {
  const NEVER = new Promise<void>(() => {});
  let liveGraph: dia.Graph | undefined;
  let startSuspendedTransition: (() => void) | undefined;

  function Suspender({ isSuspended }: Readonly<{ isSuspended: boolean }>) {
    // Throwing a promise is how a component suspends.
    if (isSuspended) throw NEVER;
    return null;
  }
  function PositionReader({ id }: Readonly<{ id: string }>) {
    const x = useGraphState((state: GraphState) => state.getCell(id)?.position?.x);
    return <span data-testid="x">{String(x)}</span>;
  }
  function TransitionApp() {
    liveGraph = useGraphStore().graph;
    const [id, setId] = useState('a');
    const [isSuspended, setIsSuspended] = useState(false);
    startSuspendedTransition = () =>
      startTransition(() => {
        setId('b');
        setIsSuspended(true);
      });
    return (
      <Suspense fallback={null}>
        <PositionReader id={id} />
        <Suspender isSuspended={isSuspended} />
      </Suspense>
    );
  }

  it('keeps following the cell the committed tree reads', async () => {
    render(
      <GraphProvider initialCells={initialCells}>
        <TransitionApp />
      </GraphProvider>
    );
    expect(screen.getByTestId('x').textContent).toBe('0');

    // Renders the reader with `b`, suspends, and keeps showing `a`.
    await commit(() => startSuspendedTransition?.());
    expect(screen.getByTestId('x').textContent).toBe('0');

    await commit(() => (liveGraph?.getCell('a') as dia.Element).position(33, 0));
    expect(screen.getByTestId('x').textContent).toBe('33');
  });
});

describe('useOnGraphStateChange', () => {
  it('calls back on mount with the current value and no previous one', () => {
    const onChange = jest.fn();
    mount(() => useOnGraphStateChange(selectCount, onChange));

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('calls back with the new and the previous value, without re-rendering', async () => {
    const onChange = jest.fn();
    const { graph, renders } = mount(() => useOnGraphStateChange(selectCount, onChange));
    const rendersBefore = renders();

    await commit(() => graph().addCell(element('c')));
    await commit(() => graph().getCell('a').remove());

    expect(changesOf(onChange)).toEqual([
      [3, 2],
      [2, 3],
    ]);
    expect(renders()).toBe(rendersBefore);
  });

  it('watches one cell, ignoring the others', async () => {
    const onChange = jest.fn();
    const { getElement } = mount(() => useOnGraphStateChange(selectAX, onChange));

    await commit(() => getElement('b').position(70, 0));
    expect(changesOf(onChange)).toEqual([]);

    await commit(() => getElement('a').position(30, 0));
    expect(changesOf(onChange)).toEqual([[30, 0]]);
  });

  // An inline selector is a new function on every render. That must not start
  // the watch over, which would call back with no previous value each time.
  it('does not call back again when re-rendered with an inline selector', () => {
    const onChange = jest.fn();
    const { rerender } = mount(() =>
      useOnGraphStateChange((state) => state.cells.length, onChange)
    );
    const callsBefore = onChange.mock.calls.length;

    rerender();
    rerender();

    expect(onChange).toHaveBeenCalledTimes(callsBefore);
  });

  // A new selector may read another part of the state, which no notification
  // of the previous one would ever report.
  it('reads a new selector at once, calls back if the value differs, and follows what it reads', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result } = renderHook(
      () => {
        const [isSecond, setIsSecond] = useState(false);
        useOnGraphStateChange(
          isSecond ? selectXOf('b') : selectXOf('a'),
          isSecond ? second : first
        );
        return { setIsSecond, graph: useGraphStore().graph };
      },
      { wrapper }
    );
    first.mockClear();

    act(() => result.current.setIsSecond(true));
    expect(second).toHaveBeenLastCalledWith(50, 0);

    await commit(() => (result.current.graph.getCell('b') as dia.Element).position(70, 0));
    expect(second).toHaveBeenLastCalledWith(70, 50);
    expect(first).not.toHaveBeenCalled();
  });

  it('is 0 until the sizes settle, then changes once per settled change', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnGraphStateChange(selectGraphSizingVersion, onChange));
    await act(async () => flush());
    // No paper renders these elements, so the seed settles on its own.
    expect(changesOf(onChange)).toEqual([[1, 0]]);

    await commit(() => graph().addCells([element('c'), element('d')]));
    expect(changesOf(onChange)).toEqual([
      [1, 0],
      [2, 1],
    ]);
  });

  it('changes when a measured element is removed, so what is left can be laid out again', async () => {
    const onChange = jest.fn();
    const { graph } = mount(() => useOnGraphStateChange(selectGraphSizingVersion, onChange));
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
        useOnGraphStateChange(selectGraphSizingVersion, onChange);
        return { isSizingComplete: useGraphState(selectIsGraphSizingComplete), graph: useGraphStore().graph };
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.isSizingComplete).toBe(true);

    await commit(() => {
      result.current.graph.getCell('a').remove();
      result.current.graph.getCell('b').remove();
    });

    expect(result.current.isSizingComplete).toBe(false);
    expect(onChange.mock.calls.at(-1)).toEqual([0, 1]);
  });

  // Regression: only the callback was guarded. A selector that throws inside
  // the store's notification cut the other subscribers of that change off.
  it('survives a selector that throws, and still notifies the other subscribers', async () => {
    // The graph's microtask commit has to stay real.
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const sibling = jest.fn();
    const { result } = renderHook(
      () => {
        useOnGraphStateChange(selectCountOrThrow, noop);
        useOnGraphStateChange(selectCount, sibling);
        return useGraphStore().graph;
      },
      { wrapper }
    );
    sibling.mockClear();

    await commit(() => result.current.addCell(element('c')));

    expect(sibling).toHaveBeenLastCalledWith(3, 2);
    expect(() => jest.runOnlyPendingTimers()).toThrow('too many cells');
    jest.useRealTimers();
  });

  it('stops calling back after unmount', async () => {
    const onChange = jest.fn();
    const { graph, unmount } = mount(() => useOnGraphStateChange(selectCount, onChange));
    const liveGraph = graph();
    unmount();
    onChange.mockClear();

    await commit(() => liveGraph.addCell(element('c')));

    expect(onChange).not.toHaveBeenCalled();
  });
});
