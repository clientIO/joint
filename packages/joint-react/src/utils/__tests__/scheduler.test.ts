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
});
