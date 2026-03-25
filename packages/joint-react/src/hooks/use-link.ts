import { useLinkId } from './use-link-id';
import type { FlatLinkData } from '../types/data-types';
import { useData } from './use-stores';
import { isStrictEqual, identitySelector } from '../utils/selector-utils';

/**
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
export function useLink<LinkData = FlatLinkData, ReturnedLinks = LinkData>(
  selector: (item: LinkData) => ReturnedLinks = identitySelector as (
    item: LinkData
  ) => ReturnedLinks,
  isEqual: (a: ReturnedLinks, b: ReturnedLinks) => boolean = isStrictEqual
): ReturnedLinks {
  const id = useLinkId();

  return useData<ReturnedLinks>((store) => {
    const link = store.links[id] as LinkData | undefined;
    if (!link) {
      return undefined as ReturnedLinks;
    }
    return selector(link);
  }, isEqual);
}
