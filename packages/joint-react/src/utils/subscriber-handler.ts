import type { UpdateResult } from '../data/create-store-data';

export interface SubscribeHandler {
  readonly subscribe: (onStoreChange: (changedIds?: UpdateResult) => void) => () => void;
  readonly notifySubscribers: (batchName?: string) => void;
}

/**
 * Per-batch scheduler: coalesces multiple notify calls in the same frame,
 * but runs once per unique batchName (including undefined as its own batch).
 * Calls to `beforeSubscribe` can return an `UpdateResult` to pass to subscribers.
 * @param beforeSubscribe - Optional function to call before notifying subscribers.
 * @returns A SubscribeHandler with subscribe and notifySubscribers methods.
 */
export function subscribeHandler(
  beforeSubscribe?: (batchName?: string) => UpdateResult | undefined
): SubscribeHandler {
  const subscribers = new Set<(changedIds?: UpdateResult) => void>();

  // Treat "no batch name" as its own distinct key via a Symbol
  const DEFAULT_BATCH = Symbol('default-batch');
  type BatchKey = string | symbol;

  const pending = new Set<BatchKey>(); // preserves insertion order
  let frameScheduled = false;

  const raf =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0);

  /**
   * Schedules a flush of pending batches to notify subscribers.
   * Ensures that the flush happens in the next animation frame.
   */
  function scheduleFlush() {
    if (frameScheduled) return;
    frameScheduled = true;

    // microtask → next frame
    Promise.resolve().then(() => {
      raf(() => {
        frameScheduled = false;

        // snapshot current batches and clear, so newly queued batches go to next frame
        const batches = [...pending];
        pending.clear();

        for (const key of batches) {
          const batchName = key === DEFAULT_BATCH ? undefined : (key as string);
          const changedIds = beforeSubscribe?.(batchName);
          for (const subscriber of subscribers) {
            subscriber(changedIds);
          }
        }
      });
    });
  }

  return {
    subscribe(onStoreChange) {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },

    notifySubscribers(batchName?: string) {
      const key: BatchKey = batchName ?? DEFAULT_BATCH;
      pending.add(key); // de-dupe per batch per frame
      scheduleFlush();
    },
  };
}
