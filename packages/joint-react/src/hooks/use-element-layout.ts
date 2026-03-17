import { useContext } from 'react';
import { useGraphStore } from './use-graph-store';
import { useStore } from './use-stores';
import type { ElementLayout } from '../store/graph-store';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';

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
  const { layoutState } = useGraphStore();

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: ElementLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    actualIsEqual =
      (selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined) ??
      (IS_EQUAL as (a: S, b: S) => boolean);
  } else {
    actualSelector = selectorOrIsEqual as ((layout: ElementLayout | undefined) => S) | undefined;
    actualIsEqual = isEqual ?? (IS_EQUAL as (a: S, b: S) => boolean);
  }

  if (!actualId) {
    throw new Error('useElementLayout must be used inside Paper renderElement');
  }

  return useStore(
    layoutState,
    (snapshot) => {
      const angle = snapshot.elements.angles[actualId];
      const size = snapshot.elements.sizes[actualId];
      const position = snapshot.elements.positions[actualId];
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
    },
    actualIsEqual
  );
}
