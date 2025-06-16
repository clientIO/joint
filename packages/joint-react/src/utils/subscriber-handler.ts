import type { dia } from '@joint/core';

export interface SubscribeHandler {
  readonly subscribe: (onStoreChange: (changedIds?: Set<dia.Cell.ID>) => void) => () => void;
  readonly notifySubscribers: () => void;
}

/**
 * Subscribe handler for managing subscribers and notifying them.
 * This handler allows you to subscribe to changes and notify subscribers when changes occur.
 * @param beforeSubscribe - Optional callback to be called before notifying subscribers.
 * @returns - An object with subscribe and notifySubscribers methods.
 * @group utils
 */
export function subscribeHandler(
  beforeSubscribe?: () => Set<dia.Cell.ID> | undefined
): SubscribeHandler {
  let isScheduled = false;
  const subscribers = new Set<(changedIds?: Set<dia.Cell.ID>) => void>();

  return {
    subscribe: (onStoreChange: (changedIds?: Set<dia.Cell.ID>) => void) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },
    notifySubscribers: () => {
      if (!isScheduled) {
        isScheduled = true;
        requestAnimationFrame(() => {
          const changedIds = beforeSubscribe?.();
          for (const subscriber of subscribers) {
            subscriber(changedIds);
          }
          isScheduled = false;
        });
      }
    },
  };
}
