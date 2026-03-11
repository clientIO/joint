import {
  unstable_cancelCallback as cancelCallback,
  unstable_scheduleCallback as scheduleCallback,
  unstable_getCurrentPriorityLevel as getCurrentPriorityLevel,
} from 'scheduler';

/**
 * Global scheduler that batches all state notifications into a single flush.
 *
 * Instead of each VersionedState scheduling its own queueMicrotask,
 * all notifications go through this scheduler. This ensures:
 * 1. All state updates in the same synchronous block flush together
 * 2. Derived states recompute and notify in the same flush (drain loop)
 * 3. Tests can flush synchronously via `flushNowForTests()`
 */
class GlobalScheduler {
  private readonly pending = new Set<() => void>();
  private callbackId: unknown | null = null;
  private isFlushing = false;

  /**
   * Schedule a callback to run in the next flush.
   * Multiple calls in the same tick are batched.
   * @param callback - The callback to schedule.
   */
  schedule(callback: () => void): void {
    this.pending.add(callback);
    if (this.callbackId !== null) {
      return;
    }
    this.callbackId = scheduleCallback(getCurrentPriorityLevel(), this.flush);
  }

  /**
   * Flush all pending callbacks, draining the queue until empty.
   * The drain loop ensures derived state listeners (added during flush)
   * are also processed in the same pass.
   */
  private flush = (): void => {
    this.callbackId = null;
    if (this.isFlushing) {
      return;
    }
    this.isFlushing = true;
    try {
      while (this.pending.size > 0) {
        const batch = [...this.pending];
        this.pending.clear();
        for (const callback of batch) {
          callback();
        }
      }
    } finally {
      this.isFlushing = false;
    }
  };

  /**
   * Immediately flush all pending work. For use in tests only.
   */
  flushNowForTests(): void {
    if (this.callbackId !== null) {
      cancelCallback(this.callbackId as never);
      this.callbackId = null;
    }
    this.flush();
  }
}

export const scheduler = new GlobalScheduler();
