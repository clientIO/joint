export interface SubscribeHandler {
  readonly subscribe: (onStoreChange: () => void) => () => void;
  readonly notifySubscribers: () => void;
}

/**
 * Utility to handle subscriptions and notify subscribers.
 * @group utils
 * @internal
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
