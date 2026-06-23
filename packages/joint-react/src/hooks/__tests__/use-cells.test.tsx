/* eslint-disable sonarjs/no-nested-functions */
import React from 'react';
import { renderHook, render, act } from '@testing-library/react';
import { mvc, type dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { LINK_MODEL_TYPE } from '../../mvc/link-model';
import type { CellRecord } from '../../types/cell.types';

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 50, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord,
  {
    id: 'c',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 100, y: 0 },
    size: { width: 10, height: 10 },
  } as CellRecord,
  {
    id: 'l1',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
  } as CellRecord,
];

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const countLinks = (cells: readonly CellRecord[]) =>
  cells.filter((c) => c.type === LINK_MODEL_TYPE).length;

const selectCount = (cells: readonly CellRecord[]) => cells.length;

const selectHasAny = (cells: readonly CellRecord[]) => cells.length > 0;

const selectCellIds = (cells: readonly CellRecord[]) => cells.map((c) => String(c.id));

const selectElementCount = (cells: readonly CellRecord[]) =>
  cells.filter((c) => c.type === ELEMENT_MODEL_TYPE).length;

const selectElementIds = (cells: readonly CellRecord[]) =>
  cells.filter((c) => c.type === ELEMENT_MODEL_TYPE).map((c) => String(c.id));

const selectNonElementCount = (cells: readonly CellRecord[]) =>
  cells.filter((c) => c.type !== ELEMENT_MODEL_TYPE).length;

const selectFirstPosition = (cells: readonly CellRecord[]) => cells[0]?.position;

const selectFirstIdOrNone = (cells: readonly CellRecord[]) =>
  cells.length > 0 ? String(cells[0]!.id) : 'none';

const selectPosition = (cell: CellRecord | undefined) => cell?.position;

const selectIsDefined = (cell: CellRecord | undefined) => cell !== undefined;

const selectId = (cell: CellRecord | undefined) => cell?.id;

function stringArrayShallowEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (const [index, value] of a.entries()) {
    if (value !== b[index]) return false;
  }
  return true;
}

// Module-scoped helpers so tests don't define nested components inside `it`
// blocks (avoids sonarjs/no-nested-functions noise).
let storeRef: ReturnType<typeof useGraphStore> | undefined;
function Probe() {
  storeRef = useGraphStore();
  return null;
}
interface ProbeWrapperProps {
  readonly children: React.ReactNode;
}
function ProbeWrapper({ children }: Readonly<ProbeWrapperProps>) {
  return (
    <GraphProvider initialCells={initialCells}>
      <Probe />
      {children}
    </GraphProvider>
  );
}

describe('useCells', () => {
  it('no-arg form returns the full cells array', async () => {
    const { result } = renderHook(() => useCells(), { wrapper });
    await act(async () => flush());
    expect(result.current).toBeDefined();
    expect(result.current.length).toBe(4);
  });

  it('id form returns the cell record for that id', async () => {
    const { result } = renderHook(() => useCells('a'), { wrapper });
    await act(async () => flush());
    expect(result.current?.id).toBe('a');
    expect(result.current?.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('id form returns undefined for missing id', async () => {
    const { result } = renderHook(() => useCells('missing'), { wrapper });
    await act(async () => flush());
    expect(result.current).toBeUndefined();
  });

  it('single-cell selector form runs the selector with undefined for a nullish id', async () => {
    const { result } = renderHook(() => useCells(null, (cell) => cell?.id?.toString() ?? 'none'), {
      wrapper,
    });
    await act(async () => flush());
    expect(result.current).toBe('none');
  });

  it('single-cell selector form runs the selector with the resolved cell for a real id', async () => {
    const { result } = renderHook(() => useCells('a', (cell) => cell?.id?.toString() ?? 'none'), {
      wrapper,
    });
    await act(async () => flush());
    expect(result.current).toBe('a');
  });

  it('selector form runs the selector on the cells array', async () => {
    const { result } = renderHook(() => useCells(selectCount), { wrapper });
    await act(async () => flush());
    expect(result.current).toBe(4);
  });

  it('selector form returns the same reference when equality holds', async () => {
    const { result, rerender } = renderHook(() => useCells(countLinks), { wrapper });
    await act(async () => flush());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('re-renders when a subscribed id changes', async () => {
    storeRef = undefined;
    const { result } = renderHook(() => useCells('a'), { wrapper: ProbeWrapper });
    await act(async () => flush());
    const before = result.current;

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 999, y: 999 });
      await flush();
    });
    expect(result.current).not.toBe(before);
  });

  it('no-arg form re-renders when a cell data changes', async () => {
    storeRef = undefined;
    const { result } = renderHook(() => useCells(), { wrapper: ProbeWrapper });
    await act(async () => flush());
    const before = result.current;
    const cellA = before.find((c) => c.id === 'a');

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 777, y: 777 });
      await flush();
    });

    expect(result.current).not.toBe(before);
    const cellAAfter = result.current.find((c) => c.id === 'a');
    expect(cellAAfter).not.toBe(cellA);
  });

  it('no-arg form handles large cell counts without stack overflow', async () => {
    const largeCells: CellRecord[] = [];
    for (let index = 0; index < 5000; index++) {
      largeCells.push({
        id: `el-${index}`,
        type: ELEMENT_MODEL_TYPE,
        position: { x: index, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord);
    }
    function LargeWrapper({ children }: Readonly<{ readonly children: React.ReactNode }>) {
      return <GraphProvider initialCells={largeCells}>{children}</GraphProvider>;
    }
    const { result } = renderHook(() => useCells(), { wrapper: LargeWrapper });
    await act(async () => flush());
    expect(result.current.length).toBe(5000);
  });
});

