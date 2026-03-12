import { useContext } from 'react';
import { useGraphStore } from './use-graph-store';
import { usePaperStore } from './use-paper';
import { useStore } from './use-stores';
import type { LinkLayout } from '../store/graph-store';

const IS_EQUAL = (a: LinkLayout | undefined, b: LinkLayout | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.sourceX === b.sourceX &&
    a.sourceY === b.sourceY &&
    a.targetX === b.targetX &&
    a.targetY === b.targetY &&
    a.d === b.d
  );
};

// Re-export LinkLayout for convenience
export type { LinkLayout } from '../store/graph-store';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';

/**
 * Hook to get layout data (geometry) for a specific link.
 * Returns sourceX, sourceY, targetX, targetY, and d (path) from the link view.
 * @param idOrSelector - Optional ID of the link, or a selector function when used without ID.
 * @param selector - Optional selector to extract a portion of the layout data.
 * @returns The layout data or undefined if not found
 * @group Hooks
 * @example
 * ```tsx
 * // With explicit ID
 * const layout = useLinkLayout('link-1');
 * ```
 * @example
 * ```tsx
 * // Using context (inside renderLink)
 * const layout = useLinkLayout();
 * ```
 * @example
 * ```tsx
 * // With selector (inside renderLink)
 * const d = useLinkLayout((layout) => layout?.d);
 * ```
 * @example
 * ```tsx
 * // With explicit ID and selector
 * const d = useLinkLayout('link-1', (layout) => layout?.d);
 * ```
 */
export function useLinkLayout(): LinkLayout;
export function useLinkLayout<S>(
  selector: (layout: LinkLayout | undefined) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useLinkLayout(id: CellId): LinkLayout | undefined;
export function useLinkLayout<S>(
  id: CellId,
  selector: (layout: LinkLayout | undefined) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useLinkLayout<S>(
  idOrSelector?: CellId | ((layout: LinkLayout | undefined) => S),
  selectorOrIsEqual?: ((layout: LinkLayout | undefined) => S) | ((a: S, b: S) => boolean),
  isEqual?: (a: S, b: S) => boolean
): LinkLayout | S | undefined {
  const contextId = useContext(CellIdContext);
  const { layoutState } = useGraphStore();
  const { paperId } = usePaperStore();

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: LinkLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    actualIsEqual =
      (selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined) ??
      (IS_EQUAL as (a: S, b: S) => boolean);
  } else {
    actualSelector = selectorOrIsEqual as ((layout: LinkLayout | undefined) => S) | undefined;
    actualIsEqual = isEqual ?? (IS_EQUAL as (a: S, b: S) => boolean);
  }

  if (!actualId) {
    throw new Error('useLinkLayout must be used inside Paper renderLink or provide an id');
  }

  return useStore(
    layoutState,
    (snapshot) => {
      const paperLinkLayouts = snapshot.links[paperId];
      const layout = paperLinkLayouts?.[actualId];
      if (actualSelector) {
        return actualSelector(layout);
      }
      return layout as S;
    },
    actualIsEqual
  );
}
