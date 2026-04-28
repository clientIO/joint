import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
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

// Module-scoped selectors so render iterations re-use the same function
// reference (closer to a real call site).
const idSelector = (cells: readonly CellRecord[]) => cells.map((cell) => cell.id);
const elementFilterSelector = (cells: readonly CellRecord[]) =>
  cells.filter((cell) => cell.type === ELEMENT_MODEL_TYPE);

describe('useCells selector reference stability', () => {
  it('returns a stable array reference across renders when a map selector output is unchanged', async () => {
    const { result, rerender } = renderHook(() => useCells(idSelector), { wrapper });
    await act(async () => {
      await flush();
    });
    const firstSnapshot = result.current;
    rerender();
    await act(async () => {
      await flush();
    });
    const secondSnapshot = result.current;
    expect(secondSnapshot).toBe(firstSnapshot);
  });

  it('returns a stable array reference across renders when a filter selector output is unchanged', async () => {
    const { result, rerender } = renderHook(() => useCells(elementFilterSelector), {
      wrapper,
    });
    await act(async () => {
      await flush();
    });
    const firstSnapshot = result.current;
    rerender();
    await act(async () => {
      await flush();
    });
    const secondSnapshot = result.current;
    expect(secondSnapshot).toBe(firstSnapshot);
  });
});
