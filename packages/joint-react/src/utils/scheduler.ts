// eslint-disable-next-line camelcase
import { unstable_getCurrentPriorityLevel, unstable_scheduleCallback } from 'scheduler';
/**
 * Creates a debounced function that uses React's internal scheduler for timing.
 * Multiple calls within the same synchronous execution cycle are batched into a single
 * execution in the next available event loop tick. All callbacks stored by id will be
 * executed when the scheduled work flushes.
 * @param userCallback The function to be debounced and scheduled.
 * @param priorityLevel The priority level to run the task at.
 * @returns A function you call to schedule your work with an optional callback and id.
 */
export function createScheduler(userCallback: () => void, priorityLevel?: number) {
  let callbackId: unknown | null = null;
  const callbacks = new Map<string, (id: string) => void>();

  const effectivePriority =
    priorityLevel === undefined ? unstable_getCurrentPriorityLevel() : priorityLevel;

  /**
   * The actual function that processes the batched callbacks.
   * This runs asynchronously via the scheduler.
   */
  const flushScheduledWork = () => {
    callbackId = null;

    // Collect all ids before clearing

    // Execute all stored callbacks with their respective ids
    for (const [id, callback] of callbacks) {
      callback(id);
    }

    // Execute the main callback for each id after stored callbacks
    userCallback();

    // Clear all stored callbacks after execution
    callbacks.clear();
  };

  /**
   * This is the function the user calls to schedule a task.
   * It stores the callback with its id and ensures the flush function is scheduled once.
   * @param id Optional id string to pass to the callback.
   * @param callback Optional callback function that receives an id parameter.
   */
  return (id?: string, callback?: (id: string) => void) => {
    if (id !== undefined && callback !== undefined) {
      // Store callback in map with id as key
      callbacks.set(id, callback);
    }

    if (callbackId === null) {
      // Schedule the flush function if it hasn't been scheduled already
      callbackId = unstable_scheduleCallback(effectivePriority, flushScheduledWork);
    }
  };
}
