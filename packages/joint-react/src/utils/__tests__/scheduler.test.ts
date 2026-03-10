import { scheduler } from '../scheduler';

describe('GlobalScheduler', () => {
  it('batches multiple schedule calls into a single flush', () => {
    const calls: string[] = [];
    scheduler.schedule(() => calls.push('a'));
    scheduler.schedule(() => calls.push('b'));
    scheduler.schedule(() => calls.push('c'));

    expect(calls).toEqual([]);
    scheduler.flushNowForTests();
    expect(calls).toEqual(['a', 'b', 'c']);
  });

  it('deduplicates the same callback reference', () => {
    let count = 0;
    const callback = () => {
      count += 1;
    };

    scheduler.schedule(callback);
    scheduler.schedule(callback);
    scheduler.schedule(callback);

    scheduler.flushNowForTests();
    expect(count).toBe(1);
  });

  it('drains callbacks added during flush', () => {
    const calls: number[] = [];

    scheduler.schedule(() => {
      calls.push(1);
      // Schedule more work during flush — should be drained in the same pass
      scheduler.schedule(() => calls.push(2));
      scheduler.schedule(() => calls.push(3));
    });

    scheduler.flushNowForTests();
    expect(calls).toEqual([1, 2, 3]);
  });

  it('handles nested drain loops (derived state pattern)', () => {
    const calls: string[] = [];
    const pushDerived2 = () => calls.push('derived-2');
    const pushDerived1 = () => {
      calls.push('derived-1');
      scheduler.schedule(pushDerived2);
    };

    scheduler.schedule(() => {
      calls.push('source');
      scheduler.schedule(pushDerived1);
    });

    scheduler.flushNowForTests();
    expect(calls).toEqual(['source', 'derived-1', 'derived-2']);
  });

  it('is a no-op when flushing with nothing pending', () => {
    expect(() => scheduler.flushNowForTests()).not.toThrow();
  });

  it('recovers from errors thrown during flush', () => {
    const calls: string[] = [];

    scheduler.schedule(() => {
      throw new Error('boom');
    });
    scheduler.schedule(() => calls.push('after-error'));

    expect(() => scheduler.flushNowForTests()).toThrow('boom');

    // Scheduler should be usable again after error
    scheduler.schedule(() => calls.push('recovered'));
    scheduler.flushNowForTests();
    expect(calls).toEqual(['recovered']);
  });

  it('does not re-enter flush if already flushing', () => {
    const calls: string[] = [];

    scheduler.schedule(() => {
      calls.push('outer');
      // flushNowForTests during an active flush should be a no-op
      // because isFlushing is true, but it cancels + calls flush which returns early
      scheduler.flushNowForTests();
      calls.push('outer-done');
    });

    scheduler.flushNowForTests();
    expect(calls).toEqual(['outer', 'outer-done']);
  });

  it('processes independent batches separately', () => {
    const calls: string[] = [];

    scheduler.schedule(() => calls.push('batch-1'));
    scheduler.flushNowForTests();

    scheduler.schedule(() => calls.push('batch-2'));
    scheduler.flushNowForTests();

    expect(calls).toEqual(['batch-1', 'batch-2']);
  });
});
