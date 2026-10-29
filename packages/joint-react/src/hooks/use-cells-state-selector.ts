import { useMemo } from 'react';
import type { AnyCellRecord } from '../types/cell.types';
import type { GraphStateSelector } from '../store/graph-state';
import type { AnyCellsSelector, CellsSource, CellsTarget } from './use-cells.types';

/**
 * The graph state selector of a cells hook: reads what `target` names and
 * hands it to `selector`. The same function for as long as the target and the
 * selector are.
 * @param target - What to read: all cells (`undefined`), no cell (`null`), a cell id, ids or a collection.
 * @param targetKey - `toTargetKey(target)`, computed once by the caller.
 * @param selector - Derives the value from what was read; the read itself when omitted.
 * @returns The selector to pass to `useGraphState` / `useOnGraphStateChange`.
 * @internal
 */
export function useCellsStateSelector<Cell extends AnyCellRecord, Selected>(
  target: CellsTarget,
  targetKey: unknown,
  selector?: AnyCellsSelector<Cell, Selected>
): GraphStateSelector<Cell, Selected | CellsSource<Cell>> {
  return useMemo(
    () => (state) => {
      let source: CellsSource<Cell>;
      if (target === undefined) source = state.cells;
      else if (target === null) source = undefined;
      else if (typeof target === 'object') source = state.getCells(target);
      else source = state.getCell(target);
      return selector ? selector(source) : source;
    },
    // `targetKey` stands in for `target`, see `toTargetKey` in `use-cells.utils`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetKey, selector]
  );
}
