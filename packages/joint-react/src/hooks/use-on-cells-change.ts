import type { dia, mvc } from '@joint/core';
import type { AnyCellRecord, CellId, CellRecord, Computed } from '../types/cell.types';
import type { SelectedEqual } from '../store/graph-state';
import type { AnyCellsSelector, CellsSelector, CellsTarget } from './use-cells.types';
import { toTargetKey } from './use-cells.utils';
import { useCellsStateSelector } from './use-cells-state-selector';
import { useWatchGraphState, type OnGraphStateChange } from './use-watch-graph-state';

/**
 * Callback of {@link useOnCellsChange}: receives the newly selected value and
 * the one before it, absent on the first call.
 * @group Types
 * @example
 * ```ts
 * import type { OnCellsChange } from '@joint/react';
 *
 * const logCount: OnCellsChange<number> = (count, previousCount) => {
 *   console.info(`cells: ${previousCount ?? '-'} → ${count}`);
 * };
 * ```
 */
export type OnCellsChange<Selected> = OnGraphStateChange<Selected>;

/**
 * Runs a callback when a value selected from the cells changes, without
 * re-rendering the component: {@link useCells} as an effect. The callback
 * runs once when the hook mounts and then synchronously with each store change
 * that changes the selected value, before React re-renders its subscribers.
 * Like any effect, the mount call runs twice in development under StrictMode.
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
 * import { useOnCellsChange } from '@joint/react';
 *
 * const selectCount = (cells: readonly unknown[]) => cells.length;
 *
 * function LogCellCount() {
 *   useOnCellsChange(selectCount, (count, previousCount) => console.info(count, previousCount));
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
        CellsTarget,
        CellsSelector<AnyCellRecord, Selected> | ((cell: AnyCellRecord | undefined) => Selected),
        OnCellsChange<Selected>,
        SelectedEqual<Selected>?,
      ]
): void {
  // The target forms carry the selector and the callback one position later
  // than the all-cells form. The overloads guarantee the shapes, which the
  // union hides from TypeScript.
  const [target, selector, onChange, isEqual] = (
    typeof args[0] === 'function'
      ? [undefined, args[0], args[1], args[2]]
      : [args[0] ?? null, args[1], args[2], args[3]]
  ) as [
    CellsTarget,
    AnyCellsSelector<AnyCellRecord, Selected>,
    OnCellsChange<Selected>,
    SelectedEqual<unknown> | undefined,
  ];
  const targetKey = toTargetKey(target);
  useWatchGraphState<AnyCellRecord, unknown>(
    useCellsStateSelector(target, targetKey, selector),
    onChange as OnCellsChange<unknown>,
    isEqual,
    targetKey,
    'useOnCellsChange'
  );
}
