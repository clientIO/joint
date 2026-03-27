import { useMemo } from 'react';
import type { FlatLinkData } from '../types/data-types';
import type { CellId } from '../types/cell-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

/**
 * Hook to access full link items (`FlatLinkData`) from the graph.
 *
 * Returns items with `data`, `source`, `target`, `color`, `labels`, etc.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all links as a stable `Map<CellId, FlatLinkData>`.
 * - **IDs**: returns a filtered subset. Subscribes per-ID — best performance for known subsets.
 * - **Selector**: applies a selector over the full `Map`. Re-renders only when the selector output changes.
 *
 * @example
 * ```tsx
 * const all = useLinks();
 * const subset = useLinks('l1', 'l2');
 * const count = useLinks((items) => items.size);
 * ```
 * @group Hooks
 */
export function useLinks(): Map<CellId, FlatLinkData>;
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function useLinks(...ids: [string, ...string[]]): Map<CellId, FlatLinkData>;
export function useLinks<S>(
  selector: (items: Map<CellId, FlatLinkData>) => S,
  isEqual?: (a: S, b: S) => boolean,
): S;
export function useLinks<S = Map<CellId, FlatLinkData>>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, FlatLinkData>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, FlatLinkData> | S {
  const { graphView: { links } } = useGraphStore();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')],
  );

  const idsOrSelector = isSelectorMode
    ? (args[0] as (items: Map<string, FlatLinkData>) => S)
    : stableIds;
  const isEqual = isSelectorMode
    ? (args[1] as ((a: S, b: S) => boolean) | undefined)
    : undefined;

  return useContainerItems(
    links,
    idsOrSelector as (items: Map<string, FlatLinkData>) => S,
    isEqual,
  ) as Map<CellId, FlatLinkData> | S;
}
