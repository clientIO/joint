import type { dia } from '@joint/core';
import { util } from '@joint/core';
import type { GraphLink } from '../types/link-types';
import { useGraphStoreSelector } from './use-graph-store-selector';

/**
 * Default selector function that returns all links unchanged.
 * Used when no custom selector is provided to useLinks.
 * @template Link - The type of links
 * @param items - The links record to select from
 * @returns The same links record
 * @internal
 */
function defaultSelector<Link extends GraphLink = GraphLink>(
  items: Record<dia.Cell.ID, Link>
): Record<dia.Cell.ID, Link> {
  return items;
}

/**
 * Hook to access and subscribe to links (edges) from the graph store.
 *
 * This hook provides reactive access to links with optional selection and custom equality comparison.
 * It uses React's useSyncExternalStore internally for optimal performance.
 *
 * **Features:**
 * - Subscribes to link changes in the graph store
 * - Supports custom selectors to extract specific data
 * - Custom equality comparison to prevent unnecessary re-renders
 * - Type-safe with TypeScript generics
 *
 * **How it works:**
 * 1. Subscribes to the links in the graph store
 * 2. Retrieves the current links snapshot
 * 3. Applies the selector function (if provided)
 * 4. Compares the result with the previous value using isEqual
 * 5. Only triggers re-render if the selected value actually changed
 * @template Link - The type of links in the graph
 * @template SelectorReturnType - The return type of the selector function
 * @param selector - Optional function to select/extract a portion of the links. Defaults to returning all links.
 * @param isEqual - Optional function to compare previous and new values. Defaults to deep equality.
 * @returns The selected links data (or all links if no selector provided)
 * @group Hooks
 * @example
 * ```ts
 * // Get all links as a Record
 * const links = useLinks();
 * // links is Record<dia.Cell.ID, GraphLink>
 * ```
 * @example
 * ```ts
 * // Extract only link IDs
 * const linkIds = useLinks((links) => Object.keys(links));
 * ```
 * @example
 * ```ts
 * // Get a specific link by ID
 * const link = useLinks((links) => links['link-1']);
 * ```
 * @example
 * ```ts
 * // Custom equality check (only re-render if count changes)
 * const linkCount = useLinks(
 *   (links) => Object.keys(links).length,
 *   (prev, next) => prev === next
 * );
 * ```
 */
export function useLinks<Link extends GraphLink = GraphLink, SelectorReturnType = Record<dia.Cell.ID, Link>>(
  selector: (items: Record<dia.Cell.ID, Link>) => SelectorReturnType = defaultSelector as () => SelectorReturnType,
  isEqual: (a: SelectorReturnType, b: SelectorReturnType) => boolean = util.isEqual
): SelectorReturnType {
  return useGraphStoreSelector((snapshot) => {
    return selector(snapshot.links as Record<dia.Cell.ID, Link>);
  }, isEqual);
}