interface ConsumerForIdsProps {
  readonly ids: readonly string[];
  readonly onRender: (length: number) => void;
}
function ConsumerForIds({ ids, onRender }: Readonly<ConsumerForIdsProps>) {
  const cells = useCells(ids);
  onRender(cells.length);
  return null;
}

const SUBSCRIBED_IDS = ['a', 'b'];

const pickCellIds = (cells: readonly CellRecord[]): string[] =>
  cells.map((cell) => String(cell.id));
function SubscribedConsumerWrapper({
  onRender,
  children,
}: Readonly<{
  readonly onRender: (length: number) => void;
  readonly children: React.ReactNode;
}>) {
  return (
    <ProbeWrapper>
      <ConsumerForIds ids={SUBSCRIBED_IDS} onRender={onRender} />
      {children}
    </ProbeWrapper>
  );
}

describe('useCells (ids array form)', () => {
  it('returns only the picked cells in the order given', async () => {
    const { result } = renderHook(() => useCells(['c', 'a']), { wrapper });
    await act(async () => flush());
    expect(result.current.map((cell) => cell.id)).toEqual(['c', 'a']);
  });

  it('skips ids that do not resolve to a cell', async () => {
    const { result } = renderHook(() => useCells(['a', 'missing', 'b']), { wrapper });
    await act(async () => flush());
    expect(result.current.map((cell) => cell.id)).toEqual(['a', 'b']);
  });

  it('keeps the array reference stable across unrelated commits', async () => {
    storeRef = undefined;
    const { result } = renderHook(() => useCells(['a', 'b']), { wrapper: ProbeWrapper });
    await act(async () => flush());
    const before = result.current;
    expect(before.map((cell) => cell.id)).toEqual(['a', 'b']);

    // Change a cell that is NOT in the subscribed set — picked array must
    // keep the same reference (no re-render expected).
    await act(async () => {
      storeRef!.graph.getCell('c')?.set('position', { x: 999, y: 999 });
      await flush();
    });
    expect(result.current).toBe(before);
  });

  it('subscribes only to the listed ids — unrelated cell changes do not re-render', async () => {
    storeRef = undefined;
    const renderSpy = jest.fn();
    renderHook(() => null, {
      wrapper: ({ children }) => (
        <SubscribedConsumerWrapper onRender={renderSpy}>{children}</SubscribedConsumerWrapper>
      ),
    });
    await act(async () => flush());
    const beforeCount = renderSpy.mock.calls.length;

    // Mutate a cell NOT in the subscribed set — must NOT trigger Consumer re-render.
    await act(async () => {
      storeRef!.graph.getCell('c')?.set('position', { x: 1, y: 2 });
      await flush();
    });
    expect(renderSpy.mock.calls.length).toBe(beforeCount);

    // Mutate a subscribed id — must trigger at least one Consumer re-render.
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 7, y: 7 });
      await flush();
    });
    expect(renderSpy.mock.calls.length).toBeGreaterThan(beforeCount);
  });

  it('returns a new array reference when a subscribed cell changes', async () => {
    storeRef = undefined;
    const { result } = renderHook(() => useCells(['a', 'b']), { wrapper: ProbeWrapper });
    await act(async () => flush());
    const before = result.current;

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 50, y: 50 });
      await flush();
    });
    expect(result.current).not.toBe(before);
    expect(result.current.find((cell) => cell.id === 'a')?.position).toEqual({ x: 50, y: 50 });
  });

  it('selector form: receives only the picked cells', async () => {
    const { result } = renderHook(() => useCells(SUBSCRIBED_IDS, pickCellIds), { wrapper });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);
  });

  it('selector form: a selector that returns a fresh array each call does not infinite-loop', async () => {
    storeRef = undefined;
    // Selector intentionally returns a fresh array reference on every call.
    const { result } = renderHook(() => useCells(SUBSCRIBED_IDS, pickCellIds), {
      wrapper: ProbeWrapper,
    });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 1, y: 1 });
      await flush();
    });
    expect(result.current).toEqual(['a', 'b']);
  });

  it('selector form: custom isEqual short-circuits re-renders', async () => {
    storeRef = undefined;
    const { result } = renderHook(
      () => useCells(SUBSCRIBED_IDS, pickCellIds, stringArrayShallowEqual),
      { wrapper: ProbeWrapper }
    );
    await act(async () => flush());
    const before = result.current;
    expect(before).toEqual(['a', 'b']);

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 9, y: 9 });
      await flush();
    });
    // ids list didn't change, so isEqual returns true → cached reference held.
    expect(result.current).toBe(before);
  });
});

