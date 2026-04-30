import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
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

  it('selector form runs the selector on the cells array', async () => {
    const { result } = renderHook(() => useCells((cells) => cells.length), { wrapper });
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
    const { result } = renderHook(() => useCells((cells) => cells.length), {
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
