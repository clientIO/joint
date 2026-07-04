import { renderHook, act, waitFor } from '@testing-library/react';
import { shapes, type dia } from '@joint/core';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import {
  useSetCell,
  useSetCellData,
  useRemoveCell,
  useRemoveCells,
  useResetCells,
  useUpdateCells,
} from '../use-cell-setters';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE, ElementModel } from '../../mvc/element-model';
import { LINK_MODEL_TYPE, LinkModel } from '../../mvc/link-model';
import type {
  AnyCellRecord,
  CellRecord,
  ElementRecord,
} from '../../types/cell.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const baseCells: readonly CellRecord[] = [
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

const wrapper = graphProviderWrapper({ initialCells: baseCells });

const setCellAUpdater = (previous: AnyCellRecord): CellRecord => {
  const element = previous as ElementRecord;
  return {
    ...element,
    position: { x: 11, y: 22 },
  } as CellRecord;
};

const passthroughUpdater = (previous: AnyCellRecord) => previous as CellRecord;

const filterOutCellA = (previous: readonly AnyCellRecord[]): readonly AnyCellRecord[] =>
  previous.filter((cell) => cell.id !== 'a');

const filterOutCellB = (previous: readonly AnyCellRecord[]): readonly AnyCellRecord[] =>
  previous.filter((cell) => cell.id !== 'b');

const moveCellAFar = (previous: readonly AnyCellRecord[]): readonly AnyCellRecord[] =>
  previous.map((cell) => {
    if (cell.id !== 'a') return cell;
    const element = cell as ElementRecord;
    return {
      ...element,
      position: { x: 999, y: 999 },
    } as AnyCellRecord;
  });

const appendFromUpdater = new ElementModel({
  id: 'from-updater',
  position: { x: 0, y: 0 },
  size: { width: 10, height: 10 },
});
const appendDiaCellUpdater = (previous: readonly AnyCellRecord[]) => [...previous, appendFromUpdater];

const updateLink = new LinkModel({
  id: 'update-link',
  source: { id: 'a' },
  target: { id: 'b' },
});
const appendDiaLinkUpdater = (previous: readonly AnyCellRecord[]) => [...previous, updateLink];

// Hoisted setCellData updaters — kept at module scope so the arrows do not nest
// past the `sonarjs/no-nested-functions` depth limit inside `it`/`act`.
const incrementDataCount = (previous: Record<string, unknown>): Record<string, unknown> => ({
  ...previous,
  count: Number(previous.count) + 1,
});

let receivedPreviousData: unknown;
const recordPreviousData = (previous: Record<string, unknown>): Record<string, unknown> => {
  receivedPreviousData = previous;
  return previous;
};

interface NodeData {
  readonly label: string;
  readonly count: number;
}
const incrementNodeDataCount = (previous: NodeData): NodeData => ({
  ...previous,
  count: previous.count + 1,
});

