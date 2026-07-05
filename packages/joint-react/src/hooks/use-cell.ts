import { useContext, useMemo } from 'react';
import { CellIdContext } from '../context';
import { useCells } from './use-cells';
import type { AnyCellRecord, CellId, CellRecord, Computed } from '../types/cell.types';

/**
 * Read the current cell from the closest `CellIdContext`, the id is provided
 * by `<Paper />` around `renderElement` / `renderLink`. Use this inside a
 * render callback (or a component mounted from one) to access the full cell
 * record.
 *
 * Throws when used outside of a Paper render context, or when the id no longer
 * resolves to a cell in the store (e.g. deleted mid-render).
 * @title Read the current cell
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @returns the current resolved cell record
 * @group Hooks
 * @example
 * ```tsx
 * import { Paper, useCell } from '@joint/react';
 *
 * function NodeLabel() {
 *   // The id comes from the <Paper> render callback context.
 *   const cell = useCell();
 *   return <text>{String(cell.id)}</text>;
 * }
 *
 * <Paper renderElement={() => <NodeLabel />} />;
 * ```
 */
export function useCell<Cell extends AnyCellRecord = CellRecord>(): Computed<Cell>;
/**
 * Read a selected slice from the current cell (context-scoped). Re-renders
 * only when `isEqual(prev, next)` returns false.
 *
 * Throws if no cell resolves, never returns `undefined`.
 * @title Select from the current cell
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `Cell`)
 * @param selector - derive a value from the current resolved cell record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 * @example
 * ```tsx
 * import { useCell, selectElementData } from '@joint/react';
 *
 * function NodeLabel() {
 *   type NodeData = { label: string };
 *   // Re-renders only when this element's data changes.
 *   const data = useCell(selectElementData<NodeData>);
 *   return <text>{data.label}</text>;
 * }
 * ```
 */
export function useCell<Cell extends AnyCellRecord = CellRecord, Selected = Computed<Cell>>(
  selector: (cell: Computed<Cell>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific cell by id. Works anywhere, does not require
 * `CellIdContext`. Throws when the id does not resolve to a cell.
 * @title Read a cell by id
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @param id - cell id to track
 * @returns the resolved cell record
 * @example
 * ```tsx
 * import { useCell } from '@joint/react';
 *
 * function CellTypeBadge({ id }: { id: string }) {
 *   // Works outside a render callback too — subscribes to this id anywhere.
 *   const cell = useCell(id);
 *   return <span>{cell.type}</span>;
 * }
 * ```
 */
export function useCell<Cell extends AnyCellRecord = CellRecord>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  id: CellId
): Computed<Cell>;
/**
 * Subscribe to a specific cell by id and derive a value from it. Works
 * anywhere, does not require `CellIdContext`. Throws when the id does not
 * resolve to a cell.
 * @title Select from a cell by id
 * @template Cell - input cell record shape (defaults to CellRecord); reads resolve to its Computed form
 * @template Selected - selector return type (defaults to `Cell`)
 * @param id - cell id to track
 * @param selector - derive a value from the resolved cell record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to a shallow, array-aware comparison that falls back to Object.is for scalar results)
 * @returns selected value
 */
export function useCell<Cell extends AnyCellRecord = CellRecord, Selected = Computed<Cell>>(
  id: CellId,
  selector: (cell: Computed<Cell>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
export function useCell<Cell extends AnyCellRecord = CellRecord, Selected = Computed<Cell>>(
  argument1?: CellId | ((cell: Computed<Cell>) => Selected),
  argument2?: ((cell: Computed<Cell>) => Selected) | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): Computed<Cell> | Selected {
  const contextId = useContext(CellIdContext);
  const explicitId = typeof argument1 === 'function' ? undefined : argument1;
  const id = explicitId ?? contextId;

  let userSelector: ((cell: Computed<Cell>) => Selected) | undefined;
  let isEqual: ((a: Selected, b: Selected) => boolean) | undefined;
  if (typeof argument1 === 'function') {
    userSelector = argument1;
    if (typeof argument2 === 'function') {
      isEqual = argument2 as (a: Selected, b: Selected) => boolean;
    }
  } else if (typeof argument2 === 'function') {
    userSelector = argument2 as (cell: Computed<Cell>) => Selected;
    if (typeof argument3 === 'function') {
      isEqual = argument3;
    }
  }

  if (id === undefined) {
    throw new Error(
      'useCell() must be called inside renderElement / renderLink, or with an explicit id argument'
    );
  }

  // Always run through the (id, selector, isEqual?) form so React only sees
  // one stable hook call shape across all overloads. The selector throws on
  // missing cells; the identity case re-uses the cell record reference, so
  // isEqual=Object.is bails out on data-only commits.
  const selector = useMemo(() => {
    return (cell: Computed<Cell> | undefined): Computed<Cell> | Selected => {
      if (cell === undefined) {
        throw new Error(`useCell(): no cell with id "${String(id)}"`);
      }
      return userSelector ? userSelector(cell) : cell;
    };
    // userSelector is captured by reference; React's referential equality on
    // the closure is enough here because `useCells` keeps its own selectorRef.
  }, [id, userSelector]);

  return useCells<Cell, Computed<Cell> | Selected>(
    id,
    selector,
    isEqual as ((a: Computed<Cell> | Selected, b: Computed<Cell> | Selected) => boolean) | undefined
  );
}
