import { useCallback, useContext } from 'react';
import { usePaperStore } from './use-paper';
import type { LinkLayout } from '../types/cell-data';
import { isStrictEqual } from '../utils/selector-utils';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';
import { useGraphStore } from './use-graph-store';
import { useContainerItem } from './use-container-item';

// Re-export LinkLayout for convenience
export type { LinkLayout } from '../types/cell-data';

/** Default link layout returned when link view hasn't been rendered yet. */
const DEFAULT_LINK_LAYOUT: LinkLayout = {
  sourceX: 0,
  sourceY: 0,
  targetX: 0,
  targetY: 0,
  d: '',
};

/**
 * Structural equality for full LinkLayout objects.
 * @param a
 * @param b
 */
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

/**
 * Hook to get layout data (geometry) for a specific link.
 * Uses per-ID subscription via useContainerItem — only re-renders when THIS link's layout changes.
 * @returns The layout data, selected data, or undefined if not found.
 * @group Hooks
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
  const {
    graphView: { linksLayout },
  } = useGraphStore();

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: LinkLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    actualIsEqual = selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined;
  } else {
    actualSelector = selectorOrIsEqual as ((layout: LinkLayout | undefined) => S) | undefined;
    actualIsEqual = isEqual;
  }

  const defaultIsEqual = actualSelector
    ? (isStrictEqual as (a: S, b: S) => boolean)
    : (IS_EQUAL as (a: S, b: S) => boolean);
  const resolvedIsEqual = actualIsEqual ?? defaultIsEqual;

  if (!actualId) {
    throw new Error('useLinkLayout must be used inside Paper renderLink or provide an id');
  }

  // Extract LinkLayout for this paper from the per-link Record<paperId, LinkLayout>
  const composedSelector = useCallback(
    (perPaperLayouts: Record<string, LinkLayout>): S => {
      const layout = perPaperLayouts[paperId];
      if (actualSelector) {
        return actualSelector(layout);
      }
      return (layout ?? DEFAULT_LINK_LAYOUT) as S;
    },
    [paperId, actualSelector]
  );

  // Per-ID subscription via useContainerItem — only fires when THIS link's layout changes
  const result = useContainerItem(linksLayout, actualId, composedSelector, resolvedIsEqual);

  // When no selector and result is undefined (link not in container yet), return default
  if (!actualSelector && result === undefined) {
    const hasExplicitId = !isFirstArgumentSelector && idOrSelector !== undefined;
    if (hasExplicitId) {
      return undefined as S;
    }
    return DEFAULT_LINK_LAYOUT as S;
  }

  if (actualSelector && result === undefined) {
    // eslint-disable-next-line unicorn/no-useless-undefined -- TypeScript requires explicit argument for non-optional parameter
    return actualSelector(undefined);
  }

  return result as S;
}
