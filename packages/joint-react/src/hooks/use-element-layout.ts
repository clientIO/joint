import { useCallback, useContext } from 'react';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';
import { isStrictEqual } from '../utils/selector-utils';
import type { ElementLayout } from '../types/cell-data';
import { useGraphStore } from './use-graph-store';
import { useContainerItem } from './use-container-item';

/** Default layout returned when element has no layout data yet. */
export const DEFAULT_LAYOUT: ElementLayout = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  angle: 0,
};

/**
 * Structural equality for full ElementLayout objects.
 * @param a
 * @param b
 */
const IS_EQUAL = (a: ElementLayout | undefined, b: ElementLayout | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.angle === b.angle
  );
};

/**
 * Hook to get layout data (geometry) for a specific node.
 * Uses per-ID subscription via useContainerItem — only re-renders when THIS element's layout changes.
 * @returns The layout data (x, y, width, height, angle), selected data, or undefined if not found.
 * @group Hooks
 * @example
 * ```tsx
 * // With explicit ID
 * const layout = useElementLayout('element-1');
 * ```
 * @example
 * ```tsx
 * // Using context (inside renderElement)
 * const layout = useElementLayout();
 * ```
 * @example
 * ```tsx
 * // With selector (inside renderElement)
 * const x = useElementLayout((layout) => layout?.x);
 * ```
 * @example
 * ```tsx
 * // With explicit ID and selector
 * const x = useElementLayout('element-1', (layout) => layout?.x);
 * ```
 */
export function useElementLayout(): ElementLayout;
export function useElementLayout<S>(
  selector: (layout: ElementLayout | undefined) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useElementLayout(id: CellId): ElementLayout | undefined;
export function useElementLayout<S>(
  id: CellId,
  selector: (layout: ElementLayout | undefined) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useElementLayout<S>(
  idOrSelector?: CellId | ((layout: ElementLayout | undefined) => S),
  selectorOrIsEqual?: ((layout: ElementLayout | undefined) => S) | ((a: S, b: S) => boolean),
  isEqual?: (a: S, b: S) => boolean
): ElementLayout | S | undefined {
  const contextId = useContext(CellIdContext);
  const { graphView: { elementsLayout } } = useGraphStore();

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: ElementLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    actualIsEqual = selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined;
  } else {
    actualSelector = selectorOrIsEqual as ((layout: ElementLayout | undefined) => S) | undefined;
    actualIsEqual = isEqual;
  }

  const defaultIsEqual = actualSelector
    ? (isStrictEqual as (a: S, b: S) => boolean)
    : (IS_EQUAL as (a: S, b: S) => boolean);
  const resolvedIsEqual = actualIsEqual ?? defaultIsEqual;

  if (!actualId) {
    throw new Error('useElementLayout must be used inside Paper renderElement');
  }

  // Compose the selector: apply user selector if provided, otherwise return full layout
  const composedSelector = useCallback(
    (layout: ElementLayout): S => {
      if (actualSelector) {
        return actualSelector(layout);
      }
      return layout as S;
    },
    [actualSelector]
  );

  // Use per-ID subscription via useContainerItem — only fires when THIS element's layout changes
  const result = useContainerItem(elementsLayout, actualId, composedSelector, resolvedIsEqual);

  // When called without explicit ID (inside renderElement), default to DEFAULT_LAYOUT
  // When called with explicit ID and element doesn't exist, return undefined
  if (!actualSelector && result === undefined) {
    const hasExplicitId = !isFirstArgumentSelector && idOrSelector !== undefined;
    if (hasExplicitId) {
      return undefined as S;
    }
    return DEFAULT_LAYOUT as S;
  }

  // When selector provided, let it handle undefined by passing undefined through
  if (actualSelector && result === undefined) {
    // eslint-disable-next-line unicorn/no-useless-undefined -- TypeScript requires explicit argument for non-optional parameter
    return actualSelector(undefined);
  }

  return result as S;
}
