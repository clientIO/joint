import { useContext } from 'react';
import { useGraphStore } from './use-graph-store';
import { usePaperStoreContext } from './use-paper-context';
import { useStoreSelector } from './use-graph-store-selector';
import type { LinkLayout } from '../store/graph-store';

// Re-export LinkLayout for convenience
export type { LinkLayout } from '../store/graph-store';
import type { dia } from '@joint/core';
import { CellIdContext, ReactPaperIdContext } from '../context';

/**
 * Hook to get layout data (geometry) for a specific link.
 * Returns sourceX, sourceY, targetX, targetY, and d (path) from the link view.
 * @param id - Optional ID of the link to get layout for. If not provided, uses the current cell ID from context.
 * @returns The layout data or undefined if not found
 * @group Hooks
 * @example
 * ```tsx
 * // With explicit ID
 * function MyComponent() {
 *   const layout = useLinkLayout('link-1');
 *
 *   if (!layout) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       Source: ({layout.sourceX}, {layout.sourceY})
 *       Target: ({layout.targetX}, {layout.targetY})
 *     </div>
 *   );
 * }
 * ```
 * @example
 * ```tsx
 * // Using context (inside renderLink)
 * function MyLink() {
 *   const layout = useLinkLayout(); // Uses CellIdContext
 *
 *   return (
 *     <path d={layout?.d} stroke="blue" fill="none" />
 *   );
 * }
 * ```
 */
export function useLinkLayout<Id extends dia.Cell.ID | undefined = undefined>(
  id?: Id
): Id extends dia.Cell.ID ? LinkLayout | undefined : LinkLayout | undefined {
  const contextId = useContext(CellIdContext);
  const { layoutState } = useGraphStore();
  // Try PaperStoreContext first (for Paper component), fall back to ReactPaperIdContext (for ReactPaper)
  const paperStoreContext = usePaperStoreContext(true);
  const reactPaperId = useContext(ReactPaperIdContext);
  const paperId = paperStoreContext?.paperId ?? reactPaperId;

  if (!paperId) {
    throw new Error('useLinkLayout must be used within a Paper or ReactPaper');
  }

  const actualId = id ?? contextId;
  if (!actualId) {
    throw new Error('useLinkLayout must be used inside Paper renderLink or provide an id');
  }

  return useStoreSelector(layoutState, (snapshot) => {
    const paperLinkLayouts = snapshot.links[paperId];
    return paperLinkLayouts?.[actualId];
  });
}
