import { useElementId } from './use-element-id';
import { useGraphStore } from './use-graph-store';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';
import { useContainerItem } from './use-container-item';
import type { ElementWithLayout } from '../types/data-types';

/**
 * Hook to access a specific graph element from the current Paper context.
 * Use it only inside `renderElement` or components rendered from within.
 *
 * Returns element data with guaranteed position, size, and angle.
 *
 * @example
 * ```tsx
 * const element = useElement();
 * const { position, size, data } = element;
 * ```
 * @example
 * ```tsx
 * const width = useElement((el) => el.size.width);
 * ```
 * @param selector - Extracts part of the element. Defaults to identity.
 * @param isEqual - Equality check. Defaults to `Object.is`.
 * @returns The selected element data.
 * @group Hooks
 */
export function useElement<D extends object = Record<string, unknown>, R = ElementWithLayout<D>>(
  selector: (item: ElementWithLayout<D>) => R = identitySelector as (
    item: ElementWithLayout<D>
  ) => R,
  isEqual: (a: R, b: R) => boolean = isStrictEqual
): R {
  const id = useElementId();
  const {
    graphView: { elements },
  } = useGraphStore<D>();
  return useContainerItem(elements, id, selector, isEqual) as R;
}
