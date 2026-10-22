import React, { Suspense, startTransition, useState } from 'react';
import { render, renderHook, act, screen } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useGraphState } from '../use-graph-state';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { DEFAULT_CELL_NAMESPACE } from '../../store/graph-store';
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

const selectGraphSizingVersion = (state: GraphState) => state.sizingVersion;
const selectIsGraphSizingComplete = (state: GraphState) => state.sizingVersion > 0;
const selectCount = (state: GraphState) => state.cells.length;
const selectIds = (state: GraphState) => state.cells.map((cell) => cell.id);
const isSameParity = (a: number, b: number) => a % 2 === b % 2;
const selectXOf = (id: string) => (state: GraphState) => state.getCell(id)?.position?.x;
const selectAX = selectXOf('a');
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
      const { value, getElement, graph, renders } = mount(() =>
        useGraphState(selectGraphSizingVersion)
      );
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
    it.each<[string, () => unknown]>([
      ['useGraphState(selectGraphSizingVersion)', () => useGraphState(selectGraphSizingVersion)],
      [
        'useGraphState(selectIsGraphSizingComplete)',
        () => useGraphState(selectIsGraphSizingComplete),
      ],
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
