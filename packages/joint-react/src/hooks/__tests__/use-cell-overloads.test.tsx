import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { CellIdContext } from '../../context';
import { useCell } from '../use-cell';
import { useCells } from '../use-cells';
import { useGraphStore } from '../use-graph-store';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
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
];

function plainWrapper({ children }: { readonly children: React.ReactNode }) {
  return <GraphProvider initialCells={initialCells}>{children}</GraphProvider>;
}

describe('useCell overload branches (lines 77, 82)', () => {
  it('forwards a custom isEqual on the (selector, isEqual) overload (line 77)', () => {
    // (selector, isEqual?) overload — argument1 = function, argument2 = function.
    // Picks up the `isEqual = argument2` branch.
    const isEqual = jest.fn((a: string, b: string) => a === b);
    let captured: unknown;
    function Probe() {
      captured = useCell((cell) => String(cell.id), isEqual);
      return null;
    }
    render(
      <GraphProvider initialCells={initialCells}>
        <CellIdContext.Provider value="a">
          <Probe />
        </CellIdContext.Provider>
      </GraphProvider>
    );
    expect(captured).toBe('a');
  });

  it('forwards a custom isEqual on the (id, selector, isEqual) overload (line 82)', () => {
    const isEqual = jest.fn((a: string, b: string) => a === b);
    const { result } = renderHook(
      () => useCell('a', (cell) => String(cell.id), isEqual),
      { wrapper: plainWrapper }
    );
    expect(result.current).toBe('a');
  });
});

describe('useCells arrayAwareEqual fallback (line 75)', () => {
  it('selector returning a non-array falls through to Object.is on commit', async () => {
    // arrayAwareEqual(a, b): both arrays → shallow compare; otherwise → Object.is.
    // A `cells.length` selector returns a number — Object.is(number, number) runs.
    let storeRef: ReturnType<typeof useGraphStore> | undefined;
    function Probe() {
      storeRef = useGraphStore();
      return null;
    }
    function ProbeWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
      return (
        <GraphProvider initialCells={initialCells}>
          <Probe />
          {children}
        </GraphProvider>
      );
    }
    const { result } = renderHook(() => useCells((cells) => cells.length), {
      wrapper: ProbeWrapper,
    });
    // Force a commit by mutating an existing cell. Length stays the same;
    // Object.is(2, 2) === true → cached value held — exercises line 75.
    storeRef!.graph.getCell('a')?.set('position', { x: 10, y: 20 });
    await new Promise<void>((resolve) => {
      queueMicrotask(() => resolve());
    });
    expect(result.current).toBe(2);
  });
});
