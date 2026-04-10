import { useGraphStore } from './use-graph-store';
import { useSyncExternalStore } from 'react';

export function useAreElementsMeasured() {
  const { measureState } = useGraphStore();
  return useSyncExternalStore(
    (onStoreChange) => {
      // subscribe for both, elements size from container and also measure state changes.
      const unsubscribeMeasureState = measureState.subscribe(onStoreChange);
      return () => {
        unsubscribeMeasureState();
      };
    },
    () => {
      return measureState.get() > 0;
    }
  );
}
