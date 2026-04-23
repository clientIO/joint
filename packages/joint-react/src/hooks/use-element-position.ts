import { useElement } from './use-element';
import type { ElementPosition } from '../types/cell-data';

/**
 * Read the position of the current element (context-scoped; requires `CellIdContext`).
 *
 * Thin selector-style wrapper over `useElement` that subscribes only to the
 * `position` slice — rerenders only when `{ x, y }` changes, not on every
 * element update. Returns `undefined` when the element has no position set.
 * @returns the current element's position, or undefined when unset
 */
export function useElementPosition(): ElementPosition | undefined {
  return useElement<unknown, ElementPosition | undefined>((element) => element.position);
}
