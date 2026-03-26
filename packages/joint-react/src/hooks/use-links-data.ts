import { useMemo } from 'react';
import type { CellData } from '../types/cell-data';
import type { CellId } from '../types/cell-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

/**
 * Hook to access all graph links, a filtered subset, or a selector-derived value.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all links as a stable `Map`. Re-renders only when link data changes.
 * - **IDs**: returns a filtered subset. Subscribes per-ID — best performance for known subsets.
 * - **Selector**: applies a selector over the full `Map`. Re-renders only when the selector output changes.
 *
 * @example
 * ```tsx
 * const all = useLinksData();
 * const subset = useLinksData('l1', 'l2');
 * const count = useLinksData((items) => items.size);
 * ```
 * @group Hooks
 */
export function useLinksData<
  LinkData extends object = CellData,
>(): Map<CellId, LinkData>;
export function useLinksData<
  LinkData extends object = CellData,
>(...ids: [string, ...string[]]): Map<CellId, LinkData>;
export function useLinksData<
  LinkData extends object = CellData,
  S = Map<CellId, LinkData>,
>(
  selector: (items: Map<CellId, LinkData>) => S,
  isEqual?: (a: S, b: S) => boolean,
): S;
export function useLinksData<
  LinkData extends object = CellData,
  S = Map<CellId, LinkData>,
>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, LinkData>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, LinkData> | S {
  const { graphView: { links } } = useGraphStore();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  const idsOrSelector: string[] | ((items: Map<string, CellData>) => S) | undefined = isSelectorMode
    ? (args[0] as (items: Map<string, CellData>) => S)
    : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(
    links,
    idsOrSelector as (items: Map<string, CellData>) => S,
    isEqual
  ) as Map<CellId, LinkData> | S;
}
