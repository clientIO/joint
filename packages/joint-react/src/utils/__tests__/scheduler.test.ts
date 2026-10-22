import { createScheduler } from '../scheduler';

/** Flush microtasks by awaiting a resolved promise + setTimeout. */
async function flushScheduler(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
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
    await flushScheduler();
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
  // Regression: a callback that threw left the scheduler "flushing" forever, so
  // every later callback, for every graph on the page, was silently dropped.
  describe('a callback that throws', () => {
    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not stop the other callbacks of the flush, nor later flushes', async () => {
      const scheduler = createScheduler();
      const calls: string[] = [];
      scheduler(() => {
        throw new Error('boom');
      });
      scheduler(() => calls.push('same flush'));
      await Promise.resolve();
      expect(calls).toEqual(['same flush']);

      scheduler(() => calls.push('later flush'));
      await Promise.resolve();
      expect(calls).toEqual(['same flush', 'later flush']);
    });

    it('still surfaces the error, on a later task', async () => {
      const scheduler = createScheduler();
      scheduler(() => {
        throw new Error('boom');
      });
      await Promise.resolve();

      expect(() => jest.runOnlyPendingTimers()).toThrow('boom');
    });
  });

  // Regression: callbacks that keep scheduling more work were drained in one
  // endless microtask, which freezes the page. The flush now yields.
  describe('callbacks that keep scheduling each other', () => {
    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('yields to the event loop and reports it, and carries on afterwards', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      const scheduler = createScheduler();
      let runs = 0;
      const reschedule = () => {
        runs += 1;
        if (runs < 1000) scheduler(reschedule);
      };
      scheduler(reschedule);
      await Promise.resolve();

      // One flush did a bounded amount of work, then handed control back.
      expect(runs).toBeGreaterThan(1);
      expect(runs).toBeLessThan(1000);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('keeps scheduling'));

      // The rest is drained over later tasks, not lost.
      for (let task = 0; task < 100 && runs < 1000; task += 1) {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      }
      expect(runs).toBe(1000);
      error.mockRestore();
    });
  });
});
