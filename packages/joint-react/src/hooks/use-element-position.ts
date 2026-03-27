import type { ElementPosition } from '../types/cell-data';
import { useElement } from './use-element';

/**
 * Returns the position of the current element.
 * Must be used inside `renderElement` or a component rendered within it.
 * Only re-renders when the element's position reference changes.
 * @returns The position `{ x, y }` of the current element.
 * @group Hooks
 */
export function useElementPosition(): Required<ElementPosition> {
  return useElement((element) => element.position);
}
