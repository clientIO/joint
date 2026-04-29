import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCells } from '../use-cells';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import type { CellRecord, ElementRecord, Computed } from '../../types/cell.types';

interface ElementUserData {
  readonly label: string;
}
type MyElement = Computed<ElementRecord<ElementUserData>>;

const pickLabels = (cells: readonly MyElement[]): string[] => cells.map((cell) => cell.data.label);

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 10, height: 10 },
    data: { label: 'hi' },
  } as CellRecord,
  {
    id: 'b',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 50, y: 0 },
    size: { width: 10, height: 10 },
    data: { label: 'lo' },
  } as CellRecord,
];

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

describe('useCells — record-shaped generics', () => {
  it('explicit Cell generic narrows array element type', async () => {
    const { result } = renderHook(() => useCells<MyElement>(), { wrapper });
    await act(async () => flush());
    expect(result.current).toHaveLength(2);
    expect(result.current[0].data.label).toBe('hi');
    expect(result.current[1].data.label).toBe('lo');
  });

  it('selector annotated returns mapped values', async () => {
    const { result } = renderHook(() => useCells(pickLabels), { wrapper });
    await act(async () => flush());
    expect(result.current).toEqual(['hi', 'lo']);
  });

  it('untyped selector defaults Cell to Computed<CellRecord>', async () => {
    const { result } = renderHook(() => useCells((cells) => cells.length), { wrapper });
    await act(async () => flush());
    expect(result.current).toBe(2);
  });

  it('id form returns Cell | undefined', async () => {
    const { result } = renderHook(() => useCells<MyElement>('a'), { wrapper });
    await act(async () => flush());
    expect(result.current?.data.label).toBe('hi');
  });
});
