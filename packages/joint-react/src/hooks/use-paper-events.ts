import { useLayoutEffect } from 'react';
import { usePaper } from './use-paper';
import { mvc } from '@joint/core';
import type { PaperEvents, PaperEventType } from '../types/event.types';
import { handleEvent } from '../utils/handle-paper-events';

/**
 * A hook that listens to paper events and triggers the corresponding callbacks.
 * @param events - An object where keys are event names and values are callback functions.
 * @group Hooks
 */
export function usePaperEvents(events: PaperEvents) {
  const paper = usePaper();
  useLayoutEffect(() => {
    // An object to keep track of the listeners. It's not exposed, so the users
    const controller = new mvc.Listener();
    controller.listenTo(paper, 'all', (type: PaperEventType, ...args: unknown[]) =>
      handleEvent(type, events, paper, ...args)
    );
    return () => {
      controller.stopListening();
    };
  }, [events, paper]);
}
