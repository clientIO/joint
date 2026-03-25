/* eslint-disable sonarjs/no-element-overwrite */
/* eslint-disable unicorn/consistent-function-scoping */
import { createAtom, createContainer, getValue } from '../state-container';

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('getValue', () => {
  it('returns the value directly when not a function', () => {
    expect(getValue('old', 'new')).toBe('new');
  });

  it('calls the updater function with previous value', () => {
    expect(getValue(1, (previous) => (previous ?? 0) + 10)).toBe(11);
  });

  it('passes undefined-capable previous to updater', () => {
    const updater = jest.fn((previous: number | undefined) => (previous ?? 0) + 5);
    getValue(3, updater);
    expect(updater).toHaveBeenCalledWith(3);
  });
});

describe('createContainer', () => {
  function setup() {
    return createContainer<{ x: number; y: number }>();
  }

  describe('get / add / delete / getSize', () => {
    it('returns undefined for missing id', () => {
      const container = setup();
      expect(container.get('a')).toBeUndefined();
    });

    it('adds and retrieves a value', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();
      expect(container.get('a')).toEqual({ x: 1, y: 2 });
    });

    it('updates an existing value with a direct value', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      container.set('a', { x: 10, y: 20 });
      container.commitChanges();
      await flush();
      expect(container.get('a')).toEqual({ x: 10, y: 20 });
    });

    it('updates an existing value with an updater function', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      container.set('a', (previous) => ({ x: (previous?.x ?? 0) + 5, y: (previous?.y ?? 0) + 5 }));
      container.commitChanges();
      await flush();
      expect(container.get('a')).toEqual({ x: 6, y: 7 });
    });

    it('ignores add when value is falsy', async () => {
      const container = createContainer<string>();
      container.set('a', '');
      container.commitChanges();
      await flush();
      expect(container.get('a')).toBeUndefined();
      expect(container.getSize()).toBe(0);
    });

    it('ignores add when value is strictly equal to previous', async () => {
      const container = setup();
      const value = { x: 1, y: 2 };
      container.set('a', value);
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', value); // same reference
      container.commitChanges();
      await flush();

      expect(listener).not.toHaveBeenCalled();
    });

    it('deletes an existing value', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      container.delete('a');
      container.commitChanges();
      await flush();

      expect(container.get('a')).toBeUndefined();
      expect(container.getSize()).toBe(0);
    });

    it('delete is a no-op for missing id', async () => {
      const container = setup();
      const sizeListener = jest.fn();
      container.subscribeToSize(sizeListener);

      container.delete('nonexistent');
      container.commitChanges();
      await flush();

      expect(sizeListener).not.toHaveBeenCalled();
    });

    it('tracks size correctly through add and delete', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.set('b', { x: 3, y: 4 });
      container.commitChanges();
      await flush();
      expect(container.getSize()).toBe(2);

      container.delete('a');
      container.commitChanges();
      await flush();
      expect(container.getSize()).toBe(1);
    });
  });

  describe('commitChanges', () => {
    it('does nothing when there are no changes', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.commitChanges(); // no changes queued
      await flush();
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies listeners for changed ids', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { x: 10, y: 20 });
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies listeners on delete', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.delete('a');
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify listeners for unrelated ids', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listenerA = jest.fn();
      container.subscribe('a', listenerA);

      container.set('b', { x: 3, y: 4 });
      container.commitChanges();
      await flush();

      expect(listenerA).not.toHaveBeenCalled();
    });

    it('clears the changes queue after commit', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { x: 10, y: 20 });
      container.commitChanges();
      await flush();

      container.commitChanges(); // second commit should be no-op
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('batches multiple changes into a single commit', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { x: 10, y: 20 });
      container.set('a', { x: 100, y: 200 });
      container.commitChanges();
      await flush();

      // listener called twice — once per queued change for 'a'
      expect(listener).toHaveBeenCalledTimes(2);
      expect(container.get('a')).toEqual({ x: 100, y: 200 });
    });

    it('defers execution via microtask', () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { x: 10, y: 20 });
      container.commitChanges();

      // listener should NOT have been called yet (microtask not flushed)
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      const unsubscribe = container.subscribe('a', listener);

      container.set('a', { x: 10, y: 20 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      container.set('a', { x: 100, y: 200 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });

    it('supports multiple listeners for the same id', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      container.subscribe('a', listener1);
      container.subscribe('a', listener2);

      container.set('a', { x: 10, y: 20 });
      container.commitChanges();
      await flush();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('cleans up listener set when last listener unsubscribes', async () => {
      const container = setup();
      const listener = jest.fn();
      const unsubscribe = container.subscribe('a', listener);
      unsubscribe();

      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToSize', () => {
    it('notifies when size changes after add', async () => {
      const container = setup();
      const listener = jest.fn();
      container.subscribeToSize(listener);

      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies when size changes after delete', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribeToSize(listener);

      container.delete('a');
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify when size stays the same (update)', async () => {
      const container = setup();
      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribeToSize(listener);

      container.set('a', { x: 10, y: 20 }); // update, not add
      container.commitChanges();
      await flush();

      expect(listener).not.toHaveBeenCalled();
    });

    it('returns an unsubscribe function', async () => {
      const container = setup();
      const listener = jest.fn();
      const unsubscribe = container.subscribeToSize(listener);

      container.set('a', { x: 1, y: 2 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      container.set('b', { x: 3, y: 4 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });
  });
});

describe('createAtom', () => {
  it('returns initial value', () => {
    const atom = createAtom(42);
    expect(atom.get()).toBe(42);
  });

  it('sets a direct value', () => {
    const atom = createAtom(0);
    atom.set(10);
    expect(atom.get()).toBe(10);
  });

  it('sets via updater function', () => {
    const atom = createAtom(5);
    atom.set((previous) => (previous ?? 0) + 3);
    expect(atom.get()).toBe(8);
  });

  it('skips update when value is strictly equal', () => {
    const atom = createAtom({ x: 1 });
    const listener = jest.fn();
    atom.subscribe(listener);

    const same = atom.get();
    atom.set(same!);

    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies listeners on change', () => {
    const atom = createAtom('hello');
    const listener = jest.fn();
    atom.subscribe(listener);

    atom.set('world');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies multiple listeners', () => {
    const atom = createAtom(0);
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    atom.subscribe(listener1);
    atom.subscribe(listener2);

    atom.set(1);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops notifications', () => {
    const atom = createAtom(0);
    const listener = jest.fn();
    const unsubscribe = atom.subscribe(listener);

    atom.set(1);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    atom.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies synchronously (no microtask)', () => {
    const atom = createAtom(0);
    const listener = jest.fn();
    atom.subscribe(listener);

    atom.set(1);

    // unlike createContainer, atom notifies immediately
    expect(listener).toHaveBeenCalledTimes(1);
    expect(atom.get()).toBe(1);
  });

  it('works with complex objects', () => {
    const atom = createAtom({ count: 0, measuredCount: 0 });
    const listener = jest.fn();
    atom.subscribe(listener);

    atom.set({ count: 5, measuredCount: 3 });

    expect(atom.get()).toEqual({ count: 5, measuredCount: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('updater receives current value', () => {
    const atom = createAtom({ count: 0, measuredCount: 0 });

    atom.set((previous) => ({
      count: (previous?.count ?? 0) + 1,
      measuredCount: (previous?.measuredCount ?? 0) + 1,
    }));

    expect(atom.get()).toEqual({ count: 1, measuredCount: 1 });
  });
});
