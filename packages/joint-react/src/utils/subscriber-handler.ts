export interface SubscribeHandler {
  readonly subscribe: (onStoreChange: () => void) => () => void;
  readonly notifySubscribers: () => void;
}

/**
 * Subscribe handler for managing subscribers and notifying them.
 * This handler allows you to subscribe to changes and notify subscribers when changes occur.
 * @param beforeSubscribe - Optional callback to be called before notifying subscribers.
 * @returns - An object with subscribe and notifySubscribers methods.
 * @group utils
 */
export function subscribeHandler(beforeSubscribe?: () => void): SubscribeHandler {
  let isScheduled = false;
  const subscribers = new Set<() => void>();

  return {
    subscribe: (onStoreChange: () => void) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },
    notifySubscribers: () => {
      if (!isScheduled) {
        isScheduled = true;
        requestAnimationFrame(() => {
          beforeSubscribe?.();
          for (const subscriber of subscribers) {
            subscriber();
          }
          isScheduled = false;
        });
      }
    },
  };
}
