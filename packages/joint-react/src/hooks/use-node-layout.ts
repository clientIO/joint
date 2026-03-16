import { useContext } from 'react';
import { useGraphStore } from './use-graph-store';
import { useStore } from './use-stores';
import type { NodeLayout } from '../store/graph-store';
import type { CellId } from '../types/cell-id';
import { CellIdContext } from '../context';

const IS_EQUAL = (a: NodeLayout | undefined, b: NodeLayout | undefined): boolean => {
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
 * const layout = useNodeLayout('element-1');
 * ```
 * @example
 * ```tsx
 * // Using context (inside renderElement)
 * const layout = useNodeLayout();
 * ```
 * @example
 * ```tsx
 * // With selector (inside renderElement)
 * const x = useNodeLayout((layout) => layout?.x);
 * ```
 * @example
 * ```tsx
 * // With explicit ID and selector
 * const x = useNodeLayout('element-1', (layout) => layout?.x);
 * ```
 */
export function useNodeLayout(): NodeLayout;
export function useNodeLayout<S>(
  selector: (layout: NodeLayout | undefined) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useNodeLayout(id: CellId): NodeLayout | undefined;
export function useNodeLayout<S>(
  id: CellId,
  selector: (layout: NodeLayout | undefined) => S,
  isEqual?: (a: S, b: S) => boolean
): S;
export function useNodeLayout<S>(
  idOrSelector?: CellId | ((layout: NodeLayout | undefined) => S),
  selectorOrIsEqual?: ((layout: NodeLayout | undefined) => S) | ((a: S, b: S) => boolean),
  isEqual?: (a: S, b: S) => boolean
): NodeLayout | S | undefined {
  const contextId = useContext(CellIdContext);
  const { layoutState } = useGraphStore();

  const isFirstArgumentSelector = typeof idOrSelector === 'function';
  const actualId = isFirstArgumentSelector ? contextId : (idOrSelector ?? contextId);

  let actualSelector: ((layout: NodeLayout | undefined) => S) | undefined;
  let actualIsEqual: ((a: S, b: S) => boolean) | undefined;

  if (isFirstArgumentSelector) {
    actualSelector = idOrSelector;
    actualIsEqual =
      (selectorOrIsEqual as ((a: S, b: S) => boolean) | undefined) ??
      (IS_EQUAL as (a: S, b: S) => boolean);
  } else {
    actualSelector = selectorOrIsEqual as ((layout: NodeLayout | undefined) => S) | undefined;
    actualIsEqual = isEqual ?? (IS_EQUAL as (a: S, b: S) => boolean);
  }

  if (!actualId) {
    throw new Error('useNodeLayout must be used inside Paper renderElement');
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
