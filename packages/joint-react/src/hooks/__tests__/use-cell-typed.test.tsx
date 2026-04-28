import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { useCell } from '../use-cell';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type {
  CellRecord,
  ElementRecord,
  LinkRecord,
  Internal,
} from '../../types/cell.types';

interface ElementUserData {
  readonly label: string;
}
interface LinkUserData {
  readonly kind: string;
}

type MyElement = Internal<ElementRecord<ElementUserData>>;
type MyLink = Internal<LinkRecord<LinkUserData>>;

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
  {
    id: 'l',
    type: LINK_MODEL_TYPE,
    source: { id: 'a' },
    target: { id: 'b' },
    data: { kind: 'k' },
  } as CellRecord,
];

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

describe('useCell — record-shaped generics', () => {
  it('selector annotation infers Cell type and returns selector return', async () => {
    const { result } = renderHook(
      () => useCell('a', (element: MyElement) => element.data.label),
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe('hi');
  });

  it('link selector annotation works the same', async () => {
    const { result } = renderHook(
      () => useCell('l', (link: MyLink) => link.source.id),
      { wrapper }
    );
    await act(async () => flush());
    expect(result.current).toBe('a');
  });

  it('explicit Cell generic narrows return type', async () => {
    const { result } = renderHook(() => useCell<MyElement>('a'), { wrapper });
    await act(async () => flush());
    // TypeScript-side: result.current is MyElement | undefined
    expect(result.current?.data.label).toBe('hi');
  });
});
