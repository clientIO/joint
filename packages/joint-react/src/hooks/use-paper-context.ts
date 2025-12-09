import { useContext } from 'react';
import { PaperStoreContext } from '../context';
import type { PaperStore } from '../store';

/**
 * Hook to access the current GraphProvider View context or a specific view by id from the GraphProvider Store.
 * If used outside of a GraphProvider View context, it will try to get the view from the store using the provided id.
 * @param isNullable - If true, the hook will return null instead of throwing an error when used outside of a GraphProvider View context. Default is false.
 * @returns The current GraphProvider View context or the view with the specified id from the store, or null if not found.
 */
export function usePaperStoreContext<T extends boolean = false>(
  isNullable: T = false as T
): T extends true ? PaperStore | null : PaperStore {
  const ctx = useContext(PaperStoreContext);
  if (!ctx && !isNullable) {
    throw new Error('usePaperStoreContext must be used within a Paper or RenderElement');
  }

  const value = ctx ?? null;
  return value as T extends true ? PaperStore | null : PaperStore;
}
