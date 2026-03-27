import type { ElementLayout, ElementPosition } from '../types/cell-data';
import { useElementId } from './use-element-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItem } from './use-container-item';

const DEFAULT_POSITION: ElementPosition = { x: 0, y: 0 };

const selectPosition = (layout: ElementLayout): ElementPosition => ({
  x: layout.x,
  y: layout.y,
});

const isPositionEqual = (a: ElementPosition, b: ElementPosition): boolean =>
  a.x === b.x && a.y === b.y;

/**
 * Returns the position of the current element from the layout container.
 * Must be used inside `renderElement` or a component rendered within it.
 * Only re-renders when the element's position actually changes.
 * @returns The position `{ x, y }` of the current element.
 * @group Hooks
 */
export function useElementPosition(): ElementPosition {
  const id = useElementId();
  const { graphView: { elementsLayout } } = useGraphStore();
  return useContainerItem(elementsLayout, id, selectPosition, isPositionEqual) ?? DEFAULT_POSITION;
}
