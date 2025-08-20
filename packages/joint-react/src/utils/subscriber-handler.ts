import type { UpdateResult } from '../data/create-store-data';

export interface SubscribeHandler {
  readonly subscribe: (onStoreChange: (changedIds?: UpdateResult) => void) => () => void;
  readonly notifySubscribers: (batchName?: string) => void;
}

/**
 * Subscribe handler for managing subscribers and notifying them.
 * This handler allows you to subscribe to changes and notify subscribers when changes occur.
 * @param beforeSubscribe - Optional callback to be called before notifying subscribers.
 * @returns - An object with subscribe and notifySubscribers methods.
 * @group utils
 */
export function subscribeHandler(
  beforeSubscribe?: (batchName?: string) => UpdateResult | undefined
): SubscribeHandler {
  let isScheduled = false;
  const subscribers = new Set<(changedIds?: UpdateResult) => void>();

  return {
    subscribe: (onStoreChange: (changedIds?: UpdateResult) => void) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },
    notifySubscribers: (batchName?: string) => {
      if (!isScheduled) {
        isScheduled = true;
        Promise.resolve().then(() => {
          requestAnimationFrame(() => {
            const changedIds = beforeSubscribe?.(batchName);
            for (const subscriber of subscribers) {
              subscriber(changedIds);
            }
            isScheduled = false;
          });
        });
      }
    },
  };
}
