import { createScheduler } from '../scheduler';

/** Flush microtasks by awaiting a resolved promise + setTimeout. */
async function flushScheduler(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/** Lets the scheduler's queued microtasks run, without any timer. */
async function flushMicrotasks(): Promise<void> {
  for (let tick = 0; tick < 5; tick++) {
    await Promise.resolve();
  }
}

describe('createScheduler', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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
  describe('when a callback throws', () => {
    const errors: unknown[] = [];
    const captureError = (event: ErrorEvent) => {
      errors.push(event.error);
      event.preventDefault();
    };

    beforeEach(() => {
      errors.length = 0;
      globalThis.addEventListener('error', captureError);
    });

    afterEach(() => {
      globalThis.removeEventListener('error', captureError);
    });

    it('reports the error and keeps flushing, without a timer', async () => {
      const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
      const scheduler = createScheduler();
      const error = new Error('callback failed');
      const calls: string[] = [];

      scheduler(() => {
        throw error;
      });
      scheduler(() => calls.push('same-pass'));
      await flushMicrotasks();
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      setTimeoutSpy.mockRestore();
      await flushScheduler();
      scheduler(() => calls.push('next-pass'));
      await flushScheduler();

      expect(calls).toEqual(['same-pass', 'next-pass']);
      expect(errors).toEqual([error]);
    });

    it('runs a callback queued by the failing callback', async () => {
      const scheduler = createScheduler();
      const calls: string[] = [];

      scheduler(() => {
        scheduler(() => calls.push('cascaded'));
        throw new Error('callback failed');
      });
      await flushScheduler();

      expect(calls).toEqual(['cascaded']);
      expect(errors).toHaveLength(1);
    });
  });

  it('runs cascading callbacks before any microtask queued after the flush starts', async () => {
    const scheduler = createScheduler();
    const calls: string[] = [];

    scheduler(() => {
      queueMicrotask(() => calls.push('microtask'));
      scheduler(() => calls.push('cascaded'));
    });
    await flushScheduler();

    expect(calls).toEqual(['cascaded', 'microtask']);
  });
});