describe('use-cell-setters', () => {
  describe('useSetCell — happy paths', () => {
    it('adds a cell via the direct form when the id is missing on the graph', async () => {
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCell({
          id: 'new-id',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 1, y: 2 },
          size: { width: 1, height: 1 },
        } as CellRecord);
        await flush();
      });
      expect(result.current.store.graph.getCell('new-id')).toBeDefined();
    });

    it('merges a partial record via the direct form when the id exists (lines 68–75)', async () => {
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCell({
          id: 'a',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 7, y: 8 },
        } as CellRecord);
        await flush();
      });
      const cell = result.current.store.graph.getCell('a');
      expect(cell?.get('position')).toEqual({ x: 7, y: 8 });
    });

    it('updater form applies the updater to the existing record (line 111)', async () => {
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCell('a', setCellAUpdater);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')?.get('position')).toEqual({ x: 11, y: 22 });
    });
  });

  describe('useSetCell — missing target warns and no-ops', () => {
    it('warns and no-ops when called with a record that has no `id`', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const before = result.current.store.graph.getCells().length;
      await act(async () => {
        result.current.setCell({ type: ELEMENT_MODEL_TYPE } as unknown as CellRecord);
        await flush();
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[setCell]'));
      expect(result.current.store.graph.getCells().length).toBe(before);
      warn.mockRestore();
    });

    it('updater form warns and no-ops when the id is nullish', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useSetCell(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current(null, passthroughUpdater);
        await flush();
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[setCell]'));
      warn.mockRestore();
    });

    it('updater form warns and no-ops when no cell with the given id exists', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useSetCell(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current('missing', passthroughUpdater);
        await flush();
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[setCell]'));
      warn.mockRestore();
    });
  });

  describe('useRemoveCells', () => {
    it('removes the matching cells in a single batch', async () => {
      const { result } = renderHook(
        () => ({ removeCells: useRemoveCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.removeCells(['a', 'b']);
        await flush();
      });
      // Both removed; the link with both endpoints gone is also cleaned up.
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
      expect(result.current.store.graph.getCell('b')).toBeUndefined();
    });

    it('skips ids that do not resolve to a cell (lines 142–145)', async () => {
      const { result } = renderHook(
        () => ({ removeCells: useRemoveCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.removeCells(['missing-1', 'a', 'missing-2']);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
      expect(result.current.store.graph.getCell('b')).toBeDefined();
    });

    it('is a no-op when every id is missing (line 147)', async () => {
      const { result } = renderHook(
        () => ({ removeCells: useRemoveCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const before = result.current.store.graph.getCells().length;
      await act(async () => {
        result.current.removeCells(['no-such-id', 'also-missing']);
        await flush();
      });
      expect(result.current.store.graph.getCells().length).toBe(before);
    });
  });

  describe('useRemoveCell', () => {
    it('is a no-op when the id does not resolve to a cell (line 125)', async () => {
      const { result } = renderHook(() => useRemoveCell(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      expect(() => result.current('does-not-exist')).not.toThrow();
    });

    it('warns and no-ops when the reference is nullish', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(
        () => ({ removeCell: useRemoveCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const before = result.current.store.graph.getCells().length;
      await act(async () => {
        result.current.removeCell(null);
        await flush();
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[removeCell]'));
      expect(result.current.store.graph.getCells().length).toBe(before);
      warn.mockRestore();
    });

    it('removes a single cell when present', async () => {
      const { result } = renderHook(
        () => ({ removeCell: useRemoveCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.removeCell('a');
        await flush();
      });
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
    });

    it('removes a cell by dia.Cell reference', async () => {
      const { result } = renderHook(
        () => ({ removeCell: useRemoveCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const diaCell = result.current.store.graph.getCell('a')!;
      await act(async () => {
        result.current.removeCell(diaCell);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
    });
  });

  describe('useRemoveCells — CellRef acceptance', () => {
    it('removes cells by dia.Cell references', async () => {
      const { result } = renderHook(
        () => ({ removeCells: useRemoveCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const cellA = result.current.store.graph.getCell('a')!;
      const cellB = result.current.store.graph.getCell('b')!;
      await act(async () => {
        result.current.removeCells([cellA, cellB]);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
      expect(result.current.store.graph.getCell('b')).toBeUndefined();
    });

    it('removes cells with a mix of ids and dia.Cell references', async () => {
      const { result } = renderHook(
        () => ({ removeCells: useRemoveCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const cellB = result.current.store.graph.getCell('b')!;
      await act(async () => {
        result.current.removeCells(['a', cellB]);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
      expect(result.current.store.graph.getCell('b')).toBeUndefined();
    });
  });

  describe('useResetCells', () => {
    it('atomically replaces the cells array', async () => {
      const { result } = renderHook(
        () => ({ resetCells: useResetCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.resetCells([
          {
            id: 'z',
            type: ELEMENT_MODEL_TYPE,
            position: { x: 10, y: 10 },
            size: { width: 10, height: 10 },
          } as CellRecord,
        ]);
        await flush();
      });
      expect(result.current.store.graph.getCell('z')).toBeDefined();
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
    });

    it('accepts an updater function with the current cells snapshot', async () => {
      const { result } = renderHook(
        () => ({ resetCells: useResetCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.resetCells(filterOutCellA);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
      expect(result.current.store.graph.getCell('b')).toBeDefined();
    });
  });

  describe('useUpdateCells (lines 204–205)', () => {
    it('applies an updater that filters out a cell', async () => {
      const { result } = renderHook(
        () => ({ updateCells: useUpdateCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.updateCells(filterOutCellB);
        await flush();
      });
      expect(result.current.store.graph.getCell('b')).toBeUndefined();
    });

    it('applies an updater that mutates an element position', async () => {
      const { result } = renderHook(
        () => ({ updateCells: useUpdateCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.updateCells(moveCellAFar);
        await flush();
      });
      const updated = result.current.store.graph.getCell('a');
      expect(updated?.get('position')).toEqual({ x: 999, y: 999 });
    });
  });

  describe('useSetCell — dia.Cell acceptance', () => {
    it('adds an ElementModel via the direct form', async () => {
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const diaElement = new ElementModel({
        id: 'dia-new',
        position: { x: 1, y: 2 },
        size: { width: 30, height: 30 },
        data: { label: 'from-dia' },
      });
      await act(async () => {
        result.current.setCell(diaElement);
        await flush();
      });
      const cell = result.current.store.graph.getCell('dia-new');
      expect(cell).toBeDefined();
      expect(cell?.get('position')).toEqual({ x: 1, y: 2 });
      expect(cell?.get('data')).toEqual({ label: 'from-dia' });
    });

    it('adds a shapes.standard.Rectangle via the direct form', async () => {
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const rect = new shapes.standard.Rectangle({
        id: 'rect-new',
        position: { x: 5, y: 5 },
        size: { width: 50, height: 40 },
      });
      await act(async () => {
        result.current.setCell(rect);
        await flush();
      });
      const cell = result.current.store.graph.getCell('rect-new');
      expect(cell).toBeDefined();
      expect(cell?.get('type')).toBe('standard.Rectangle');
      expect(cell?.get('position')).toEqual({ x: 5, y: 5 });
    });

    it('merges a dia.Cell over an existing cell with the same id', async () => {
      const { result } = renderHook(
        () => ({ setCell: useSetCell(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const updated = new ElementModel({
        id: 'a',
        position: { x: 77, y: 88 },
        size: { width: 10, height: 10 },
      });
      await act(async () => {
        result.current.setCell(updated);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')?.get('position')).toEqual({ x: 77, y: 88 });
    });
  });

  describe('useResetCells — dia.Cell acceptance', () => {
    it('resets with an array of dia.Cell instances', async () => {
      const { result } = renderHook(
        () => ({ resetCells: useResetCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const diaElement = new ElementModel({
        id: 'reset-dia',
        position: { x: 10, y: 10 },
        size: { width: 20, height: 20 },
      });
      await act(async () => {
        result.current.resetCells([diaElement]);
        await flush();
      });
      expect(result.current.store.graph.getCell('reset-dia')).toBeDefined();
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
    });

    it('resets with a mixed array of records and dia.Cell instances', async () => {
      const { result } = renderHook(
        () => ({ resetCells: useResetCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const record = {
        id: 'rec-z',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord;
      const diaElement = new ElementModel({
        id: 'dia-z',
        position: { x: 50, y: 50 },
        size: { width: 20, height: 20 },
      });
      await act(async () => {
        result.current.resetCells([record, diaElement]);
        await flush();
      });
      expect(result.current.store.graph.getCell('rec-z')).toBeDefined();
      expect(result.current.store.graph.getCell('dia-z')).toBeDefined();
      expect(result.current.store.graph.getCell('a')).toBeUndefined();
    });

    it('accepts dia.Cell from an updater function', async () => {
      const { result } = renderHook(
        () => ({ resetCells: useResetCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.resetCells(appendDiaCellUpdater);
        await flush();
      });
      expect(result.current.store.graph.getCell('from-updater')).toBeDefined();
      expect(result.current.store.graph.getCell('a')).toBeDefined();
    });
  });

  describe('useUpdateCells — dia.Cell acceptance', () => {
    it('appends a dia.Cell via an updater', async () => {
      const { result } = renderHook(
        () => ({ updateCells: useUpdateCells(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.updateCells(appendDiaLinkUpdater);
        await flush();
      });
      expect(result.current.store.graph.getCell('update-link')).toBeDefined();
    });
  });

  describe('useSetCellData', () => {
    it('replaces a cell’s data via the direct form', async () => {
      const { result } = renderHook(
        () => ({ setCellData: useSetCellData(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCellData('a', { label: 'hello' });
        await flush();
      });
      expect(result.current.store.graph.getCell('a')?.get('data')).toEqual({ label: 'hello' });
    });

    it('applies the updater to the current data and replaces it', async () => {
      const { result } = renderHook(
        () => ({ setCellData: useSetCellData(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCellData('a', { count: 1 });
        await flush();
      });
      await act(async () => {
        result.current.setCellData('a', incrementDataCount);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')?.get('data')).toEqual({ count: 2 });
    });

    it('passes the real previous data to the updater', async () => {
      const { result } = renderHook(
        () => ({ setCellData: useSetCellData(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCellData('a', { seed: 42 });
        await flush();
      });
      receivedPreviousData = undefined;
      await act(async () => {
        result.current.setCellData('a', recordPreviousData);
        await flush();
      });
      expect(receivedPreviousData).toEqual({ seed: 42 });
    });

    it('sets data on a link cell', async () => {
      const { result } = renderHook(
        () => ({ setCellData: useSetCellData(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCellData('l1', { weight: 5 });
        await flush();
      });
      expect(result.current.store.graph.getCell('l1')?.get('data')).toEqual({ weight: 5 });
    });

    it('warns and no-ops when no cell with the given id exists', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useSetCellData(), { wrapper });
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current('missing', { any: true });
        await flush();
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[setCellData]'));
      warn.mockRestore();
    });

    it('warns and no-ops when the id is nullish', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(
        () => ({ setCellData: useSetCellData(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      const before = result.current.store.graph.getCell('a')?.get('data');
      await act(async () => {
        result.current.setCellData(null, { any: true });
        await flush();
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[setCellData]'));
      expect(result.current.store.graph.getCell('a')?.get('data')).toEqual(before);
      warn.mockRestore();
    });

    it('supports an explicit data type via the generic parameter', async () => {
      const { result } = renderHook(
        () => ({ setCellData: useSetCellData<NodeData>(), store: useGraphStore() }),
        { wrapper }
      );
      await waitFor(() => expect(result.current).toBeDefined());
      await act(async () => {
        result.current.setCellData('a', { label: 'typed', count: 0 });
        await flush();
      });
      await act(async () => {
        result.current.setCellData('a', incrementNodeDataCount);
        await flush();
      });
      expect(result.current.store.graph.getCell('a')?.get('data')).toEqual({
        label: 'typed',
        count: 1,
      });
    });
  });
});

// The JointJS event `opt` is always the handler's last argument.
function captureOpt(graph: dia.Graph, event: string) {
  const captured: { opt?: Record<string, unknown> } = {};
  graph.on(event, (...args: unknown[]) => {
    captured.opt = args.at(-1) as Record<string, unknown>;
  });
  return captured;
}

function renderSetters() {
  return renderHook(
    () => ({
      setCell: useSetCell(),
      setCellData: useSetCellData(),
      removeCell: useRemoveCell(),
      removeCells: useRemoveCells(),
      resetCells: useResetCells(),
      updateCells: useUpdateCells(),
      store: useGraphStore(),
    }),
    { wrapper }
  );
}

describe('setter metadata forwarding', () => {
  it('setCell (updater) forwards metadata to the change opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'change');
    act(() => result.current.setCell('a', setCellAUpdater, { tag: 'meta' }));
    expect(captured.opt?.tag).toBe('meta');
  });

  it('setCell (direct add) forwards metadata to the add opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'add');
    act(() =>
      result.current.setCell(
        {
          id: 'c',
          type: ELEMENT_MODEL_TYPE,
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
        } as CellRecord,
        { tag: 'meta' }
      )
    );
    expect(captured.opt?.tag).toBe('meta');
  });

  it('setCellData forwards metadata to the change opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'change');
    act(() => result.current.setCellData('a', { label: 'x' }, { tag: 'meta' }));
    expect(captured.opt?.tag).toBe('meta');
  });

  it('removeCell forwards metadata to the remove opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'remove');
    act(() => result.current.removeCell('b', { tag: 'meta' }));
    expect(captured.opt?.tag).toBe('meta');
  });

  it('removeCells forwards metadata to the remove opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'remove');
    act(() => result.current.removeCells(['b'], { tag: 'meta' }));
    expect(captured.opt?.tag).toBe('meta');
  });

  it('resetCells forwards metadata to the reset opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'reset');
    act(() => result.current.resetCells([...baseCells], { tag: 'meta' }));
    expect(captured.opt?.tag).toBe('meta');
  });

  it('updateCells forwards metadata to the synced event opt', async () => {
    const { result } = renderSetters();
    await waitFor(() => expect(result.current).toBeDefined());
    const captured = captureOpt(result.current.store.graph, 'remove');
    act(() => result.current.updateCells(filterOutCellB, { tag: 'meta' }));
    expect(captured.opt?.tag).toBe('meta');
  });
});
