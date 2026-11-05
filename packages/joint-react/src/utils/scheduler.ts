/**
 * Rethrows an error on a later task, so it still surfaces (to `window.onerror`
 * and the console) while the caller carries on.
 * @param error - The error a callback threw.
 */
export function rethrowLater(error: unknown): void {
  setTimeout(() => {
    throw error;
  });
}

/**
 * Creates a microtask-based scheduler that batches callbacks.
 *
 * Cascading callbacks (added during flush) are processed in the SAME
 * microtask so that all listener notifications land in a single React
 * batch update instead of triggering separate re-render cycles. A callback
 * that throws ends that microtask, and the error is reported like any other
 * uncaught error; the callbacks still queued run in the next microtask.
 * @returns A function that queues callbacks for batched execution.
 */
export function createScheduler(): (callback: () => void) => void {
  let scheduled = false;
  const callbacks = new Set<() => void>();

  const finishFlush = (): void => {
    if (callbacks.size > 0) {
      queueMicrotask(flush);
      return;
    }
    scheduled = false;
  };

  const flush = (): void => {
    // Queued before any callback runs, so it still runs if one of them throws.
    queueMicrotask(finishFlush);

    // A Set iteration also visits entries added while it runs, which is what
    // keeps cascading callbacks in this microtask.
    for (const callback of callbacks) {
      callbacks.delete(callback);
      callback();
    }
  };

  return (callback: () => void): void => {
    callbacks.add(callback);

    // Already scheduled or inside a flush: the pending flush picks it up.
    if (scheduled) {
      return;
    }

    scheduled = true;
    queueMicrotask(flush);
  };
}

export const simpleScheduler = createScheduler();