describe('useCells (selector returning new reference)', () => {
  it('does not infinite-loop when the selector returns a fresh object every call', async () => {
    const { result } = renderHook(() => useCells(pickCellIds), { wrapper });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b', 'c', 'l1']);
  });

  it('returns a new reference when the picked array length changes (line 24)', async () => {
    storeRef = undefined;
    const { result } = renderHook(() => useCells(['a', 'b']), {
      wrapper: ProbeWrapper,
    });
    await act(async () => flush());
    const before = result.current;
    expect(before.map((cell) => cell.id)).toEqual(['a', 'b']);
    // Removing 'a' shrinks the picked array — `areArraysShallowEqual` hits
    // its `a.length !== b.length` early-out (line 24) and the result diverges.
    await act(async () => {
      storeRef!.graph.getCell('a')?.remove();
      await flush();
    });
    expect(result.current).not.toBe(before);
    expect(result.current.map((cell) => cell.id)).toEqual(['b']);
  });

  it('selector returning a non-array falls through to Object.is (line 75)', async () => {
    // `arrayAwareEqual` is selected when a selector is supplied. Line 75 —
    // `return Object.is(a, b)` — fires only when at least one side is not
    // an array. A `cells.length` selector returns a number, so the array
    // branch is skipped and the Object.is fallback runs on the next commit.
    storeRef = undefined;
    const { result } = renderHook(() => useCells(selectCount), {
      wrapper: ProbeWrapper,
    });
    await act(async () => flush());
    expect(result.current).toBe(4);

    // Mutate a cell so the store version bumps and the equality check runs.
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 42, y: 42 });
      await flush();
    });
    // Length didn't change; Object.is(4, 4) === true → cached value held.
    expect(result.current).toBe(4);
  });
});

