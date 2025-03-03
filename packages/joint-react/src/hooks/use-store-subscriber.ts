/**
 * There is global weak map for subscribers.
 * @internal
 */
import { useEffect, useId, useMemo } from 'react';
import type { Store } from './use-store';

/**
 * Hook to subscribe to a store on global scope.
 * @param subscribe memoized function to subscribe to the store.
 * @param onChange
 * @internal
 */
export function useStoreSelector<Item>(
  subscribe: (onStoreChange: () => void) => () => void,
  onChange: () => Item
): Store {
  const id = useId();
  useEffect(() => {
    // this is called when the store changes, called by the store
    function onStoreChange() {}

    const unsubscribe = subscribe(onStoreChange);
    return () => {
      unsubscribe();
    };
  }, [id, onChange, subscribe]);

  return useMemo(() => {
    return {
      notifySubscribers: () => {},
      subscribe,
    };
  }, [subscribe]);
}
