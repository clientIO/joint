import { useContext } from 'react';
import { CellIdContext } from '../context';
import { useCell } from './use-cell';
import { useGraphStore } from './use-graph-store';
import { isLinkType } from '../utils/cell-type';
import type { CellId, ResolvedCellRecord, ResolvedLinkRecord } from '../types/cell.types';

/**
 * Read the current link record (context-scoped; requires `CellIdContext`).
 * @template LinkData - user data shape on this link
 * @returns full ResolvedLinkRecord for the current id
 */
export function useLink<LinkData = unknown>(): ResolvedLinkRecord<LinkData>;
/**
 * Read a selected slice from the current link record (context-scoped).
 * @template LinkData - user data shape on this link
 * @template Selected - selector return type
 * @param selector - derives a value from the current resolved link record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useLink<LinkData, Selected>(
  selector: (link: ResolvedLinkRecord<LinkData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
/**
 * Subscribe to a specific link by id. Works anywhere — does not require
 * `CellIdContext`. Throws when the id does not resolve to a link.
 *
 * Cannot be unified with the `(selector)` overload because the argument type
 * (`CellId` vs function) drives the return shape (record vs selected value).
 * @template LinkData - user data shape on this link
 * @param id - link id to track
 * @returns full ResolvedLinkRecord for the given id
 */
export function useLink<LinkData = unknown>(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  id: CellId
): ResolvedLinkRecord<LinkData>;
/**
 * Subscribe to a specific link by id and derive a value from it. Works
 * anywhere — does not require `CellIdContext`. Throws when the id does not
 * resolve to a link.
 * @template LinkData - user data shape on this link
 * @template Selected - selector return type
 * @param id - link id to track
 * @param selector - derives a value from the resolved link record
 * @param isEqual - equality test used to short-circuit re-renders (defaults to Object.is)
 * @returns selected value
 */
export function useLink<LinkData, Selected>(
  id: CellId,
  selector: (link: ResolvedLinkRecord<LinkData>) => Selected,
  isEqual?: (a: Selected, b: Selected) => boolean
): Selected;
export function useLink<LinkData, Selected>(
  argument1?: CellId | ((link: ResolvedLinkRecord<LinkData>) => Selected),
  argument2?:
    | ((link: ResolvedLinkRecord<LinkData>) => Selected)
    | ((a: Selected, b: Selected) => boolean),
  argument3?: (a: Selected, b: Selected) => boolean
): ResolvedLinkRecord<LinkData> | Selected {
  const contextId = useContext(CellIdContext);
  const explicitId = typeof argument1 === 'function' ? undefined : argument1;
  const id = explicitId ?? contextId;

  if (id === undefined) {
    throw new Error(
      'useLink() must be called inside renderLink, or with an explicit id argument'
    );
  }

  let userSelector:
    | ((link: ResolvedLinkRecord<LinkData>) => Selected)
    | undefined;
  let isEqual: ((a: Selected, b: Selected) => boolean) | undefined;
  if (typeof argument1 === 'function') {
    userSelector = argument1;
    if (typeof argument2 === 'function') {
      isEqual = argument2 as (a: Selected, b: Selected) => boolean;
    }
  } else if (typeof argument2 === 'function') {
    userSelector = argument2 as (link: ResolvedLinkRecord<LinkData>) => Selected;
    if (typeof argument3 === 'function') {
      isEqual = argument3;
    }
  }

  const { graph } = useGraphStore();
  // Wrap with type-narrowing guard so non-link ids throw with a clear
  // error before the user selector runs.
  const guardedSelector = (
    cell: ResolvedCellRecord<unknown, LinkData>
  ): ResolvedLinkRecord<LinkData> | Selected => {
    if (!isLinkType(cell.type, graph)) {
      throw new Error(`useLink(): cell "${String(id)}" is not a link`);
    }
    const link = cell as ResolvedLinkRecord<LinkData>;
    return userSelector ? userSelector(link) : link;
  };

  return useCell<unknown, LinkData, ResolvedLinkRecord<LinkData> | Selected>(
    id,
    guardedSelector,
    isEqual as
      | ((
          a: ResolvedLinkRecord<LinkData> | Selected,
          b: ResolvedLinkRecord<LinkData> | Selected
        ) => boolean)
      | undefined
  );
}
