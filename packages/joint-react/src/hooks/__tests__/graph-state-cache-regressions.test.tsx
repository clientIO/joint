import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { dia, mvc } from '@joint/core';
import { GraphProvider } from '../../components/graph/graph-provider';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { ElementRecord } from '../../types/cell.types';
import type { GraphState, SelectedEqual } from '../../store/graph-state';
import { useGraphState } from '../use-graph-state';
import { useOnGraphStateChange } from '../use-on-graph-state-change';
import { useOnCellsChange } from '../use-on-cells-change';
import { useGraphStore } from '../use-graph-store';

const element = (id: string): ElementRecord => ({
  id,
  type: ELEMENT_MODEL_TYPE,
  position: { x: 0, y: 0 },
  size: { width: 10, height: 10 },
});
const INITIAL_CELLS = [element('a'), element('b')];
function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <GraphProvider initialCells={INITIAL_CELLS}>{children}</GraphProvider>;
}
const commit = (mutate: () => void) =>
  act(async () => {
    mutate();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
const selectCount = (state: GraphState) => state.cells.length;
const selectCellsCount = (cells: readonly unknown[]) => cells.length;
const alwaysEqual: SelectedEqual<number> = () => true;
const selectNaN = (state: GraphState) => Number.NaN + state.cells.length;
const selectCellsNaN = (cells: readonly unknown[]) => Number.NaN + cells.length;
const selectSignedZero = (state: GraphState) => (state.cells.length === 2 ? 0 : -0);
const selectCellsSignedZero = (cells: readonly unknown[]) => (cells.length === 2 ? 0 : -0);

type Selection = 'nan' | 'zero' | 'count';
type Callback = (value: number, previous?: number) => void;
const GRAPH_SELECTORS = { nan: selectNaN, zero: selectSignedZero, count: selectCount };
const CELL_SELECTORS = { nan: selectCellsNaN, zero: selectCellsSignedZero, count: selectCellsCount };
function useGraphSelection(kind: Selection, callback: Callback, equal?: SelectedEqual<number>) {
  useOnGraphStateChange(GRAPH_SELECTORS[kind], callback, equal);
}
function useCellsSelection(kind: Selection, callback: Callback, equal?: SelectedEqual<number>) {
  useOnCellsChange(CELL_SELECTORS[kind], callback, equal);
}

for (const hook of ['graph', 'cells'] as const) {
  const useSelection = hook === 'graph' ? useGraphSelection : useCellsSelection;
  describe(`${hook} callback selected-value identity`, () => {
    it('does not deliver unchanged NaN selections after a watched source changes', async () => {
      const onChange = jest.fn();
      const { result } = renderHook(
        () => {
          useSelection('nan', onChange);
          return useGraphStore().graph;
        },
        { wrapper }
      );
      onChange.mockClear();

      await commit(() => result.current.addCell(element('c')));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('delivers the change from positive zero to negative zero', async () => {
      const onChange = jest.fn();
      const { result } = renderHook(
        () => {
          useSelection('zero', onChange);
          return useGraphStore().graph;
        },
        { wrapper }
      );
      onChange.mockClear();

      await commit(() => result.current.addCell(element('c')));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toBe(-0);
      expect(onChange.mock.calls[0][1]).toBe(0);
    });

    it('rechecks a stable selector when only its equality function changes', async () => {
      const onChange = jest.fn();
      const { result, rerender } = renderHook(
        ({ equal }: { readonly equal: SelectedEqual<number> }) => {
          useSelection('count', onChange, equal);
          return useGraphStore().graph;
        },
        { wrapper, initialProps: { equal: alwaysEqual } }
      );
      onChange.mockClear();
      await commit(() => result.current.addCell(element('c')));
      expect(onChange).not.toHaveBeenCalled();

      rerender({ equal: Object.is });

      expect(onChange.mock.calls).toEqual([[3, 2]]);
    });
  });
}

it('useGraphState refreshes a cached selection when only its equality changes', async () => {
  const { result, rerender } = renderHook(
    ({ equal }: { readonly equal: SelectedEqual<number> }) => ({
      value: useGraphState(selectCount, equal),
      graph: useGraphStore().graph,
    }),
    { wrapper, initialProps: { equal: alwaysEqual } }
  );
  await commit(() => result.current.graph.addCell(element('c')));
  expect(result.current.value).toBe(2);

  rerender({ equal: Object.is });

  expect(result.current.value).toBe(3);
});

it('a fresh hook reads current detached model attributes after an earlier hook unmounts', () => {
  const model = new dia.Element({ ...element('detached'), position: { x: 10, y: 0 } });
  const collection = new mvc.Collection<dia.Cell>([model]);
  const selectDetachedX = (state: GraphState) => state.getCells(collection)[0]?.position?.x;
  const first = renderHook(() => useGraphState(selectDetachedX), { wrapper });
  expect(first.result.current).toBe(10);
  first.unmount();
  model.position(80, 0);

  const second = renderHook(() => useGraphState(selectDetachedX), { wrapper });

  expect(second.result.current).toBe(80);
});
