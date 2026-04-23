/* eslint-disable sonarjs/no-element-overwrite */
/* eslint-disable unicorn/consistent-function-scoping */
import { createAtom, createContainer, getValue } from '../state-container';

/** Flush pending microtasks so commitChanges callbacks execute. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('getValue', () => {
  it('returns the value directly when not a function', () => {
    expect(getValue({ id: 'old' }, { id: 'new' })).toEqual({ id: 'new' });
  });

  it('calls the updater function with previous value', () => {
    expect(getValue({ id: 'a', v: 1 }, (previous) => ({ id: 'a', v: (previous?.v ?? 0) + 10 }))).toEqual({
      id: 'a',
      v: 11,
    });
  });

  it('passes undefined-capable previous to updater', () => {
    const updater = jest.fn((previous: { id: string; v: number } | undefined) => ({
      id: 'a',
      v: (previous?.v ?? 0) + 5,
    }));
    getValue({ id: 'a', v: 3 }, updater);
    expect(updater).toHaveBeenCalledWith({ id: 'a', v: 3 });
  });
});

describe('createContainer', () => {
  type Item = { readonly id: string; x: number; y: number };
  function setup() {
    return createContainer<Item>();
  }

  describe('get / add / delete / getSize / has', () => {
    it('returns undefined for missing id', () => {
      const container = setup();
      expect(container.get('a')).toBeUndefined();
      expect(container.has('a')).toBe(false);
    });

    it('adds and retrieves a value', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();
      expect(container.get('a')).toEqual({ id: 'a', x: 1, y: 2 });
      expect(container.has('a')).toBe(true);
    });

    it('updates an existing value with a direct value (slot replace, stable array ref)', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const refBefore = container.getAll();
      container.set('a', { id: 'a', x: 10, y: 20 });
      container.commitChanges();
      await flush();
      expect(container.get('a')).toEqual({ id: 'a', x: 10, y: 20 });
      expect(container.getAll()).toBe(refBefore);
    });

    it('updates an existing value with an updater function', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      container.set('a', (previous) => ({
        id: 'a',
        x: (previous?.x ?? 0) + 5,
        y: (previous?.y ?? 0) + 5,
      }));
      container.commitChanges();
      await flush();
      expect(container.get('a')).toEqual({ id: 'a', x: 6, y: 7 });
    });

    it('ignores set when updater returns undefined', async () => {
      const container = setup();
      container.set('a', (): Item | undefined => {
        return;
      });
      container.commitChanges();
      await flush();
      expect(container.get('a')).toBeUndefined();
      expect(container.getSize()).toBe(0);
    });

    it('ignores set when value is strictly equal to previous', async () => {
      const container = setup();
      const value: Item = { id: 'a', x: 1, y: 2 };
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

    it('deletes an existing value with swap-pop', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.set('c', { id: 'c', x: 5, y: 6 });
      container.commitChanges();
      await flush();

      container.delete('a');
      container.commitChanges();
      await flush();

      expect(container.get('a')).toBeUndefined();
      expect(container.has('a')).toBe(false);
      expect(container.getSize()).toBe(2);
      const ids = container
        .getAll()
        .map((item) => item.id)
        .toSorted((a, b) => String(a).localeCompare(String(b)));
      expect(ids).toEqual(['b', 'c']);
    });

    it('delete of the last item does not swap', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();

      container.delete('b');
      container.commitChanges();
      await flush();
      expect(container.getAll().map((item) => item.id)).toEqual(['a']);
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
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();
      expect(container.getSize()).toBe(2);

      container.delete('a');
      container.commitChanges();
      await flush();
      expect(container.getSize()).toBe(1);
    });
  });

  describe('reset — atomic replace-all', () => {
    it('replaces all items', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();

      container.reset([
        { id: 'x', x: 10, y: 20 },
        { id: 'y', x: 30, y: 40 },
      ]);
      container.commitChanges();
      await flush();

      expect(container.has('a')).toBe(false);
      expect(container.has('b')).toBe(false);
      expect(container.get('x')?.x).toBe(10);
      expect(container.get('y')?.y).toBe(40);
      expect(container.getSize()).toBe(2);
    });

    it('empty reset clears', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      container.reset([]);
      container.commitChanges();
      await flush();
      expect(container.getSize()).toBe(0);
    });

    it('reset bumps version once per call', () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      const v0 = container.getVersion();
      container.reset([
        { id: 'b', x: 2, y: 3 },
        { id: 'c', x: 4, y: 5 },
      ]);
      expect(container.getVersion()).toBe(v0 + 1);
    });
  });

  describe('commitChanges', () => {
    it('does nothing when there are no changes', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
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
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { id: 'a', x: 10, y: 20 });
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies listeners on delete', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
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
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listenerA = jest.fn();
      container.subscribe('a', listenerA);

      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();

      expect(listenerA).not.toHaveBeenCalled();
    });

    it('dedupes dirty ids within one commit (multiple sets → one listener call)', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { id: 'a', x: 10, y: 20 });
      container.set('a', { id: 'a', x: 100, y: 200 });
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(container.get('a')).toEqual({ id: 'a', x: 100, y: 200 });
    });

    it('clears the changes queue after commit', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { id: 'a', x: 10, y: 20 });
      container.commitChanges();
      await flush();

      container.commitChanges(); // second commit should be no-op
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('defers execution via microtask', () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();

      const listener = jest.fn();
      container.subscribe('a', listener);

      container.set('a', { id: 'a', x: 10, y: 20 });
      container.commitChanges();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      const unsubscribe = container.subscribe('a', listener);

      container.set('a', { id: 'a', x: 10, y: 20 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      container.set('a', { id: 'a', x: 100, y: 200 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple listeners for the same id', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      container.subscribe('a', listener1);
      container.subscribe('a', listener2);

      container.set('a', { id: 'a', x: 10, y: 20 });
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

      container.set('a', { id: 'a', x: 1, y: 2 });
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

      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies when size changes after delete', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
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
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();

      const listener = jest.fn();
      container.subscribeToSize(listener);

      container.set('a', { id: 'a', x: 10, y: 20 });
      container.commitChanges();
      await flush();

      expect(listener).not.toHaveBeenCalled();
    });

    it('returns an unsubscribe function', async () => {
      const container = setup();
      const listener = jest.fn();
      const unsubscribe = container.subscribeToSize(listener);

      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToAll', () => {
    it('fires once per commit regardless of dirty count', async () => {
      const container = setup();
      const full = jest.fn();
      container.subscribeToAll(full);

      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();

      expect(full).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function', async () => {
      const container = setup();
      const full = jest.fn();
      const unsubscribe = container.subscribeToAll(full);

      container.set('a', { id: 'a', x: 1, y: 2 });
      container.commitChanges();
      await flush();
      expect(full).toHaveBeenCalledTimes(1);

      unsubscribe();

      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();
      expect(full).toHaveBeenCalledTimes(1);
    });
  });

  describe('reference stability', () => {
    it('getAll returns the same array reference across data-only mutations', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();
      const ref1 = container.getAll();
      container.set('a', { id: 'a', x: 999, y: 999 });
      container.commitChanges();
      await flush();
      expect(container.getAll()).toBe(ref1);
    });

    it('getAll returns the same array reference across swap-pop deletes', async () => {
      const container = setup();
      container.set('a', { id: 'a', x: 1, y: 2 });
      container.set('b', { id: 'b', x: 3, y: 4 });
      container.commitChanges();
      await flush();
      const ref1 = container.getAll();
      container.delete('a');
      container.commitChanges();
      await flush();
      expect(container.getAll()).toBe(ref1);
    });

    it('version is monotonically increasing', () => {
      const container = setup();
      const versions: number[] = [];
      for (let index = 0; index < 50; index++) {
        container.set(`k${index}`, { id: `k${index}`, x: index, y: index });
        versions.push(container.getVersion());
      }
      for (let index = 1; index < versions.length; index++) {
        expect(versions[index]).toBeGreaterThan(versions[index - 1]);
      }
    });
  });

  describe('stress — 10k random ops keep items[] and indexById in sync', () => {
    it('invariants hold', () => {
      const container = setup();
      const oracle = new Map<string, Item>();
      let counter = 0;
      // Deterministic pseudo-random sequence — no crypto required for a stress invariant test.
      let seed = 1;
      const rand = (): number => {
        seed = (seed * 9301 + 49_297) % 233_280;
        return seed / 233_280;
      };
      for (let index = 0; index < 10_000; index++) {
        const op = rand();
        const id = `k${Math.floor(rand() * 500)}`;
        if (op < 0.7) {
          const v: Item = { id, x: counter++, y: counter };
          container.set(id, v);
          oracle.set(id, v);
        } else {
          container.delete(id);
          oracle.delete(id);
        }
      }
      expect(container.getSize()).toBe(oracle.size);
      for (const [id, v] of oracle) expect(container.get(id)).toEqual(v);
    });
  });
});

describe('createAtom', () => {
  const flushAtom = () => new Promise<void>((resolve) => queueMicrotask(resolve));

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

  it('notifies listeners on change', async () => {
    const atom = createAtom('hello');
    const listener = jest.fn();
    atom.subscribe(listener);

    atom.set('world');
    await flushAtom();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies multiple listeners', async () => {
    const atom = createAtom(0);
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    atom.subscribe(listener1);
    atom.subscribe(listener2);

    atom.set(1);
    await flushAtom();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops notifications', async () => {
    const atom = createAtom(0);
    const listener = jest.fn();
    const unsubscribe = atom.subscribe(listener);

    atom.set(1);
    await flushAtom();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    atom.set(2);
    await flushAtom();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies via microtask scheduler', async () => {
    const atom = createAtom(0);
    const listener = jest.fn();
    atom.subscribe(listener);

    atom.set(1);

    expect(atom.get()).toBe(1);
    expect(listener).not.toHaveBeenCalled();

    await flushAtom();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('works with complex objects', async () => {
    const atom = createAtom({ count: 0, measuredCount: 0 });
    const listener = jest.fn();
    atom.subscribe(listener);

    atom.set({ count: 5, measuredCount: 3 });
    await flushAtom();

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
