import { useGraphStore } from './use-graph-store';
import { useSyncExternalStore } from 'react';

export function useAreElementsMeasured() {
  const { graphView, measureState } = useGraphStore();
  return useSyncExternalStore(
    (onStoreChange) => {
      // subscribe for both, elements size from container and also measure state changes.
      const unsubscribeGraphView = graphView.elements.subscribeToFull(onStoreChange);
      const unsubscribeMeasureState = measureState.subscribe(onStoreChange);
      return () => {
        unsubscribeGraphView();
        unsubscribeMeasureState();
      };
    },
    () => {
      const elementsSize = graphView.elements.getSize();
      const { measuredElements, observedElements, needSomeElementBeMeasured } = measureState.get();
      if (needSomeElementBeMeasured) {
        console.log(needSomeElementBeMeasured, { measuredElements, observedElements });
        return observedElements > 0 && measuredElements === observedElements;
      }
      return elementsSize > 0;
    }
  );
}
