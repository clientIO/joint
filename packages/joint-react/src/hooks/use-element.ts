import { useContext } from 'react';
import { CellIdContext } from '../context';
import { useCell } from './use-cell';
import { useGraphStore } from './use-graph-store';
import { isElementType } from '../utils/cell-type';
import type { CellId, ResolvedCellRecord, ResolvedElementRecord } from '../types/cell.types';

/**
 * Read the current element record (context-scoped; requires `CellIdContext`).
 * @template ElementData - user data shape on this element
 * @returns full ResolvedElementRecord for the current id
 */
export function useElement<ElementData = unknown>(): ResolvedElementRecord<ElementData>;
/**
 * Read a selected slice from the current element record (context-scoped).
 *
 * Both generics must be specified together for the selector form: TypeScript
 * will not infer `Selected` when only `ElementData` is supplied (defaults
 * would silently make `Selected = unknown`). For ergonomic typed access,
 * either:
 * - annotate the selector parameter:
 *   `useElement((el: ResolvedElementRecord<NodeData>) => el.data)`
 * - or use the no-arg form and read fields off the record:
 *   `const { data } = useElement<NodeData>();`
 * @template ElementData - user data shape on this element
 * @template Selected - selector return type
 * @param selector - derives a value from the current resolved element record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useElement<ElementData, Selected>(
  selector: (element: ResolvedElementRecord<ElementData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific element by id. Works anywhere — does not require
 * `CellIdContext`. Throws when the id does not resolve to an element.
 *
 * Cannot be unified with the `(selector)` overload because the argument type
 * (`CellId` vs function) drives the return shape (record vs selected value).
 * @template ElementData - user data shape on this element
 * @param id - element id to track
 * @returns full ResolvedElementRecord for the given id
 */
export function useElement<ElementData = unknown>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  id: CellId
): ResolvedElementRecord<ElementData>;
/**
 * Subscribe to a specific element by id and derive a value from it. Works
 * anywhere — does not require `CellIdContext`. Throws when the id does not
 * resolve to an element.
 * @template ElementData - user data shape on this element
 * @template Selected - selector return type
 * @param id - element id to track
 * @param selector - derives a value from the resolved element record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useElement<ElementData, Selected>(
  id: CellId,
  selector: (element: ResolvedElementRecord<ElementData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
export function useElement<ElementData, Selected>(
  argument1?: CellId | ((element: ResolvedElementRecord<ElementData>) => Selected),
  argument2?:
    | ((element: ResolvedElementRecord<ElementData>) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): ResolvedElementRecord<ElementData> | Selected {
  const contextId = useContext(CellIdContext);
  const explicitId = typeof argument1 === 'function' ? undefined : argument1;
  const id = explicitId ?? contextId;

  if (id === undefined) {
    throw new Error(
      'useElement() must be called inside renderElement, or with an explicit id argument'
    );
  }

  let userSelector: ((element: ResolvedElementRecord<ElementData>) => Selected) | undefined;
  let isEqual: ((a: Selected, b: Selected) => boolean) | undefined;
  if (typeof argument1 === 'function') {
    userSelector = argument1;
    if (typeof argument2 === 'function') {
      isEqual = argument2 as (a: Selected, b: Selected) => boolean;
    }
  } else if (typeof argument2 === 'function') {
    userSelector = argument2 as (element: ResolvedElementRecord<ElementData>) => Selected;
    if (typeof argument3 === 'function') {
      isEqual = argument3;
    }
  }

  const { graph } = useGraphStore();
  // Wrap with type-narrowing guard so non-element ids throw with a clear
  // error before the user selector runs.
  const guardedSelector = (
    cell: ResolvedCellRecord<ElementData, unknown>
  ): ResolvedElementRecord<ElementData> | Selected => {
    if (!isElementType(cell.type, graph)) {
      throw new Error(`useElement(): cell "${String(id)}" is not an element`);
    }
    const element = cell as ResolvedElementRecord<ElementData>;
    return userSelector ? userSelector(element) : element;
  };

  return useCell<ElementData, unknown, ResolvedElementRecord<ElementData> | Selected>(
    id,
    guardedSelector,
    isEqual as
      | ((
          a: ResolvedElementRecord<ElementData> | Selected,
          b: ResolvedElementRecord<ElementData> | Selected
        ) => boolean)
      | undefined
  );
}
