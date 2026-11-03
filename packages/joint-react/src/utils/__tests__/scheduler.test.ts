import { createScheduler } from '../scheduler';

/** Flush microtasks by awaiting a resolved promise + setTimeout. */
async function flushScheduler(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/** Lets the scheduler's queued microtask flush run, without any timer. */
function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

describe('createScheduler', () => {
  it('batches multiple schedule calls into a single flush', async () => {
    const scheduler = createScheduler();
    const calls: string[] = [];
    scheduler(() => calls.push('a'));
    scheduler(() => calls.push('b'));
    scheduler(() => calls.push('c'));

    expect(calls).toEqual([]);
    await flushScheduler();
    expect(calls).toEqual(['a', 'b', 'c']);
  });

  it('deduplicates the same callback reference', async () => {
    const scheduler = createScheduler();
    let count = 0;
    const callback = () => {
      count += 1;
    };

    scheduler(callback);
    scheduler(callback);
    scheduler(callback);

    await flushScheduler();
    expect(count).toBe(1);
  });

  it('drains callbacks added during flush', async () => {
    const scheduler = createScheduler();
    const calls: number[] = [];

    scheduler(() => {
      calls.push(1);
      scheduler(() => calls.push(2));
      scheduler(() => calls.push(3));
    });

    await flushScheduler();
    expect(calls).toEqual([1, 2, 3]);
  });

  it('handles nested drain loops (derived state pattern)', async () => {
    const scheduler = createScheduler();
    const calls: string[] = [];
    const pushDerived2 = () => calls.push('derived-2');
    const pushDerived1 = () => {
      calls.push('derived-1');
      scheduler(pushDerived2);
    };

    scheduler(() => {
      calls.push('source');
      scheduler(pushDerived1);
    });

    await flushScheduler();
    expect(calls).toEqual(['source', 'derived-1', 'derived-2']);
  });

  it('is a no-op when nothing is pending', async () => {
    createScheduler();
    // Just ensure no error when nothing is scheduled
    await expect(flushScheduler()).resolves.toBeUndefined();
  });

  it('does not re-enter flush if already flushing', async () => {
    const scheduler = createScheduler();
    const calls: string[] = [];

    scheduler(() => {
      calls.push('outer', 'outer-done');
    });

    await flushScheduler();
    expect(calls).toEqual(['outer', 'outer-done']);
  });

  it('processes independent batches separately', async () => {
    const scheduler = createScheduler();
    const calls: string[] = [];

    scheduler(() => calls.push('batch-1'));
    await flushScheduler();

    scheduler(() => calls.push('batch-2'));
    await flushScheduler();

    expect(calls).toEqual(['batch-1', 'batch-2']);
  });

  // Regression: a throwing callback left the scheduler marked as flushing, so
  // every later callback was queued forever — for every store on the page.
  it('keeps flushing after a callback throws and rethrows the error later', async () => {
    const scheduler = createScheduler();
    const error = new Error('callback failed');
    const calls: string[] = [];
    const deferred: Array<() => void> = [];
    const setTimeoutSpy = jest
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation(((handler: () => void) => {
        deferred.push(handler);
        return 0;
      }) as unknown as typeof setTimeout);

    scheduler(() => {
      throw error;
    });
    scheduler(() => calls.push('same-pass'));
    await flushMicrotasks();
    scheduler(() => calls.push('next-pass'));
    await flushMicrotasks();
    setTimeoutSpy.mockRestore();

    expect(calls).toEqual(['same-pass', 'next-pass']);
    expect(deferred).toHaveLength(1);
    expect(deferred[0]).toThrow(error);
  });
});
