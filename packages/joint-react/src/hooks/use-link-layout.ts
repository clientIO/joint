import { useContext } from 'react';
import { usePaperStore } from './use-paper';
import { useLinksLayout } from './use-stores';
import type { LinkLayout } from '../types/cell-data';
import { isStrictEqual } from '../utils/selector-utils';

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
export type { LinkLayout } from '../types/cell-data';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';

/**
 * Hook to get layout data (geometry) for a specific link.
 * Returns sourceX, sourceY, targetX, targetY, and d (path) from the link view.
 * @returns The layout data, selected data, or undefined if not found.
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
  const { paperId } = usePaperStore();

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: LinkLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    // When user provides a custom selector, use their isEqual or isStrictEqual (not IS_EQUAL).
    actualIsEqual = selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined;
  } else {
    actualSelector = selectorOrIsEqual as ((layout: LinkLayout | undefined) => S) | undefined;
    actualIsEqual = isEqual;
  }

  // Default: IS_EQUAL when no selector (comparing full layout objects),
  // isStrictEqual when selector is provided (comparing arbitrary return values).
  const defaultIsEqual = actualSelector
    ? (isStrictEqual as (a: S, b: S) => boolean)
    : (IS_EQUAL as (a: S, b: S) => boolean);
  const resolvedIsEqual = actualIsEqual ?? defaultIsEqual;

  if (!actualId) {
    throw new Error('useLinkLayout must be used inside Paper renderLink or provide an id');
  }

  return useLinksLayout((linksMap) => {
    const paperLinkLayouts = linksMap.get(paperId);
    const layout = paperLinkLayouts?.[actualId];
    if (actualSelector) {
      return actualSelector(layout);
    }
    return layout as S;
  }, resolvedIsEqual);
}
