import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useGraph } from '../use-graph';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord, ElementRecord, DiaCellAttributes } from '../../types/cell.types';

const INITIAL: readonly CellRecord[] = [
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
    id: 'l1',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
  } as CellRecord,
];

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={INITIAL}>{children}</GraphProvider>;
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

// Hoisted so the nested-function-depth lint rule doesn't fire inside the
// `await act(async () => { ... })` + `setCell(fn)` call stack.
function shiftAXBy10(previous: DiaCellAttributes): DiaCellAttributes {
  if (previous.id !== 'a') return { id: 'a', type: ELEMENT_MODEL_TYPE } as CellRecord;
  const element = previous as ElementRecord;
  return {
    ...element,
    position: { x: (element.position?.x ?? 0) + 10, y: 0 },
  } as CellRecord;
}

describe('useGraph', () => {
  it('exposes the graph instance and the unified setter API', async () => {
    const { result } = renderHook(() => useGraph(), { wrapper });
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current.graph).toBeDefined();
    expect(typeof result.current.setCell).toBe('function');
    expect(typeof result.current.removeCell).toBe('function');
    expect(typeof result.current.resetCells).toBe('function');
    expect(typeof result.current.isElement).toBe('function');
    expect(typeof result.current.isLink).toBe('function');
  });

  describe('setCell — add path (id missing on graph)', () => {
    it('adds a new cell when no cell with the given id exists', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCell({
          id: 'c',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 100, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord);
        await flush();
      });
      expect(result.current.graph.getCell('c')).toBeDefined();
      expect(result.current.graph.getCell('c')?.get('position')).toEqual({ x: 100, y: 0 });
    });
  });

  describe('setCell — update path (id exists)', () => {
    it('updates an existing cell via full CellRecord (id from cell.id)', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCell({
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 999, y: 999 },
        } as CellRecord);
        await flush();
      });
      const cell = result.current.graph.getCell('a');
      expect(cell?.get('position')).toEqual({ x: 999, y: 999 });
    });

    it('supports an updater function setCell(id, prev => next)', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await flush();
      await act(async () => {
        result.current.setCell('a', shiftAXBy10);
        await flush();
      });
      expect(result.current.graph.getCell('a')?.get('position')).toEqual({ x: 10, y: 0 });
    });

    it('invokes the updater exactly once with the real previous record', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await flush();
      const updater = jest.fn((previous: DiaCellAttributes) => {
        const element = previous as ElementRecord;
        return {
          ...element,
          position: { x: (element.position?.x ?? 0) + 5, y: 0 },
        } as CellRecord;
      });
      await act(async () => {
        result.current.setCell('a', updater);
        await flush();
      });
      expect(updater).toHaveBeenCalledTimes(1);
      const [[previous]] = updater.mock.calls;
      expect(previous.id).toBe('a');
      expect(previous.type).toBe(ELEMENT_MODEL_TYPE);
    });
  });

  describe('removeCell', () => {
    it('removes a cell by id', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.removeCell('a');
        await flush();
      });
      expect(result.current.graph.getCell('a')).toBeUndefined();
    });

    it('is a no-op for missing ids', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      expect(() => result.current.removeCell('missing')).not.toThrow();
    });
  });

  describe('resetCells', () => {
    it('replaces all cells atomically', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.resetCells([
          {
            id: 'z',
            type: ELEMENT_MODEL_TYPE,
            position: { x: 0, y: 0 },
            size: { width: 10, height: 10 },
          } as CellRecord,
        ]);
        await flush();
      });
      expect(result.current.graph.getCell('z')).toBeDefined();
      expect(result.current.graph.getCell('a')).toBeUndefined();
    });
  });

  describe('setCell — store/hook propagation (regression for the "typing does nothing" bug)', () => {
    it('updates the cells container synchronously enough for useCells subscribers to re-read', async () => {
      // Before the REACT_FLAG removal, setCell called diaCell.set(attrs, {
      // isUpdateFromReact: true }) which made the graph-changes listener
      // skip the 'change' event — so the cells container never updated and
      // hooks that read via useCells(selector) returned stale data. A
      // controlled <input value={label}> then reset the user's keystroke.
      const { result } = renderHook(() => ({ api: useGraph(), store: useGraphStore() }), {
        wrapper,
      });
      await waitFor(() => expect(result.current).toBeDefined());
      await flush();

      await act(async () => {
        const existing = result.current.store.graphView.cells.get('a')!;
        result.current.api.setCell({
          ...(existing as CellRecord),
          data: { label: 'typed-once' },
        } as CellRecord);
        await flush();
      });

      const afterFirst = result.current.store.graphView.cells.get('a') as
        | (CellRecord & { data?: { label?: string } })
        | undefined;
      expect(afterFirst?.data?.label).toBe('typed-once');
    });
  });

  describe('isElement / isLink', () => {
    it('narrows an element cell', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      expect(result.current.isElement({ id: 'a', type: ELEMENT_MODEL_TYPE } as CellRecord)).toBe(
        true
      );
      expect(result.current.isLink({ id: 'a', type: ELEMENT_MODEL_TYPE } as CellRecord)).toBe(
        false
      );
    });

    it('narrows a link cell', async () => {
      const { result } = renderHook(() => useGraph(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      expect(result.current.isLink({ id: 'l1', type: LINK_MODEL_TYPE } as CellRecord)).toBe(true);
      expect(result.current.isElement({ id: 'l1', type: LINK_MODEL_TYPE } as CellRecord)).toBe(
        false
      );
    });

    it('classifies cells fetched from the graph view container', async () => {
      const { result } = renderHook(() => ({ api: useGraph(), store: useGraphStore() }), {
        wrapper,
      });
      await waitFor(() => expect(result.current).toBeDefined());
      await flush();
      const elementCell = result.current.store.graphView.cells.get('a')!;
      const linkCell = result.current.store.graphView.cells.get('l1')!;
      expect(result.current.api.isElement(elementCell)).toBe(true);
      expect(result.current.api.isLink(linkCell)).toBe(true);
    });
  });
});
