import { useContext, useMemo } from 'react';
import { CellIdContext } from '../context';
import { useCells } from './use-cells';
import type { CellId, ResolvedCellRecord } from '../types/cell.types';

/**
 * Read the current cell from the closest `CellIdContext` — the id is provided
 * by `<Paper />` around `renderElement` / `renderLink`. Use this inside a
 * render callback (or a component mounted from one) to access the full cell
 * record.
 *
 * Throws when used outside of a Paper render context, or when the id no longer
 * resolves to a cell in the store (e.g. deleted mid-render).
 * @template ElementData - user data shape on elements (for narrowing)
 * @template LinkData - user data shape on links (for narrowing)
 * @returns the current resolved cell record
 */
export function useCell<
  ElementData = unknown,
  LinkData = unknown,
>(): ResolvedCellRecord<ElementData, LinkData>;
/**
 * Read a selected slice from the current cell (context-scoped). Re-renders
 * only when `isEqual(prev, next)` returns false.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @template Selected - selector return type
 * @param selector - derive a value from the current resolved cell record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCell<ElementData, LinkData, Selected>(
  selector: (cell: ResolvedCellRecord<ElementData, LinkData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific cell by id. Works anywhere — does not require
 * `CellIdContext`. Throws when the id does not resolve to a cell.
 *
 * Cannot be unified with the `(selector)` overload because the argument type
 * (`CellId` vs function) drives the return shape (record vs selected value).
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @param id - cell id to track
 * @returns the resolved cell record
 */
export function useCell<ElementData = unknown, LinkData = unknown>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  id: CellId
): ResolvedCellRecord<ElementData, LinkData>;
/**
 * Subscribe to a specific cell by id and derive a value from it. Works
 * anywhere — does not require `CellIdContext`. Throws when the id does not
 * resolve to a cell.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @template Selected - selector return type
 * @param id - cell id to track
 * @param selector - derive a value from the resolved cell record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useCell<ElementData, LinkData, Selected>(
  id: CellId,
  selector: (cell: ResolvedCellRecord<ElementData, LinkData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
export function useCell<ElementData, LinkData, Selected>(
  argument1?: CellId | ((cell: ResolvedCellRecord<ElementData, LinkData>) => Selected),
  argument2?:
    | ((cell: ResolvedCellRecord<ElementData, LinkData>) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): ResolvedCellRecord<ElementData, LinkData> | Selected {
  const contextId = useContext(CellIdContext);
  const explicitId = typeof argument1 === 'function' ? undefined : argument1;
  const id = explicitId ?? contextId;

  let userSelector:
    | ((cell: ResolvedCellRecord<ElementData, LinkData>) => Selected)
    | undefined;
  let isEqual: ((a: Selected, b: Selected) => boolean) | undefined;
  if (typeof argument1 === 'function') {
    userSelector = argument1;
    if (typeof argument2 === 'function') {
      isEqual = argument2 as (a: Selected, b: Selected) => boolean;
    }
  } else if (typeof argument2 === 'function') {
    userSelector = argument2 as (cell: ResolvedCellRecord<ElementData, LinkData>) => Selected;
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
    return (
      cell: ResolvedCellRecord<ElementData, LinkData> | undefined
    ): ResolvedCellRecord<ElementData, LinkData> | Selected => {
      if (cell === undefined) {
        throw new Error(`useCell(): no cell with id "${String(id)}"`);
      }
      return userSelector ? userSelector(cell) : cell;
    };
    // userSelector is captured by reference; React's referential equality on
    // the closure is enough here because `useCells` keeps its own selectorRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userSelector]);

  return useCells<ElementData, LinkData, ResolvedCellRecord<ElementData, LinkData> | Selected>(
    id,
    selector,
    isEqual as
      | ((
          a: ResolvedCellRecord<ElementData, LinkData> | Selected,
          b: ResolvedCellRecord<ElementData, LinkData> | Selected
        ) => boolean)
      | undefined
  );
}
