/* eslint-disable @typescript-eslint/unified-signatures */
/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo } from 'react';
import type { LinkRecord } from '../types/data-types';
import type { CellId } from '../types/cell-id';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

/**
 * Hook to access full link items from the graph.
 *
 * Returns items with `data`, `source`, `target`, `color`, `labels`, `layout`, etc.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all links as a stable `Map`.
 * - **IDs**: returns a filtered subset.
 * - **Selector**: applies a selector over the full `Map`.
 *
 * @group Hooks
 */
export function useLinks<T extends object = Record<string, unknown>>(): Map<CellId, LinkRecord<T>>;
export function useLinks<T extends object = Record<string, unknown>>(
  ...ids: [string, ...string[]]
): Map<CellId, LinkRecord<T>>;
export function useLinks<T extends object = Record<string, unknown>, S = unknown>(
  selector: (items: Map<CellId, LinkRecord<T>>) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useLinks<T extends object = Record<string, unknown>, S = Map<CellId, LinkRecord<T>>>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, LinkRecord<T>>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, LinkRecord<T>> | S {
  const {
    graphView: { links },
  } = useGraphStore<any, T>();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  if (isSelectorMode) {
    const selector = args[0] as (items: Map<string, LinkRecord<T>>) => S;
    const isEqual = args[1] as ((a: S, b: S) => boolean) | undefined;
    return useContainerItems(links, selector, isEqual);
  }

  return useContainerItems(links, stableIds);
}
