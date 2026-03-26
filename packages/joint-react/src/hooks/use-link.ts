import { useLinkId } from './use-link-id';
import type { CellData } from '../types/cell-data';
import type { ReadonlyContainer } from '../store/state-container';
import { useGraphStore } from './use-graph-store';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';
import { useContainerItem } from './use-container-item';

/**
 * @deprecated Use `useLinkData()` for user data.
 * A hook to access a specific graph link from the current `Paper` context.
 * Use it only inside `renderLink` or components rendered from within.
 * This hook returns the selected link based on its cell id. It accepts:
 * - a selector function, which extracts the desired part from the link.
 * (By default, it returns the entire link.)
 * - an optional `isEqual` function, used to determine if the selected value has changed.
 *
 * How it works:
 * 1. The hook retrieves the cell id using `useLinkId`.
 * 2. It subscribes to the graph store and fetches the link associated with the cell id.
 * 3. The selector is applied to the fetched link and `isEqual` ensures proper re-rendering behavior.
 * @example
 * // Using without a selector (returns the full link):
 * const link = useLink();
 * @example
 * // Using with a selector (extract a property from the link):
 * const linkSource = useLink((link) => link.source);
 * @example
 * // Using with a custom isEqual function:
 * const refinedLink = useLink(
 *   (link) => link,
 *   (prev, next) => prev.color === next.color
 * );
 * @param selector - The selector function to pick part of the link. Defaults to returning the entire link.
 * @param isEqual - The function used to check equality. Defaults to strict equality (`Object.is`).
 * @returns The selected link based on the current cell id.
 */
export function useLink<LinkData extends CellData = CellData, ReturnedLinks = LinkData>(
  selector: (item: LinkData) => ReturnedLinks = identitySelector as (
    item: LinkData
  ) => ReturnedLinks,
  isEqual: (a: ReturnedLinks, b: ReturnedLinks) => boolean = isStrictEqual
): ReturnedLinks {
  const id = useLinkId();
  const { graphView: { links } } = useGraphStore();

  // The container stores CellData but users pass a narrower LinkData generic.
  // This boundary cast is safe because the graph populates the container with the same shape.
  const typedLinks = links as ReadonlyContainer<LinkData>;

  return useContainerItem(typedLinks, id, selector, isEqual) as ReturnedLinks;
}
