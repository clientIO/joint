/* eslint-disable sonarjs/no-nested-functions */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { mvc, type dia } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellId, CellRecord } from '../../types/cell.types';

const makeElement = (id: string, x = 0): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y: 0 },
    size: { width: 10, height: 10 },
  }) as CellRecord;

const initialCells: readonly CellRecord[] = [
  makeElement('a', 0),
  makeElement('b', 50),
  makeElement('c', 100),
];

const makeCollection = () => new mvc.Collection<dia.Cell>();

let storeRef: ReturnType<typeof useGraphStore> | undefined;
function StoreProbe() {
  storeRef = useGraphStore();
  return null;
}
function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GraphProvider initialCells={initialCells}>
      <StoreProbe />
      {children}
    </GraphProvider>
  );
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const ids = (cells: readonly CellRecord[]) => cells.map((cell) => String(cell.id));

describe('useCells (ids array form) — graph membership reactivity', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('picks up a subscribed id that did not exist at subscribe time', async () => {
    // Subscribe to 'x' before it exists. The per-id subscription must fire when
    // the matching cell is later added to the graph.
    const { result } = renderHook(() => useCells(['a', 'x']), { wrapper: Wrapper });
    await act(async () => flush());
    expect(ids(result.current)).toEqual(['a']);

    await act(async () => {
      storeRef!.graph.addCell(makeElement('x', 200));
      await flush();
    });
    expect(ids(result.current)).toEqual(['a', 'x']);
  });

  it('drops a subscribed id when its cell is removed from the graph', async () => {
    const { result } = renderHook(() => useCells(['a', 'b']), { wrapper: Wrapper });
    await act(async () => flush());
    expect(ids(result.current)).toEqual(['a', 'b']);

    await act(async () => {
      storeRef!.graph.getCell('b')?.remove();
      await flush();
    });
    expect(ids(result.current)).toEqual(['a']);
  });

  it('reacts to remove → re-add of the same subscribed id', async () => {
    const { result } = renderHook(() => useCells(['a', 'b']), { wrapper: Wrapper });
    await act(async () => flush());
    expect(ids(result.current)).toEqual(['a', 'b']);

    await act(async () => {
      storeRef!.graph.getCell('b')?.remove();
      await flush();
    });
    expect(ids(result.current)).toEqual(['a']);

    await act(async () => {
      storeRef!.graph.addCell(makeElement('b', 50));
      await flush();
    });
    expect(ids(result.current)).toEqual(['a', 'b']);
  });

  it('re-subscribes when the ids array prop itself gains an id', async () => {
    const { result, rerender } = renderHook(({ list }: { list: readonly CellId[] }) => useCells(list), {
      wrapper: Wrapper,
      initialProps: { list: ['a', 'b'] as readonly CellId[] },
    });
    await act(async () => flush());
    expect(ids(result.current)).toEqual(['a', 'b']);

    // Caller adds 'c' to the tracked id list.
    rerender({ list: ['a', 'b', 'c'] });
    await act(async () => flush());
    expect(ids(result.current)).toEqual(['a', 'b', 'c']);

    // A change to the newly-tracked 'c' must now trigger an update.
    await act(async () => {
      storeRef!.graph.getCell('c')?.set('position', { x: 777, y: 0 });
      await flush();
    });
    expect(result.current.find((cell) => cell.id === 'c')?.position).toEqual({ x: 777, y: 0 });
  });

  it('stops reacting to an id removed from the ids array prop', async () => {
    const renderSpy = jest.fn();
    const { rerender } = renderHook(
      ({ list }: { list: readonly CellId[] }) => {
        renderSpy();
        return useCells(list);
      },
      { wrapper: Wrapper, initialProps: { list: ['a', 'b'] as readonly CellId[] } }
    );
    await act(async () => flush());

    // Drop 'b' from the tracked list.
    rerender({ list: ['a'] });
    await act(async () => flush());
    const baseline = renderSpy.mock.calls.length;

    // Mutating the no-longer-tracked 'b' must not re-render.
    await act(async () => {
      storeRef!.graph.getCell('b')?.set('position', { x: 1, y: 1 });
      await flush();
    });
    expect(renderSpy.mock.calls.length).toBe(baseline);
  });
});

describe('useCells (single id form) — graph membership reactivity', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('resolves a single id that is added after subscribe time', async () => {
    const { result } = renderHook(() => useCells('z'), { wrapper: Wrapper });
    await act(async () => flush());
    expect(result.current).toBeUndefined();

    await act(async () => {
      storeRef!.graph.addCell(makeElement('z', 300));
      await flush();
    });
    expect(result.current?.id).toBe('z');
  });

  it('becomes undefined when the tracked id is removed', async () => {
    const { result } = renderHook(() => useCells('a'), { wrapper: Wrapper });
    await act(async () => flush());
    expect(result.current?.id).toBe('a');

    await act(async () => {
      storeRef!.graph.getCell('a')?.remove();
      await flush();
    });
    expect(result.current).toBeUndefined();
  });
});

describe('useCells (collection form) — interleaved membership reactivity', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('tracks add then remove of the same id', async () => {
    const collection = makeCollection();
    const { result } = renderHook(() => useCells(collection, ids), { wrapper: Wrapper });
    await act(async () => flush());
    expect(result.current).toEqual([]);

    await act(async () => {
      collection.add(storeRef!.graph.getCell('a'));
      await flush();
    });
    expect(result.current).toEqual(['a']);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('a'));
      await flush();
    });
    expect(result.current).toEqual([]);
  });

  it('tracks multiple adds and a single remove without losing the rest', async () => {
    const collection = makeCollection();
    const { result } = renderHook(() => useCells(collection, ids), { wrapper: Wrapper });
    await act(async () => flush());

    await act(async () => {
      collection.add(storeRef!.graph.getCell('a'));
      collection.add(storeRef!.graph.getCell('b'));
      collection.add(storeRef!.graph.getCell('c'));
      await flush();
    });
    expect(result.current).toEqual(['a', 'b', 'c']);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('b'));
      await flush();
    });
    expect(result.current).toEqual(['a', 'c']);
  });

  it('no-selector array form reflects add and remove', async () => {
    const collection = makeCollection();
    const { result } = renderHook(() => useCells(collection), { wrapper: Wrapper });
    await act(async () => flush());
    expect(result.current).toHaveLength(0);

    await act(async () => {
      collection.add(storeRef!.graph.getCell('a'));
      collection.add(storeRef!.graph.getCell('b'));
      await flush();
    });
    expect(ids(result.current)).toEqual(['a', 'b']);

    await act(async () => {
      collection.remove(storeRef!.graph.getCell('a'));
      await flush();
    });
    expect(ids(result.current)).toEqual(['b']);
  });

  it('reacts to a cell change after it was re-added to the collection', async () => {
    const collection = makeCollection();
    const { result } = renderHook(
      () => useCells(collection, (cells) => cells.map((cell) => cell.position?.x ?? -1)),
      { wrapper: Wrapper }
    );
    await act(async () => flush());

    await act(async () => {
      collection.add(storeRef!.graph.getCell('a'));
      await flush();
    });
    await act(async () => {
      collection.remove(storeRef!.graph.getCell('a'));
      await flush();
    });
    await act(async () => {
      collection.add(storeRef!.graph.getCell('a'));
      await flush();
    });

    await act(async () => {
      storeRef!.graph.getCell('a')?.set('position', { x: 42, y: 0 });
      await flush();
    });
    expect(result.current).toEqual([42]);
  });
});
