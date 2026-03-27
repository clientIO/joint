import { useMemo } from 'react';
import type { CellId } from '../types/cell-id';
import type { Link } from '../types/data-types';
import { useGraphStore } from './use-graph-store';
import { useContainerItems } from './use-container-items';

/**
 * Hook to access all graph links, a filtered subset, or a selector-derived value.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all links as a stable `Map`.
 * - **IDs**: returns a filtered subset.
 * - **Selector**: applies a selector over the full `Map`.
 *
 * @group Hooks
 */
export function useLinksData<D extends object | undefined = undefined>(): Map<CellId, Link<D>>;
export function useLinksData<D extends object | undefined = undefined>(
  ...ids: [string, ...string[]]
): Map<CellId, Link<D>>;
export function useLinksData<D extends object | undefined = undefined, S = Map<CellId, Link<D>>>(
  selector: (items: Map<CellId, Link<D>>) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useLinksData<D extends object | undefined = undefined, S = Map<CellId, Link<D>>>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<CellId, Link<D>>) => S, ((a: S, b: S) => boolean)?]
): Map<CellId, Link<D>> | S {
  const {
    graphView: { links },
  } = useGraphStore<undefined, D>();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  const idsOrSelector = isSelectorMode
    ? (args[0] as (items: Map<string, Link<D>>) => S)
    : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(links, idsOrSelector as (items: Map<string, Link<D>>) => S, isEqual) as
    | Map<CellId, Link<D>>
    | S;
}
