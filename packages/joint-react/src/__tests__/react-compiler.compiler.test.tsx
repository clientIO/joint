 
/* eslint-disable react-perf/jsx-no-new-object-as-prop -- the memoization probe
   intentionally passes a fresh object every render to prove the compiler
   stabilizes it. */
/* eslint-disable react-perf/jsx-no-new-function-as-prop -- same: an inline
   handler the compiler is expected to memoize. */
 
/**
 * React Compiler behavioural contract.
 *
 * This suite runs ONLY under the `react-compiler` jest project, where the
 * source (this file AND the real `@joint/react` modules it imports) is
 * transformed by `babel-plugin-react-compiler`. It verifies two things:
 *
 * 1. The compiler is genuinely active — auto-memoization changes observable
 *    re-render behaviour (this is why the suite cannot run under `@swc/jest`).
 * 2. The library's public behaviour is unchanged once compiled — the same
 *    add / remove / select contracts hold as in the uncompiled suites.
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { GraphProvider } from '../components/graph/graph-provider';
import { useCells } from '../hooks/use-cells';
import { useGraphStore } from '../hooks/use-graph-store';
import type { InferElement } from '../utils/create';
import { ELEMENT_MODEL_TYPE } from '../mvc/element-model';
import { LINK_MODEL_TYPE } from '../mvc/link-model';
import type { CellRecord, ElementRecord, LinkRecord } from '../types/cell.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

// ── Part 1: the compiler is active ──────────────────────────────────────────

const childRenders = { count: 0 };
// Opaque function call (not an inline mutation) so the compiler keeps it in the
// render body while still memoizing the component around it.
function trackChildRender() {
  childRenders.count++;
}

function MemoProbeChild({ payload }: Readonly<{ payload: Readonly<{ value: number }> }>) {
  trackChildRender();
  return <span data-testid="child-value">{payload.value}</span>;
}

function MemoProbeParent() {
  const [tick, setTick] = useState(0);
  // A fresh object literal every render. Without the compiler this is a new
  // reference each time, so the child re-renders; the compiler memoizes it,
  // keeping the reference (and therefore the child element) stable.
  const payload = { value: 1 };
  return (
    <>
      <span data-testid="tick">{tick}</span>
      <button type="button" data-testid="bump" onClick={() => setTick((value) => value + 1)}>
        bump
      </button>
      <MemoProbeChild payload={payload} />
    </>
  );
}

describe('React Compiler — auto-memoization is active', () => {
  it('child does not re-render when unrelated parent state changes', () => {
    childRenders.count = 0;
    render(<MemoProbeParent />);
    // Baseline, not an absolute count: the compiler's dev runtime double-invokes
    // components to validate memoization, so the mount count is implementation
    // detail. What matters is that parent updates add NO further child renders.
    const baselineRenders = childRenders.count;

    act(() => {
      fireEvent.click(screen.getByTestId('bump'));
      fireEvent.click(screen.getByTestId('bump'));
      fireEvent.click(screen.getByTestId('bump'));
    });

    // Parent state advanced…
    expect(screen.getByTestId('tick').textContent).toBe('3');
    // …but the memoized child never re-rendered. Without the compiler each click
    // would re-render the child (a fresh `payload` ref every parent render).
    expect(childRenders.count).toBe(baselineRenders);
  });
});

// ── Part 2: the library behaves identically when compiled ───────────────────

const makeElement = (id: string, x = 0): CellRecord =>
  ({ id, type: ELEMENT_MODEL_TYPE, position: { x, y: 0 }, size: { width: 10, height: 10 } }) as CellRecord;

const initialCells: readonly CellRecord[] = [makeElement('a', 0), makeElement('b', 50)];

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
const cellIds = (cells: readonly CellRecord[]) => cells.map((cell) => String(cell.id));

describe('React Compiler — @joint/react behaviour is unchanged', () => {
  beforeEach(() => {
    storeRef = undefined;
  });

  it('useCells reflects the initial cells', async () => {
    const { result } = renderHook(() => useCells(cellIds), { wrapper: Wrapper });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);
  });

  it('useCells stays reactive to add and remove when compiled', async () => {
    const { result } = renderHook(() => useCells(cellIds), { wrapper: Wrapper });
    await act(async () => flush());
    expect(result.current).toEqual(['a', 'b']);

    await act(async () => {
      storeRef!.graph.addCell(makeElement('c', 100));
      await flush();
    });
    expect(new Set(result.current)).toEqual(new Set(['a', 'b', 'c']));

    await act(async () => {
      storeRef!.graph.getCell('a')?.remove();
      await flush();
    });
    // Order is not contractual for the all-cells selector form (the container
    // uses O(1) swap-remove); compare as a set.
    expect(new Set(result.current)).toEqual(new Set(['b', 'c']));
  });

  it('InferElement narrows a cells collection compiled', () => {
    const cells: Array<ElementRecord<{ label: string }> | LinkRecord<unknown>> = [
      { id: 'n', type: ELEMENT_MODEL_TYPE, data: { label: 'A' } },
      { id: 'e', type: LINK_MODEL_TYPE, source: 'n', target: 'm' },
    ];
    type Node = InferElement<typeof cells>;
    const node: Node = cells[0] as Node;
    expect(node.type).toBe(ELEMENT_MODEL_TYPE);
    expect(node.data.label).toBe('A');
  });
});