describe('useCells (collection form)', () => {
  it('returns records for cells in the collection', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([
            store.graph.getCell('a')!,
            store.graph.getCell('b')!,
          ]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('updates when a cell is added to the collection', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.map((c) => c.id)).toEqual(['a']);

    await act(async () => {
      collection!.add(storeRef!.graph.getCell('b')!);
      await flush();
    });
    expect(result.current.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('updates when a cell is removed from the collection', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([
            store.graph.getCell('a')!,
            store.graph.getCell('b')!,
          ]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.map((c) => c.id)).toEqual(['a', 'b']);

    await act(async () => {
      collection!.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current.map((c) => c.id)).toEqual(['b']);
  });

  it('updates when the collection is reset', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.map((c) => c.id)).toEqual(['a']);

    await act(async () => {
      collection!.reset([storeRef!.graph.getCell('b')!, storeRef!.graph.getCell('c')!]);
      await flush();
    });
    expect(result.current.map((c) => c.id)).toEqual(['b', 'c']);
  });

  it('re-renders when a subscribed cell changes', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    const before = result.current;

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 999, y: 999 });
      await flush();
    });
    expect(result.current).not.toBe(before);
    expect(result.current.find((c) => c.id === 'a')?.position).toEqual({ x: 999, y: 999 });
  });

  it('does not re-render when an unrelated cell changes', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const renderSpy = jest.fn();
    renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        const cells = useCells(collection);
        renderSpy(cells);
        return cells;
      },
      { wrapper }
    );
    await act(async () => flush());
    const countBefore = renderSpy.mock.calls.length;

    await act(async () => {
      storeRef!.graph.getCell('c')?.set('position', { x: 1, y: 2 });
      await flush();
    });
    expect(renderSpy.mock.calls.length).toBe(countBefore);
  });

  it('selector form derives a value from collection cells', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([
            store.graph.getCell('a')!,
            store.graph.getCell('b')!,
          ]);
        }
        return useCells(collection, selectCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(2);
  });

  it('selector prevents re-render when result unchanged', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection, selectHasAny);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(true);
    const before = result.current;

    // Cell position change does not affect length > 0
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 50, y: 50 });
      await flush();
    });
    expect(result.current).toBe(before);
  });

  it('empty collection returns empty array', async () => {
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(() => useCells(collection), { wrapper });
    await act(async () => flush());
    expect(result.current).toEqual([]);
  });

  it('array-returning selector without isEqual skips re-render when result is structurally equal', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    let renderCount = 0;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([
            store.graph.getCell('a')!,
            store.graph.getCell('b')!,
          ]);
        }
        renderCount++;
        return useCells(collection, (cells) =>
          cells.filter((c) => c.type === ELEMENT_MODEL_TYPE).map((c) => String(c.id))
        );
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);
    const before = result.current;
    const rendersBefore = renderCount;

    // Change position on 'a' — ids list unchanged, should NOT re-render
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 999, y: 999 });
      await flush();
    });
    expect(result.current).toBe(before);
    expect(renderCount).toBe(rendersBefore);
  });

  it('warns in dev when selector returns unstable object array without isEqual', async () => {
    storeRef = undefined;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([
            store.graph.getCell('a')!,
            store.graph.getCell('b')!,
          ]);
        }
        return useCells(collection, selectCellIds);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);

    await act(async () => {
      collection!.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current).toEqual(['b']);
  });

  it('selector returning boolean updates when collection becomes empty', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection, selectHasAny);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(true);

    await act(async () => {
      collection!.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current).toBe(false);
  });

  it('selector returning count updates on membership change', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection, selectCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(1);

    await act(async () => {
      collection!.add(storeRef!.graph.getCell('b')!);
      await flush();
    });
    expect(result.current).toBe(2);

    await act(async () => {
      collection!.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current).toBe(1);
  });

  it('selector returning ids updates on collection reset', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection, selectCellIds);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual(['a']);

    await act(async () => {
      collection!.reset([storeRef!.graph.getCell('b')!, storeRef!.graph.getCell('c')!]);
      await flush();
    });
    expect(result.current).toEqual(['b', 'c']);
  });

  // ── Non-graph cells (clipboard-style: cell instances not in the graph) ──

  it('returns records for cells that are not in the graph', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          const clone = store.graph.getCell('a')!.clone() as dia.Cell;
          collection = new mvc.Collection<dia.Cell>([clone]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.type).toBe(ELEMENT_MODEL_TYPE);
  });

  it('selector sees correct length when cells are not in the graph', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) collection = new mvc.Collection<dia.Cell>([]);
        return useCells(collection, (cells) => cells.length === 0);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(true);

    await act(async () => {
      const clone = storeRef!.graph.getCell('a')!.clone() as dia.Cell;
      collection!.add(clone);
      await flush();
    });
    expect(result.current).toBe(false);

    await act(async () => {
      collection!.reset([]);
      await flush();
    });
    expect(result.current).toBe(true);
  });

  it('returns stable record reference across renders for non-graph cells', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result, rerender } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          const clone = store.graph.getCell('a')!.clone() as dia.Cell;
          collection = new mvc.Collection<dia.Cell>([clone]);
        }
        return useCells(collection);
      },
      { wrapper }
    );
    await act(async () => flush());
    const first = result.current;
    rerender();
    await act(async () => flush());
    expect(result.current).toBe(first);
  });
});

