import { useLayoutEffect } from 'react';
import { usePaper } from './use-paper';
import type { PaperEvents } from '../types/event.types';
import { handlePaperEvents } from '../utils/handle-paper-events';

/**
 * A hook that listens to paper events and triggers the corresponding callbacks.
 * @param events - An object where keys are event names and values are callback functions.
 * @group Hooks
 */
export function usePaperEvents(events: PaperEvents) {
  const paper = usePaper();
  useLayoutEffect(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    const stopListening = handlePaperEvents(paper, events);
    return () => {
      stopListening();
    };
  }, [events, paper]);
}
