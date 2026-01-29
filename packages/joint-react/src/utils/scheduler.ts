import {
  unstable_getCurrentPriorityLevel as getCurrentPriorityLevel,
  unstable_scheduleCallback as scheduleCallback,
} from 'scheduler';

/**
 * Options for creating a graph updates scheduler.
 */
export interface GraphUpdatesSchedulerOptions<Data extends object> {
  /**
   * Callback invoked when scheduled updates are flushed.
   * Receives all accumulated data since the last flush.
   */
  readonly onFlush: (data: Data) => void;

  /**
   * Optional React scheduler priority level.
   * If not specified, uses the current priority level.
   */
  readonly priorityLevel?: number;
}

/**
 * Scheduler that batches data updates and flushes them together.
 * Uses React's internal scheduler for timing, batching multiple calls
 * within the same synchronous execution cycle into a single flush.
 * Data starts as empty object `{}` and resets after each flush.
 * @example
 * ```ts
 * interface MyData {
 *   elementsToUpdate?: Map<string, { id: string; label: string }>;
 *   elementsToDelete?: Map<string, true>;
 * }
 *
 * const scheduler = new Scheduler<MyData>({
 *   onFlush: (data) => {
 *     console.log(data.elementsToUpdate, data.elementsToDelete);
 *   },
 * });
 *
 * // Multiple calls are batched
 * const updateMap = new Map([['el1', { id: 'el1', label: 'Element 1' }]]);
 * scheduler.scheduleData((prev) => ({ ...prev, elementsToUpdate: updateMap }));
 * const deleteMap = new Map([['el2', true as const]]);
 * scheduler.scheduleData((prev) => ({ ...prev, elementsToDelete: deleteMap }));
 * // onFlush called once with combined result
 * ```
 */
export class Scheduler<Data extends object> {
  private readonly onFlush: (data: Data) => void;
  private readonly effectivePriority: number;
  private callbackId: unknown | null = null;
  private currentData: Data = {} as Data;

  constructor(options: GraphUpdatesSchedulerOptions<Data>) {
    const { onFlush, priorityLevel } = options;
    this.onFlush = onFlush;
    this.effectivePriority =
      priorityLevel === undefined ? getCurrentPriorityLevel() : priorityLevel;
  }

  /**
   * Schedule a data update using an updater function.
   * Multiple calls are batched and flushed together.
   * @param updater Function that receives previous data and returns updated data.
   */
  scheduleData = (updater: (previousData: Data) => Data): void => {
    this.currentData = updater(this.currentData);

    if (this.callbackId === null) {
      this.callbackId = scheduleCallback(this.effectivePriority, this.flushScheduledWork);
    }
  };

  private flushScheduledWork = (): void => {
    this.callbackId = null;

    const dataToFlush = this.currentData;
    this.currentData = {} as Data;

    this.onFlush(dataToFlush);
  };
}

/**
 * Creates a simple scheduler function that batches multiple calls into a single flush.
 * @param callback The callback to invoke on flush
 * @returns A function to schedule updates
 */
export function createScheduler(callback: () => void): () => void {
  const scheduler = new Scheduler<Record<string, never>>({
    onFlush: callback,
  });
  return () => scheduler.scheduleData((previous) => previous);
}
