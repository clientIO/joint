import { useContext } from 'react';
import { PaperContext } from '../context';

/**
 * Hook to access the current GraphProvider View context or a specific view by id from the GraphProvider Store.
 * If used outside of a GraphProvider View context, it will try to get the view from the store using the provided id.
 * @returns The current GraphProvider View context or the view with the specified id from the store, or null if not found.
 */
export function usePaperContext(): PaperContext {
  const ctx = useContext(PaperContext);
  if (!ctx) {
    throw new Error('usePaperContext must be used within a Paper or RenderElement');
  }

  return ctx;
}
