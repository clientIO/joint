import { useLayoutEffect, type DependencyList } from 'react';
import type { PaperEvents } from '../types/event.types';
import { handlePaperEvents } from '../utils/handle-paper-events';
import { useGraph } from './use-graph';
import { useRefValue } from './use-ref-value';
import type { PaperStore } from '../store';
import { usePaperStoreContext } from './use-paper-context';

interface Options extends PaperEvents {
  readonly paperRef?: React.RefObject<PaperStore | null>;
}

/**
 * A hook that listens to view (Paper) events and triggers the corresponding callbacks.
 * @param events - An object where keys are event names and values are callback functions.
 * @param dependencies - An optional array of dependencies that, when changed, will re-register the event listeners.
 * @group Hooks
 * @example
 * ```tsx
 * import { usePaperEvents } from '@jointjs/react';
 *
 * usePaperEvents({
 *  onBlankContextMenu({ event, paper }) {},
 * });
 * ```
 */
export function usePaperEvents(events: Options, dependencies: DependencyList = []) {
  const { paperRef } = events;
  const paperCtxMaybe = usePaperStoreContext(true);
  const paperRefMaybe = useRefValue(paperRef);
  const paper = paperCtxMaybe?.paper ?? paperRefMaybe?.paper;
  if (!paper) {
    throw new Error(
      'Paper is not available, either use usePaperStoreContext or provide a paperRef'
    );
  }
  const graph = useGraph();
  useLayoutEffect(() => {
    if (!paper || !graph) {
      return;
    }
    // An object to keep track of the listeners. It's not exposed, so the users
    const stopListening = handlePaperEvents(graph, paper, events);
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, graph, paper, ...dependencies]);
}
