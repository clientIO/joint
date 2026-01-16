import { useContext } from 'react';
import { useGraphStore } from './use-graph-store';
import { useStoreSelector } from './use-graph-store-selector';
import type { NodeLayout } from '../store/graph-store';
import type { dia } from '@joint/core';
import { CellIdContext } from '../context';

/**
 * Hook to get layout data (geometry) for a specific node.
 * Returns width, height, x, and y from the actual graph cell.
 * @param id - Optional ID of the node (element) to get layout for. If not provided, uses the current cell ID from context.
 * @returns The layout data (x, y, width, height) or undefined if not found
 * @group Hooks
 * @example
 * ```tsx
 * // With explicit ID
 * function MyComponent() {
 *   const layout = useNodeLayout('element-1');
 *
 *   if (!layout) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       Position: ({layout.x}, {layout.y})
 *       Size: {layout.width} x {layout.height}
 *     </div>
 *   );
 * }
 * ```
 * @example
 * ```tsx
 * // Using context (inside renderElement)
 * function MyElement() {
 *   const layout = useNodeLayout(); // Uses CellIdContext
 *
 *   return (
 *     <div>
 *       Position: ({layout?.x}, {layout?.y})
 *     </div>
 *   );
 * }
 * ```
 */
export function useNodeLayout(id?: dia.Cell.ID): NodeLayout | undefined {
  const contextId = useContext(CellIdContext);
  const { layoutState } = useGraphStore();
  const actualId = id ?? contextId;
  if (!actualId) {
    throw new Error('useNodeLayout must be used inside Paper renderElement');
  }

  return useStoreSelector(layoutState, (snapshot) => {
    return snapshot.layouts[actualId];
  });
}
