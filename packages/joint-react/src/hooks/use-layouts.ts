/* eslint-disable @typescript-eslint/unified-signatures */
import { useMemo } from 'react';
import { useGraphStore } from './use-graph-store';
import type { ElementLayout, LinkLayout } from '../types/cell-data';
import { useContainerItems } from './use-container-items';
/**
 * Hook to access all element layouts, a filtered subset, or a selector-derived value.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all element layouts as a stable `Map`.
 * - **IDs**: returns a filtered subset. Subscribes per-ID — best performance for known subsets.
 * - **Selector**: applies a selector over the full `Map`. Re-renders only when the selector output changes.
 *
 * @example
 * ```tsx
 * // All layouts
 * const all = useElementsLayout();
 *
 * // Specific elements only
 * const subset = useElementsLayout('id1', 'id2');
 *
 * // Selector — e.g. proximity check
 * const closeIds = useElementsLayout((layouts) =>
 *   [...layouts.entries()].filter(([, l]) => l.x < 100).map(([id]) => id)
 * );
 * ```
 * @group Hooks
 */
export function useElementsLayout(): Map<string, ElementLayout>;
export function useElementsLayout(...ids: [string, ...string[]]): Map<string, ElementLayout>;
export function useElementsLayout<S>(
  selector: (items: Map<string, ElementLayout>) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useElementsLayout<S = Map<string, ElementLayout>>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<string, ElementLayout>) => S, ((a: S, b: S) => boolean)?]
): Map<string, ElementLayout> | S {
  const {
    graphView: { elementsLayout },
  } = useGraphStore();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  const idsOrSelector: string[] | ((items: Map<string, ElementLayout>) => S) | undefined =
    isSelectorMode ? (args[0] as (items: Map<string, ElementLayout>) => S) : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(
    elementsLayout,
    idsOrSelector as (items: Map<string, ElementLayout>) => S,
    isEqual
  ) as Map<string, ElementLayout> | S;
}

/**
 * Hook to access all link layouts, a filtered subset, or a selector-derived value.
 *
 * Supports 3 call signatures:
 *
 * - **No args**: returns all link layouts as a stable `Map`.
 * - **IDs**: returns a filtered subset. Subscribes per-ID — best performance for known subsets.
 * - **Selector**: applies a selector over the full `Map`. Re-renders only when the selector output changes.
 *
 * @group Hooks
 */
export function useLinksLayout(): Map<string, Record<string, LinkLayout>>;
export function useLinksLayout(
  ...ids: [string, ...string[]]
): Map<string, Record<string, LinkLayout>>;
export function useLinksLayout<S>(
  selector: (items: Map<string, Record<string, LinkLayout>>) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useLinksLayout<S = Map<string, Record<string, LinkLayout>>>(
  ...args:
    | []
    | [string, ...string[]]
    | [(items: Map<string, Record<string, LinkLayout>>) => S, ((a: S, b: S) => boolean)?]
): Map<string, Record<string, LinkLayout>> | S {
  const {
    graphView: { linksLayout },
  } = useGraphStore();

  const isSelectorMode = typeof args[0] === 'function';
  const ids = isSelectorMode ? undefined : (args as string[]);

  const stableIds = useMemo(
    () => (ids && ids.length > 0 ? ids : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids?.join(',')]
  );

  const idsOrSelector:
    | string[]
    | ((items: Map<string, Record<string, LinkLayout>>) => S)
    | undefined = isSelectorMode
    ? (args[0] as (items: Map<string, Record<string, LinkLayout>>) => S)
    : stableIds;
  const isEqual = isSelectorMode ? (args[1] as ((a: S, b: S) => boolean) | undefined) : undefined;

  return useContainerItems(
    linksLayout,
    idsOrSelector as (items: Map<string, Record<string, LinkLayout>>) => S,
    isEqual
  ) as Map<string, Record<string, LinkLayout>> | S;
}
