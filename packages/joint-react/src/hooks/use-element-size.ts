import type { ElementLayout, ElementSize } from '../types/cell-data';
import { useElementId } from './use-element-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItem } from './use-container-item';

const DEFAULT_SIZE: ElementSize = {
  width: 0,
  height: 0,
};

const selectSize = (layout: ElementLayout): ElementSize => ({
  width: layout.width,
  height: layout.height,
});

const isSizeEqual = (a: ElementSize, b: ElementSize): boolean =>
  a.width === b.width && a.height === b.height;

/**
 * Returns the size of the current element from the layout container.
 * Must be used inside `renderElement` or a component rendered within it.
 * Only re-renders when the element's size actually changes.
 * @returns The size `{ width, height }` of the current element.
 * @group Hooks
 */
export function useElementSize(): ElementSize {
  const id = useElementId();
  const {
    graphView: { elementsLayout },
  } = useGraphStore();
  return useContainerItem(elementsLayout, id, selectSize, isSizeEqual) ?? DEFAULT_SIZE;
}