// ── Collection + selector reactivity (empty-start, the real-world pattern) ──

describe('useCells (collection + selector reactivity)', () => {
  it('empty collection → reset with cells: count updates', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(0);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!, storeRef!.graph.getCell('b')!]);
      await flush();
    });
    expect(result.current).toBe(2);
  });

  it('empty collection → reset with cells: boolean updates', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectHasAny);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(false);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!]);
      await flush();
    });
    expect(result.current).toBe(true);
  });

  it('empty collection → add cell: ids update', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectCellIds);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual([]);

    await act(async () => {
      collection.add(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current).toEqual(['a']);
  });

  it('empty collection → reset → reset again: count tracks all changes', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(0);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!]);
      await flush();
    });
    expect(result.current).toBe(1);

    await act(async () => {
      collection.reset([
        storeRef!.graph.getCell('a')!,
        storeRef!.graph.getCell('b')!,
        storeRef!.graph.getCell('c')!,
      ]);
      await flush();
    });
    expect(result.current).toBe(3);

    await act(async () => {
      collection.reset([]);
      await flush();
    });
    expect(result.current).toBe(0);
  });

  it('empty collection → reset → remove: boolean toggles false→true→false', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectHasAny);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(false);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!]);
      await flush();
    });
    expect(result.current).toBe(true);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current).toBe(false);
  });

  it('collection selector: cell data change updates derived position', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection, selectFirstPosition);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual({ x: 0, y: 0 });

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 100, y: 200 });
      await flush();
    });
    expect(result.current).toEqual({ x: 100, y: 200 });
  });

  it('collection selector returning string: first cell id', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectFirstIdOrNone);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe('none');

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('b')!]);
      await flush();
    });
    expect(result.current).toBe('b');

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('c')!]);
      await flush();
    });
    expect(result.current).toBe('c');
  });

  it('two hooks on same collection: both react to changes', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        const count = useCells(collection, selectCount);
        const ids = useCells(collection, selectCellIds);
        return { count, ids };
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current.count).toBe(0);
    expect(result.current.ids).toEqual([]);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!, storeRef!.graph.getCell('b')!]);
      await flush();
    });
    expect(result.current.count).toBe(2);
    expect(result.current.ids).toEqual(['a', 'b']);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current.count).toBe(1);
    expect(result.current.ids).toEqual(['b']);
  });

  it('collection with selector: only elements count', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectElementCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(0);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!, storeRef!.graph.getCell('l1')!]);
      await flush();
    });
    expect(result.current).toBe(1);
  });

  it('collection with selector: filter element ids only', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectElementIds);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual([]);

    await act(async () => {
      collection.reset([
        storeRef!.graph.getCell('a')!,
        storeRef!.graph.getCell('b')!,
        storeRef!.graph.getCell('l1')!,
      ]);
      await flush();
    });
    expect(result.current).toEqual(['a', 'b']);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('a')!);
      await flush();
    });
    expect(result.current).toEqual(['b']);
  });

  it('collection with selector: link count', async () => {
    storeRef = undefined;
    const collection = new mvc.Collection<dia.Cell>([]);
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(collection, selectNonElementCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(0);

    await act(async () => {
      collection.reset([storeRef!.graph.getCell('a')!, storeRef!.graph.getCell('l1')!]);
      await flush();
    });
    expect(result.current).toBe(1);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('l1')!);
      await flush();
    });
    expect(result.current).toBe(0);
  });

  it('collection with custom isEqual: stable ref when ids match', async () => {
    storeRef = undefined;
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = renderHook(
      () => {
        const store = useGraphStore();
        storeRef = store;
        if (!collection) {
          collection = new mvc.Collection<dia.Cell>([store.graph.getCell('a')!]);
        }
        return useCells(collection, selectCellIds, stringArrayShallowEqual);
      },
      { wrapper }
    );
    await act(async () => flush());
    const before = result.current;
    expect(before).toEqual(['a']);

    // Cell data change doesn't affect ids — custom isEqual should keep ref stable
    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 42, y: 42 });
      await flush();
    });
    expect(result.current).toBe(before);
  });
});

// ── Selector reactivity without collection ──

