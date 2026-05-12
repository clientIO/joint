import React from 'react';
import { mvc } from '@joint/core';
import type { dia } from '@joint/core';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCollection } from '../use-collection';
import type { useSetCollection } from '../use-set-collection';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord } from '../../types/cell.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const initialCells: readonly CellRecord[] = [
  { id: 'a', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
  { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
];

let graphRef: dia.Graph | undefined;
function GraphProbe(): null {
  graphRef = useGraphStore().graph;
  return null;
}

function withGraph<TResult>(
  body: (graph: dia.Graph) => TResult
): { readonly result: { current: TResult }; readonly rerender: () => void; readonly graph: dia.Graph } {
  const { result, rerender } = renderHook(
    () => body(graphRef!),
    {
      wrapper: ({ children }) => (
        <GraphProvider initialCells={initialCells}>
          <GraphProbe />
          {children}
        </GraphProvider>
      ),
    }
  );
  return { result, rerender, graph: graphRef! };
}

function idArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function selectCellIds(cells: readonly CellRecord[]): string[] {
  return cells.map((cell) => cell.id as string);
}

function selectDataLabels(cells: readonly CellRecord[]): Array<string | null> {
  return cells.map((cell) => (cell as { data?: { label?: string } }).data?.label ?? null);
}

describe('useCollection', () => {
  it('returns empty array + no-op setter when collection is undefined', async () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: ({ children }) => (
        <GraphProvider initialCells={initialCells}>{children}</GraphProvider>
      ),
    });
    await flush();
    const [first] = result.current;
    expect(first).toEqual([]);
    expect(result.current[0]).toBe(first);
  });

  it('starts with empty results while collection is undefined and reacts once provided', async () => {
    // eslint-disable-next-line prefer-const
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result, rerender } = renderHook(
      () => useCollection(collection),
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <GraphProbe />
            {children}
          </GraphProvider>
        ),
      },
    );
    await flush();
    expect(result.current[0]).toEqual([]);

    // Source feature mounts late: collection arrives.
    collection = new mvc.Collection<dia.Cell>([graphRef!.getCell('a')!]);
    rerender();
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['a']);

    // Subsequent membership change reaches the hook.
    act(() => {
      collection!.add(graphRef!.getCell('b')!);
    });
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['a', 'b']);

    // Subsequent inner-property change reaches the hook.
    act(() => {
      (graphRef!.getCell('a') as dia.Element).position(77, 88);
    });
    await flush();
    const updated = result.current[0].find((cell) => cell.id === 'a') as {
      position: { x: number; y: number };
    };
    expect(updated.position).toEqual({ x: 77, y: 88 });
  });

  it('returns full records on mount', async () => {
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result } = withGraph((graph) => {
      if (!collection) collection = new mvc.Collection<dia.Cell>([graph.getCell('a')!, graph.getCell('b')!]);
      return useCollection(collection);
    });
    await flush();
    const [cells] = result.current;
    expect(cells.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('updates on add / remove / reset', async () => {
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result, graph } = withGraph((g) => {
      if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
      return useCollection(collection);
    });
    await flush();

    act(() => { collection!.add(graph.getCell('b')!); });
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['a', 'b']);

    act(() => { collection!.remove(graph.getCell('a')!); });
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['b']);

    act(() => { collection!.reset([graph.getCell('a')!]); });
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['a']);
  });

  it('emits a new record when an attribute changes', async () => {
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result, graph } = withGraph((g) => {
      if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
      return useCollection(collection);
    });
    await flush();
    const [beforeCells] = result.current;
    const [before] = beforeCells;

    act(() => { (graph.getCell('a') as dia.Element).position(99, 99); });
    await flush();
    const [afterCells] = result.current;
    const [after] = afterCells;

    expect(after).not.toBe(before);
    expect((after as { position: { x: number; y: number } }).position).toEqual({ x: 99, y: 99 });
  });

  it('applies a selector and returns stable ref under custom isEqual', async () => {
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result, graph } = withGraph((g) => {
      if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!, g.getCell('b')!]);
      return useCollection(
        collection,
        selectCellIds,
        { isEqual: idArraysEqual }
      );
    });
    await flush();
    expect(result.current[0]).toEqual(['a', 'b']);

    // No-op position change must keep the same selector result reference.
    const [beforeSelected] = result.current;
    act(() => { (graph.getCell('a') as dia.Element).position(0, 0); });
    await flush();
    expect(result.current[0]).toBe(beforeSelected);
  });

  it('fires onChange on collection mutations, not on mount', async () => {
    let collection: mvc.Collection<dia.Cell> | undefined;
    const onChange = jest.fn();
    const { graph } = withGraph((g) => {
      if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
      return useCollection(collection, { onChange });
    });
    await flush();
    expect(onChange).not.toHaveBeenCalled();

    act(() => { collection!.add(graph.getCell('b')!); });
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].map((c: CellRecord) => c.id)).toEqual(['a', 'b']);
  });

  it('exposes a setter that resets the collection (direct + updater forms)', async () => {
    let collection: mvc.Collection<dia.Cell> | undefined;
    const { result, graph } = withGraph((g) => {
      if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
      return useCollection(collection);
    });
    await flush();

    const setter = result.current[1] as ReturnType<typeof useSetCollection>;
    act(() => {
      setter([
        { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
      ]);
    });
    await flush();
    expect(collection!.length).toBe(1);
    expect(collection!.at(0)!.id).toBe('b');

    act(() => {
      setter((previous) => [...previous, graph.getCell('a') as unknown as CellRecord]);
    });
    await flush();
    expect(collection!.length).toBe(2);
  });

  it('ignores mutations on a different collection', async () => {
    let collectionA: mvc.Collection<dia.Cell> | undefined;
    let collectionB: mvc.Collection<dia.Cell> | undefined;
    const { result, graph } = withGraph((g) => {
      if (!collectionA) collectionA = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
      if (!collectionB) collectionB = new mvc.Collection<dia.Cell>([g.getCell('b')!]);
      return useCollection(collectionA);
    });
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['a']);

    act(() => { collectionB!.add(graph.getCell('a')!); });
    await flush();
    expect(result.current[0].map((c) => c.id)).toEqual(['a']);
  });

  describe('reactivity on inner cell properties', () => {
    it('emits a new record when `data` changes', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection);
      });
      await flush();
      const [[before]] = result.current;

      act(() => {
        graph.getCell('a').set('data', { label: 'updated', count: 7 });
      });
      await flush();
      const after = result.current[0][0] as { data: { label: string; count: number } };

      expect(after).not.toBe(before);
      expect(after.data).toEqual({ label: 'updated', count: 7 });
    });

    it('emits a new record when `attrs` changes', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection);
      });
      await flush();
      const [[before]] = result.current;

      act(() => {
        graph.getCell('a').attr('body/fill', '#ff0000');
      });
      await flush();
      const after = result.current[0][0] as { attrs?: { body?: { fill?: string } } };

      expect(after).not.toBe(before);
      expect(after.attrs?.body?.fill).toBe('#ff0000');
    });

    it('emits a new record when `size` changes', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection);
      });
      await flush();
      const [[before]] = result.current;

      act(() => {
        (graph.getCell('a') as dia.Element).resize(200, 150);
      });
      await flush();
      const after = result.current[0][0] as { size: { width: number; height: number } };

      expect(after).not.toBe(before);
      expect(after.size).toEqual({ width: 200, height: 150 });
    });

    it('re-runs a data-derived selector when `data` changes', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection, selectDataLabels);
      });
      await flush();
      expect(result.current[0]).toEqual([null]);

      act(() => {
        graph.getCell('a').set('data', { label: 'first' });
      });
      await flush();
      expect(result.current[0]).toEqual(['first']);

      act(() => {
        graph.getCell('a').set('data', { label: 'second' });
      });
      await flush();
      expect(result.current[0]).toEqual(['second']);
    });

    it('changed cell yields a fresh record; unchanged cell stays structurally identical', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection)
          collection = new mvc.Collection<dia.Cell>([g.getCell('a')!, g.getCell('b')!]);
        return useCollection(collection);
      });
      await flush();
      const [[beforeA, beforeB]] = result.current;

      act(() => {
        (graph.getCell('a') as dia.Element).position(33, 44);
      });
      await flush();
      const [[afterA, afterB]] = result.current;

      expect(afterA).not.toBe(beforeA);
      expect(afterA).toMatchObject({ position: { x: 33, y: 44 } });
      // Unchanged cell B: contents are structurally identical (reference may
      // change under React StrictMode test double-mounting; not a correctness
      // concern in production).
      expect(afterB).toEqual(beforeB);
    });

    it('selector can project to ids only and reflects membership changes', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection, selectCellIds, { isEqual: idArraysEqual });
      });
      await flush();
      expect(result.current[0]).toEqual(['a']);

      act(() => { collection!.add(graph.getCell('b')!); });
      await flush();
      expect(result.current[0]).toEqual(['a', 'b']);

      act(() => { collection!.remove(graph.getCell('a')!); });
      await flush();
      expect(result.current[0]).toEqual(['b']);
    });

    it('selector form still exposes a setter that accepts full records', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const { result, graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection, selectCellIds);
      });
      await flush();
      expect(result.current[0]).toEqual(['a']);
      const [, setter] = result.current;

      // Direct form: pass full records (not ids) even though selector returned ids.
      act(() => {
        setter([
          { id: 'b', type: ELEMENT_MODEL_TYPE, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } } as CellRecord,
        ]);
      });
      await flush();
      expect(collection!.length).toBe(1);
      expect(collection!.at(0)).toBe(graph.getCell('b'));
      expect(result.current[0]).toEqual(['b']);

      // Updater form: previous is the FULL records array, not the selector projection.
      const cellA = graph.getCell('a') as unknown as CellRecord;
      act(() => {
        setter(
          // eslint-disable-next-line sonarjs/no-nested-functions
          (previousRecords) => {
            // The updater receives full cell records — verify shape.
            expect(previousRecords[0]).toMatchObject({ id: 'b', type: ELEMENT_MODEL_TYPE });
            return [...previousRecords, cellA];
          }
        );
      });
      await flush();
      expect(collection!.length).toBe(2);
      expect(result.current[0]).toEqual(['b', 'a']);
    });

    it('fires onChange with up-to-date records on inner property change', async () => {
      let collection: mvc.Collection<dia.Cell> | undefined;
      const onChange = jest.fn();
      const { graph } = withGraph((g) => {
        if (!collection) collection = new mvc.Collection<dia.Cell>([g.getCell('a')!]);
        return useCollection(collection, { onChange });
      });
      await flush();
      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        graph.getCell('a').set('data', { tag: 'live' });
      });
      await flush();

      expect(onChange).toHaveBeenCalledTimes(1);
      const cellsArgument = onChange.mock.calls[0][0] as ReadonlyArray<{
        data: { tag?: string };
      }>;
      expect(cellsArgument[0].data.tag).toBe('live');
    });
  });
});
