/**
 * Creates a microtask-based scheduler that batches callbacks.
 *
 * Cascading callbacks (added during flush) are processed in the SAME
 * microtask so that all listener notifications land in a single React
 * batch update instead of triggering separate re-render cycles.
 * @returns A function that queues callbacks for batched execution.
 */
export function createScheduler(): (callback: () => void) => void {
  let scheduled = false;
  let flushing = false;
  let callbacks = new Set<() => void>();

  const flush = (): void => {
    scheduled = false;
    flushing = true;

    // Process cascading callbacks in the same flush so React sees
    // all store changes as a single batched update.
    while (callbacks.size > 0) {
      const pending = callbacks;
      callbacks = new Set();
      for (const callback of pending) {
        callback();
      }
    }

    flushing = false;
  };

  return (callback: () => void): void => {
    callbacks.add(callback);

    // If we're already inside a flush, the while-loop will pick up
    // the new callback — no need to schedule another microtask.
    if (scheduled || flushing) {
      return;
    }

    scheduled = true;
    queueMicrotask(flush);
  };
}

export const simpleScheduler = createScheduler();