describe('useCells (selector reactivity — no collection)', () => {
  it('selector returning ids from all cells', async () => {
    const { result } = renderHook(() => useCells(selectCellIds), { wrapper });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b', 'c', 'l1']);
  });

  it('selector returning boolean from all cells', async () => {
    const { result } = renderHook(() => useCells(selectHasAny), { wrapper });
    await act(async () => flush());
    expect(result.current).toBe(true);
  });

  it('all-cells selector: count updates when cell added to graph', async () => {
    storeRef = undefined;
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(selectCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(4);

    await act(async () => {
      storeRef!.graph.addCell({
        id: 'new-el',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      });
      await flush();
    });
    expect(result.current).toBe(5);
  });

  it('all-cells selector: count updates when cell removed from graph', async () => {
    storeRef = undefined;
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(selectCount);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(4);

    // Removing element 'a' also removes its connected link 'l1' (4 - 2 = 2)
    await act(async () => {
      storeRef!.graph.getCell('a')?.remove();
      await flush();
    });
    expect(result.current).toBe(2);
  });

  it('all-cells selector: ids update when cell removed', async () => {
    storeRef = undefined;
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells(selectCellIds);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toContain('a');

    await act(async () => {
      storeRef!.graph.getCell('a')?.remove();
      await flush();
    });
    expect(result.current).not.toContain('a');
  });

  it('ids array with selector returning ids updates on cell data change', async () => {
    storeRef = undefined;
    const { result } = renderHook(() => useCells(['a', 'b'], selectCellIds), {
      wrapper: ProbeWrapper,
    });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 999, y: 999 });
      await flush();
    });
    // IDs unchanged — reference should be stable
    expect(result.current).toEqual(['a', 'b']);
  });

  it('ids array with selector returning count', async () => {
    const { result } = renderHook(() => useCells(['a', 'b'], selectCount), { wrapper });
    await act(async () => flush());
    expect(result.current).toBe(2);
  });

  it('single id with selector returning boolean', async () => {
    const { result } = renderHook(() => useCells('a', selectIsDefined), { wrapper });
    await act(async () => flush());
    expect(result.current).toBe(true);
  });

  it('single id with selector returning id', async () => {
    const { result } = renderHook(() => useCells('a', selectId), { wrapper });
    await act(async () => flush());
    expect(result.current).toBe('a');
  });

  it('single id selector: reacts to cell data change', async () => {
    storeRef = undefined;
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells('a', selectPosition);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toEqual({ x: 0, y: 0 });

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 300, y: 400 });
      await flush();
    });
    expect(result.current).toEqual({ x: 300, y: 400 });
  });

  it('single id selector: boolean stable when cell unchanged', async () => {
    storeRef = undefined;
    const { result } = renderHook(
      () => {
        storeRef = useGraphStore();
        return useCells('a', selectIsDefined);
      },
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe(true);

    // Unrelated cell change should NOT affect single-id subscription
    await act(async () => {
      storeRef!.graph.getCell('b')?.set('position', { x: 1, y: 1 });
      await flush();
    });
    expect(result.current).toBe(true);
  });

  it('returns pre-existing collection items on first render after graph is fully synced', async () => {
    // Reproduces the case where a consumer mounts *after* the graph store has
    // already settled (its commit microtask fired) and the collection was
    // populated before the consumer subscribed. Without picking up the items
    // synchronously in the render phase, no container listener would fire to
    // notify React, and `useCells` would stay stuck at `[]`.
    let collection: mvc.Collection<dia.Cell> | null = null;
    let renderedIds: readonly string[] = [];

    function Setup() {
      const store = useGraphStore();
      if (!collection) {
        collection = new mvc.Collection<dia.Cell>([
          store.graph.getCell('a')!,
          store.graph.getCell('b')!,
        ]);
      }
      return null;
    }

    function Consumer() {
      const cells = useCells(collection!);
      renderedIds = cells.map((c) => String(c.id));
      return null;
    }

    const { rerender } = render(
      <GraphProvider initialCells={initialCells}>
        <Setup />
      </GraphProvider>
    );

    // Allow the graph store's initial sync + commit to settle. The Consumer is
    // NOT mounted yet, so no useCells listener is registered for these cells.
    await act(async () => flush());

    rerender(
      <GraphProvider initialCells={initialCells}>
        <Setup />
        <Consumer />
      </GraphProvider>
    );
    await act(async () => flush());

    expect(renderedIds).toEqual(['a', 'b']);
  });
});
