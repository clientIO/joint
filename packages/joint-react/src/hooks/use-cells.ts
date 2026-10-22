import { type mvc, type dia } from '@joint/core';
import type { AnyCellRecord, CellId, CellRecord, Computed } from '../types/cell.types';
import type { SelectedEqual } from '../store/graph-state';
import type { AnyCellsSelector, CellsSelector, CellsSource, CellsTarget } from './use-cells.types';
import { useCellsStateSelector } from './use-cells-state-selector';
import { useGraphState } from './use-graph-state';

export type { SelectedEqual } from '../store/graph-state';
export type { CellsSelector } from './use-cells.types';

/** The arguments of every `useCells` form: an optional target, a selector, an equality function. */
type CellsArguments<Cell extends AnyCellRecord, Selected> = [
  argument1?: CellsTarget | CellsSelector<Cell, Selected>,
  argument2?:
    | CellsSelector<Cell, Selected>
    | ((cell: Computed<Cell> | undefined) => Selected)
    | SelectedEqual<Selected>,
  argument3?: SelectedEqual<Selected>,
];

// ── Overloads ───────────────────────────────────────────────────────────────

/**
 * Subscribe to a collection's cells. Tracks collection membership
 * (`add`/`remove`/`reset`) and reads cell records from the GraphProvider's
 * container. Cells not in the graph (e.g. `ui.Clipboard` clones) fall back to
 * the collection's own `dia.Cell` instances, converted to records on demand.
 * @title Subscribe to a collection
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param collection - JointJS collection whose member IDs drive the subscription
 * @returns readonly resolved cells array filtered by collection membership
 * @group Hooks
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  collection: mvc.Collection<dia.Cell>
): ReadonlyArray<Computed<Cell>>;
/**
 * Subscribe to a collection's cells with a selector.
 * @title Select from a collection
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type
 * @param collection - JointJS collection whose member IDs drive the subscription
 * @param selector - derive a value from the picked resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(
  collection: mvc.Collection<dia.Cell>,
  selector: CellsSelector<Cell, Selected>,
  isEqual?: SelectedEqual<Selected>
): Selected;
/**
 * Subscribe to the full cells array.
 *
 * The array is a new reference on every graph change; the records in it keep
 * their reference until they change themselves.
 * @title Subscribe to all cells
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @returns readonly resolved cells array
 * @example
 * ```tsx
 * import { useCells } from '@joint/react';
 *
 * function CellCount() {
 *   const cells = useCells();
 *   return <span>{cells.length} cells</span>;
 * }
 * ```
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(): ReadonlyArray<Computed<Cell>>;
/**
 * Subscribe to a single cell by id.
 * @title Subscribe to a cell by id
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param id - cell id to track
 * @returns current resolved cell, or undefined when missing
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(
  id: CellId
): Computed<Cell> | undefined;
/**
 * Subscribe to a single cell by id and derive a value from it. Subscribes
 * only to that id so unrelated mutations don't trigger re-renders. A nullish
 * `id` resolves to no cell, so the selector runs against `undefined`, handy
 * for optional selection state (`useCells(selectedId, ...)`) with no `?? ''`.
 * @title Select from a cell by id
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `Cell | undefined`)
 * @param id - cell id to track (nullish → selector receives `undefined`)
 * @param selector - derive a value from the cell (or `undefined` when missing)
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = Computed<Cell> | undefined,
>(
  id: CellId | null | undefined,
  selector: (cell: Computed<Cell> | undefined) => Selected,
  isEqual?: SelectedEqual<Selected>
): Selected;
/**
 * Subscribe to a specific set of cells by id. Subscribes only to those ids
 * (not the full container) so unrelated mutations don't trigger re-renders.
 * Returns the picked cells in the order they appear in `ids`; missing ids
 * are skipped. The array reference is stable when no picked cell changed.
 * @title Subscribe to specific cells
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param ids - cell ids to track
 * @returns array of resolved cells (only those that exist; missing ids are skipped)
 */
export function useCells<Cell extends AnyCellRecord = CellRecord>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  ids: readonly CellId[]
): ReadonlyArray<Computed<Cell>>;
/**
 * Subscribe to a specific set of cells by id and derive a value from them.
 * Subscribes only to those ids; the selector receives the picked cells array.
 * @title Select from specific cells
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `readonly Cell[]`)
 * @param ids - cell ids to track
 * @param selector - derive a value from the picked resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  ids: readonly CellId[],
  selector: CellsSelector<Cell, Selected>,
  isEqual?: SelectedEqual<Selected>
): Selected;
/**
 * Subscribe via a selector. Runs on every commit; return equal values to skip re-render.
 * @title Subscribe via a selector
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `readonly Cell[]`)
 * @param selector - derive a value from the resolved cells array
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 * @example
 * ```tsx
 * import { useCells } from '@joint/react';
 *
 * function ElementCount() {
 *   // Counts cells whose type is the default 'element' and re-renders only when
 *   // that count changes; shape-typed elements (e.g. 'standard.Rectangle') are
 *   // not included.
 *   const count = useCells((cells) => cells.filter((cell) => cell.type === 'element').length);
 *   return <span>{count} elements</span>;
 * }
 * ```
 */
export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(selector: CellsSelector<Cell, Selected>, isEqual?: SelectedEqual<Selected>): Selected;

// ── Implementation ──────────────────────────────────────────────────────────

export function useCells<
  Cell extends AnyCellRecord = CellRecord,
  Selected = ReadonlyArray<Computed<Cell>>,
>(...args: CellsArguments<Cell, Selected>): Selected | CellsSource<Cell> {
  const [argument1, argument2, argument3] = args;
  const isSelectorFirst = typeof argument1 === 'function';
  // The overloads pair each target with its selector shape, which the argument
  // unions hide from TypeScript.
  const selector = (isSelectorFirst ? argument1 : argument2) as
    | AnyCellsSelector<Cell, Selected>
    | undefined;
  const hasSelector = typeof selector === 'function';
  // A nullish id next to a selector reads no cell; on its own it reads all cells.
  let target: CellsTarget;
  if (!isSelectorFirst) target = argument1 ?? (hasSelector ? null : undefined);
  const isEqual = (isSelectorFirst ? argument2 : argument3) as
    | SelectedEqual<Selected | CellsSource<Cell>>
    | undefined;

  const select = useCellsStateSelector(target, hasSelector ? selector : undefined);
  return useGraphState(select, isEqual);
}
