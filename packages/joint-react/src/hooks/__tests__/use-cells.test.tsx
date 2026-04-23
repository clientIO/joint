import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { Cells, CellRecord } from '../../types/cell.types';

const initialCells: Cells = [
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
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const countLinks = (cells: readonly CellRecord[]) =>
  cells.filter((c) => c.type === LINK_MODEL_TYPE).length;

describe('useCells', () => {
  it('no-arg form returns the full cells array', async () => {
    const { result } = renderHook(() => useCells(), { wrapper });
    await act(async () => flush());
    expect(result.current).toBeDefined();
    expect(result.current.length).toBe(3);
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
    expect(result.current).toBe(3);
  });

  it('selector form returns the same reference when equality holds', async () => {
    const { result, rerender } = renderHook(() => useCells(countLinks), { wrapper });
    await act(async () => flush());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('re-renders when a subscribed id changes', async () => {
    let storeRef!: ReturnType<typeof useGraphStore>;
    function Probe() {
      storeRef = useGraphStore();
      return null;
    }
    const { result } = renderHook(
      () => {
        return useCells('a');
      },
      {
        wrapper: ({ children }) => (
          <GraphProvider initialCells={initialCells}>
            <Probe />
            {children}
          </GraphProvider>
        ),
      }
    );
    await act(async () => flush());
    const before = result.current;

    await act(async () => {
      storeRef.graph.getCell('a')?.set('position', { x: 999, y: 999 });
      await flush();
    });
    expect(result.current).not.toBe(before);
  });
});
