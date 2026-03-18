import { useContext } from 'react';
import { useElementsLayout } from './use-stores';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';
import { isStrictEqual } from '../utils/selector-utils';
import type { ElementLayout } from '../state/state.types';

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
 * Returns width, height, x, and y from the actual graph cell.
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

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: ElementLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    // When user provides a custom selector, use their isEqual or Object.is (not IS_EQUAL).
    actualIsEqual = selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined;
  } else {
    actualSelector = selectorOrIsEqual as ((layout: ElementLayout | undefined) => S) | undefined;
    // When no selector: use IS_EQUAL for structural comparison of the full layout object.
    // When selector provided: use their isEqual or fall through to Object.is.
    actualIsEqual = isEqual;
  }

  // Default: IS_EQUAL when no selector (comparing full layout objects),
  // isStrictEqual when selector is provided (comparing arbitrary return values).
  const defaultIsEqual = actualSelector
    ? (isStrictEqual as (a: S, b: S) => boolean)
    : (IS_EQUAL as (a: S, b: S) => boolean);
  const resolvedIsEqual = actualIsEqual ?? defaultIsEqual;

  if (!actualId) {
    throw new Error('useElementLayout must be used inside Paper renderElement');
  }

  return useElementsLayout((snapshot) => {
    const angle = snapshot.angles[actualId];
    const size = snapshot.sizes[actualId];
    const position = snapshot.positions[actualId];
    if (!size || !position) {
      return undefined as S;
    }
    if (actualSelector) {
      return actualSelector({
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        angle: angle ?? 0,
      });
    }
    return {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      angle: angle ?? 0,
    } as S;
  }, resolvedIsEqual);
}
