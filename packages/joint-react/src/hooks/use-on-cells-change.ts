import { useLayoutEffect } from 'react';
import type { dia, mvc } from '@joint/core';
import type { AnyCellRecord, CellId, CellRecord, Computed } from '../types/cell.types';
import { useCellsSource, type CellsSelector, type SelectedEqual } from './use-cells';
import { useLatestRef } from './use-latest-ref';
import { rethrowLater } from '../utils/scheduler';

/**
 * Callback of {@link useOnCellsChange}: receives the newly selected value and
 * the one before it, absent on the first call.
 * @group Types
 */
export type OnCellsChange<Selected> = (value: Selected, previousValue?: Selected) => void;

/**
 * Runs a callback when a value selected from the cells changes, without
 * re-rendering the component: {@link useCells} as an effect. The callback
 * runs once when the hook mounts and then synchronously with each store change
 * that changes the selected value, before React re-renders its subscribers.
 * Changing the watched id, ids or collection starts over: the callback runs
 * again with the current value and no previous one.
 *
 * It takes the same selectors and equality functions as {@link useCells}.
 * Keep the selector and `isEqual` cheap and return a primitive or an existing
 * record: they run on every commit, including each frame of a drag.
 * @title All cells
 * @param selector - Derives the value to watch from all cells.
 * @param onChange - Called with the new and the previous value.
 * @param isEqual - Custom equality for the selected value.
 * @group Hooks
 * @example
 * ```tsx
 * import { useOnCellsChange, selectMeasuredState, useGraph } from '@joint/react';
 *
 * // Re-run a layout each time the element sizes settle.
 * function AutoLayout() {
 *   const { graph } = useGraph();
 *   useOnCellsChange(selectMeasuredState, (measuredState) => {
 *     if (measuredState) runLayout(graph);
 *   });
 *   return null;
 * }
 * ```
 */
export function useOnCellsChange<Cell extends AnyCellRecord = CellRecord, Selected = unknown>(
  selector: CellsSelector<Cell, Selected>,
  onChange: OnCellsChange<Selected>,
  isEqual?: SelectedEqual<Selected>
): void;
/**
 * Runs a callback when a value selected from one cell changes. A missing cell
 * (or a nullish id) passes `undefined` to the selector.
 * @title One cell
 * @param id - Id of the cell to watch.
 * @param selector - Derives the value to watch from the cell.
 * @param onChange - Called with the new and the previous value.
 * @param isEqual - Custom equality for the selected value.
 * @group Hooks
 * @example
 * ```tsx
 * import { useOnCellsChange, selectElementSize } from '@joint/react';
 *
 * function LogSize({ id }: { id: string }) {
 *   useOnCellsChange(id, (cell) => cell && selectElementSize(cell), (size) => console.info(size));
 *   return null;
 * }
 * ```
 */
export function useOnCellsChange<Cell extends AnyCellRecord = CellRecord, Selected = unknown>(
  id: CellId | null | undefined,
  selector: (cell: Computed<Cell> | undefined) => Selected,
  onChange: OnCellsChange<Selected>,
  isEqual?: SelectedEqual<Selected>
): void;
/**
 * Runs a callback when a value selected from several cells, or from the cells
 * of a JointJS collection, changes.
 * @title Several cells or a collection
 * @param target - Ids of the cells to watch, or a `mvc.Collection` of cells.
 * @param selector - Derives the value to watch from those cells.
 * @param onChange - Called with the new and the previous value.
 * @param isEqual - Custom equality for the selected value.
 * @group Hooks
 * @example
 * ```tsx
 * import { useOnCellsChange } from '@joint/react';
 *
 * const selectCount = (cells: readonly unknown[]) => cells.length;
 *
 * function LogSelection({ ids }: { ids: readonly string[] }) {
 *   useOnCellsChange(ids, selectCount, (count) => console.info(count));
 *   return null;
 * }
 * ```
 */
export function useOnCellsChange<Cell extends AnyCellRecord = CellRecord, Selected = unknown>(
  target: readonly CellId[] | mvc.Collection<dia.Cell>,
  selector: CellsSelector<Cell, Selected>,
  onChange: OnCellsChange<Selected>,
  isEqual?: SelectedEqual<Selected>
): void;
export function useOnCellsChange<Selected>(
  ...args:
    | [CellsSelector<AnyCellRecord, Selected>, OnCellsChange<Selected>, SelectedEqual<Selected>?]
    | [
        CellId | null | undefined | readonly CellId[] | mvc.Collection<dia.Cell>,
        CellsSelector<AnyCellRecord, Selected> | ((cell: AnyCellRecord | undefined) => Selected),
        OnCellsChange<Selected>,
        SelectedEqual<Selected>?,
      ]
): void {
  // The target forms carry the callback one position later than the all-cells
  // form. The overloads guarantee the shapes, which the union hides from TS.
  const [onChange, sourceArguments] = (
    typeof args[0] === 'function'
      ? [args[1], [args[0], args[2]]]
      : [args[2], [args[0], args[1], args[3]]]
  ) as [OnCellsChange<unknown>, Parameters<typeof useCellsSource<AnyCellRecord, unknown>>];
  const { subscribe, select } = useCellsSource<AnyCellRecord, unknown>(...sourceArguments);
  const onChangeRef = useLatestRef(onChange);

  useLayoutEffect(() => {
    // `select` returns the cached value while it is equal, so identity is the test.
    let previous = select();
    onChangeRef.current(previous);
    return subscribe(() => {
      const next = select();
      if (next === previous) return;
      const before = previous;
      previous = next;
      // This runs inside the store's notification: an error must not keep the
      // other subscribers of this change from being notified.
      try {
        onChangeRef.current(next, before);
      } catch (error) {
        rethrowLater(error);
      }
    });
  }, [subscribe, select, onChangeRef]);
}
