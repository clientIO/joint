import { useLayoutEffect } from 'react';
import { usePaper } from './use-paper';
import type { PaperEvents } from '../types/event.types';
import { handlePaperEvents } from '../utils/handle-paper-events';
import { useGraph } from './use-graph';

/**
 * A hook that listens to paper events and triggers the corresponding callbacks.
 * @param events - An object where keys are event names and values are callback functions.
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
export function usePaperEvents(events: PaperEvents) {
  const paper = usePaper();
  const graph = useGraph();
  useLayoutEffect(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    const stopListening = handlePaperEvents(graph, paper, events);
    return () => {
      stopListening();
    };
  }, [events, graph, paper]);
}
