import { warnSchedulerCascade } from './dev-warnings';

/** Rounds of cascading callbacks one flush drains before it yields to the event loop. */
const MAX_CASCADE_ROUNDS = 100;

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
    for (let round = 0; callbacks.size > 0 && round < MAX_CASCADE_ROUNDS; round += 1) {
      const pending = callbacks;
      callbacks = new Set();
      for (const callback of pending) {
        // One scheduler serves every graph on the page: a callback that throws
        // must not stop the others, nor leave the scheduler flushing forever.
        try {
          callback();
        } catch (error) {
          rethrowLater(error);
        }
      }
    }

    flushing = false;
    if (callbacks.size === 0) return;
    // Callbacks keep scheduling each other (a change handler that changes what
    // it listens to). Draining them here would never return and freeze the
    // page, so the rest runs on a later task.
    scheduled = true;
    setTimeout(flush);
    warnSchedulerCascade();
  };

  return (callback: () => void): void => {
    callbacks.add(callback);

    // If we're already inside a flush, the flush loop will pick up
    // the new callback — no need to schedule another microtask.
    if (scheduled || flushing) {
      return;
    }

    scheduled = true;
    queueMicrotask(flush);
  };
}

export const simpleScheduler = createScheduler();
