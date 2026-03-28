import type { ElementSize } from '../types/cell-data';
import { useElement } from './use-element';

const EMPTY_SIZE: ElementSize = { width: 0, height: 0 };
/**
 * Returns the size of the current element.
 * Must be used inside `renderElement` or a component rendered within it.
 * Only re-renders when the element's size reference changes.
 * @returns The size `{ width, height }` of the current element.
 * @group Hooks
 */
export function useElementSize(): Required<ElementSize> {
  const { width = 0, height = 0 } = useElement((element) => element.size) ?? EMPTY_SIZE;
  return { width, height };
}
