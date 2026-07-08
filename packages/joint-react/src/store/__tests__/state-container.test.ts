/* eslint-disable unicorn/consistent-function-scoping */
import { createAtom, createContainer, type Container } from '../state-container';

describe('createContainer', () => {
  type Item = { readonly id: string; x: number; y: number; type: string };
  const setup = () => createContainer<Item>();

  // The container is now updated with a single batched change set. These helpers
  // express the three primitive operations the old `set`/`delete` API covered so
  // each test still reads as add / update / remove.
  const add = (container: Container<Item>, ...items: Item[]) =>
    container.batchSet({
      added: new Map(items.map((item) => [item.id, item])),
      changed: new Map(),
      removed: new Set(),
    });
  const update = (container: Container<Item>, ...items: Item[]) =>
    container.batchSet({
      added: new Map(),
      changed: new Map(items.map((item) => [item.id, item])),
      removed: new Set(),
    });
  const remove = (container: Container<Item>, ...ids: string[]) =>
    container.batchSet({ added: new Map(), changed: new Map(), removed: new Set(ids) });

  describe('get / add / delete / size / has', () => {
    it('returns undefined for missing id', () => {
      const container = setup();
      expect(container.get('a')).toBeUndefined();
      expect(container.has('a')).toBe(false);
    });

    it('adds and retrieves a value', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      expect(container.get('a')).toEqual({ id: 'a', x: 1, y: 2, type: 'item' });
      expect(container.has('a')).toBe(true);
    });

    it('updates an existing value in place (same index, new snapshot ref)', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const before = container.getSnapshot();

      update(container, { id: 'a', x: 10, y: 20, type: 'item' });
      expect(container.get('a')).toEqual({ id: 'a', x: 10, y: 20, type: 'item' });
      // Immutable snapshot: the reference changes on every commit ...
      expect(container.getSnapshot()).not.toBe(before);
      // ... and the previous snapshot is left untouched.
      expect(before).toEqual([{ id: 'a', x: 1, y: 2, type: 'item' }]);
    });

    it('empty change set is a no-op (same snapshot ref, no notify)', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const before = container.getSnapshot();
      const listener = jest.fn();
      container.subscribeById('a', listener);

      container.batchSet({ added: new Map(), changed: new Map(), removed: new Set() });
      expect(container.getSnapshot()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });

    it('deletes an existing value', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' },
        { id: 'c', x: 5, y: 6, type: 'item' }
      );

      remove(container, 'a');
      expect(container.get('a')).toBeUndefined();
      expect(container.has('a')).toBe(false);
      expect(container.getSnapshot().length).toBe(2);
      const ids = container
        .getSnapshot()
        .map((item) => item.id)
        .toSorted((a, b) => String(a).localeCompare(String(b)));
      expect(ids).toEqual(['b', 'c']);
    });

    it('delete preserves the order of the remaining items', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      remove(container, 'b');
      expect(container.getSnapshot().map((item) => item.id)).toEqual(['a']);
    });

    it('tracks size correctly through add and delete', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      expect(container.getSnapshot().length).toBe(2);

      remove(container, 'a');
      expect(container.getSnapshot().length).toBe(1);
    });
  });

  describe('replace-all (remove + add in one batch)', () => {
    it('replaces all items', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );

      container.batchSet({
        added: new Map([
          ['x', { id: 'x', x: 10, y: 20, type: 'item' }],
          ['y', { id: 'y', x: 30, y: 40, type: 'item' }],
        ]),
        changed: new Map(),
        removed: new Set(['a', 'b']),
      });

      expect(container.has('a')).toBe(false);
      expect(container.has('b')).toBe(false);
      expect(container.get('x')?.x).toBe(10);
      expect(container.get('y')?.y).toBe(40);
      expect(container.getSnapshot().length).toBe(2);
    });

    it('removing every item clears the container', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      remove(container, 'a');
      expect(container.getSnapshot().length).toBe(0);
    });
  });

  describe('batchSet notifications', () => {
    it('notifies listeners for changed ids', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listener = jest.fn();
      container.subscribeById('a', listener);

      update(container, { id: 'a', x: 10, y: 20, type: 'item' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies listeners on delete', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listener = jest.fn();
      container.subscribeById('a', listener);

      remove(container, 'a');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify listeners for unrelated ids', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listenerA = jest.fn();
      container.subscribeById('a', listenerA);

      add(container, { id: 'b', x: 3, y: 4, type: 'item' });
      expect(listenerA).not.toHaveBeenCalled();
    });

    it('fires a changed id listener exactly once per batch', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listener = jest.fn();
      container.subscribeById('a', listener);

      update(container, { id: 'a', x: 100, y: 200, type: 'item' });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(container.get('a')).toEqual({ id: 'a', x: 100, y: 200, type: 'item' });
    });

    it('notifies synchronously (no scheduler)', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listener = jest.fn();
      container.subscribeById('a', listener);

      update(container, { id: 'a', x: 10, y: 20, type: 'item' });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeById', () => {
    it('returns an unsubscribe function', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listener = jest.fn();
      const unsubscribe = container.subscribeById('a', listener);

      update(container, { id: 'a', x: 10, y: 20, type: 'item' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      update(container, { id: 'a', x: 100, y: 200, type: 'item' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple listeners for the same id', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      container.subscribeById('a', listener1);
      container.subscribeById('a', listener2);

      update(container, { id: 'a', x: 10, y: 20, type: 'item' });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('cleans up listener set when last listener unsubscribes', () => {
      const container = setup();
      const listener = jest.fn();
      const unsubscribe = container.subscribeById('a', listener);
      unsubscribe();

      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe (every commit)', () => {
    it('fires once per batch regardless of how many ids changed', () => {
      const container = setup();
      const all = jest.fn();
      container.subscribe(all);

      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      expect(all).toHaveBeenCalledTimes(1);
    });

    it('fires on data-only updates too (the snapshot reference changed)', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const all = jest.fn();
      container.subscribe(all);

      update(container, { id: 'a', x: 9, y: 9, type: 'item' });
      expect(all).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function', () => {
      const container = setup();
      const all = jest.fn();
      const unsubscribe = container.subscribe(all);

      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      expect(all).toHaveBeenCalledTimes(1);

      unsubscribe();
      add(container, { id: 'b', x: 3, y: 4, type: 'item' });
      expect(all).toHaveBeenCalledTimes(1);
    });
  });

  describe('immutable snapshot', () => {
    it('produces a new reference on a data-only update, leaving the old one intact', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      const ref1 = container.getSnapshot();

      update(container, { id: 'a', x: 999, y: 999, type: 'item' });
      expect(container.getSnapshot()).not.toBe(ref1);
      // The previous snapshot is never mutated in place.
      expect(ref1.find((item) => item.id === 'a')).toEqual({ id: 'a', x: 1, y: 2, type: 'item' });
    });

    it('produces a new reference on delete, leaving the old one intact', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      const ref1 = container.getSnapshot();

      remove(container, 'a');
      expect(container.getSnapshot()).not.toBe(ref1);
      expect(ref1.length).toBe(2); // old snapshot still holds both
    });
  });

  describe('lazy snapshot & id list — memoisation + multi-consumer consistency', () => {
    it('getSnapshot returns the SAME reference to concurrent readers within a commit', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      // Two independent readers after one commit see the identical array (built
      // once, memoised), so React cannot tear across subscribers.
      const readerA = container.getSnapshot();
      const readerB = container.getSnapshot();
      expect(readerA).toBe(readerB);
    });

    it('getSnapshot is stable between commits and a fresh reference after one', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const first = container.getSnapshot();
      expect(container.getSnapshot()).toBe(first); // no commit → same reference
      update(container, { id: 'a', x: 9, y: 9, type: 'item' });
      expect(container.getSnapshot()).not.toBe(first); // commit → new reference
    });

    it('a held snapshot is never mutated by later commits', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const held = container.getSnapshot();
      update(container, { id: 'a', x: 100, y: 100, type: 'item' });
      remove(container, 'a');
      expect(held).toEqual([{ id: 'a', x: 1, y: 2, type: 'item' }]);
    });

    it('getSize is correct and O(1) (does not depend on materialising the snapshot)', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      expect(container.getSize()).toBe(2);
      remove(container, 'a');
      expect(container.getSize()).toBe(1);
    });

    it('getIds stays the SAME reference across data-only commits (the key to O(1) drags)', () => {
      const container = setup();
      add(
        container,
        { id: 'a', x: 1, y: 2, type: 'item' },
        { id: 'b', x: 3, y: 4, type: 'item' }
      );
      const ids = container.getIds();
      expect(ids).toEqual(['a', 'b']);
      update(container, { id: 'a', x: 9, y: 9, type: 'item' }); // data-only
      expect(container.getIds()).toBe(ids); // unchanged reference → no id-list work
    });

    it('getIds returns a new reference when the id set changes', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const ids = container.getIds();
      add(container, { id: 'b', x: 3, y: 4, type: 'item' }); // structural
      expect(container.getIds()).not.toBe(ids);
      expect(container.getIds()).toEqual(['a', 'b']);
    });

    it('getIds invalidates when a NEW id arrives via the changed bucket', () => {
      const container = setup();
      add(container, { id: 'a', x: 1, y: 2, type: 'item' });
      const idsBefore = container.getIds();
      // A producer may route a genuinely-new cell through `changed` (e.g. a link
      // swept in by a moved element lands in `changed`, not `added`). getIds()
      // and getSnapshot() must not tear — both must include the new id.
      container.batchSet({
        added: new Map(),
        changed: new Map([['b', { id: 'b', x: 3, y: 4, type: 'item' }]]),
        removed: new Set(),
      });
      expect(container.has('b')).toBe(true);
      expect(container.getSnapshot().map((item) => item.id)).toContain('b');
      expect(container.getIds()).not.toBe(idsBefore);
      expect(container.getIds()).toEqual(['a', 'b']);
    });
  });

  describe('stress — 10k random ops keep the snapshot and backing map in sync', () => {
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
          const value: Item = { id, x: counter++, y: counter, type: 'item' };
          // A single-item `changed` set covers both insert and update: patchSlot
          // appends an unknown id and overwrites a known one.
          container.batchSet({ added: new Map(), changed: new Map([[id, value]]), removed: new Set() });
          oracle.set(id, value);
        } else {
          container.batchSet({ added: new Map(), changed: new Map(), removed: new Set([id]) });
          oracle.delete(id);
        }
      }
      expect(container.getSnapshot().length).toBe(oracle.size);
      for (const [id, value] of oracle) expect(container.get(id)).toEqual(value);
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
