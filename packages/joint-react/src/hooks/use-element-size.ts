import { useElement } from './use-element';
import type { ElementSize } from '../types/cell-data';

/**
 * Read the size of the current element (context-scoped; requires `CellIdContext`).
 *
 * Thin selector-style wrapper over `useElement` that subscribes only to the
 * `size` slice — rerenders only when `{ width, height }` changes, not on
 * every element update. Returns `undefined` before the element has been
 * measured.
 * @returns the current element's size, or undefined when unmeasured
 */
export function useElementSize(): ElementSize | undefined {
  return useElement<unknown, ElementSize | undefined>((element) => element.size);
}
