import { dia, mvc } from '@joint/core';
import { GraphStore } from '../graph-store';
import { createGraphStateReader, type GraphState } from '../graph-state';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import type { CellRecord } from '../../types/cell.types';

const element = (id: string, x = 0): CellRecord =>
  ({
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y: 0 },
    size: { width: 10, height: 10 },
  }) as CellRecord;

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const selectX = (id: string) => (state: GraphState) => state.getCell(id)?.position?.x;
const selectCount = (state: GraphState) => state.cells.length;
const selectState = (state: GraphState) => state;
const selectMeasured = (state: GraphState) => state.sizingVersion;
const selectIds = (state: GraphState) => state.cells.map((cell) => cell.id);
const selectPicked = (state: GraphState) =>
  state.getCells(['b', 'missing', 'a']).map((cell) => cell.id);
const selectAAndLate = (state: GraphState) => state.getCells(['a', 'late']);
/** Reads the cells only once the diagram is measured. */
const selectCountOnceMeasured = (state: GraphState) =>
  state.sizingVersion > 0 ? state.cells.length : -1;
const selectAndThrow = (state: GraphState) => {
  state.getCell('b');
  throw new Error('selector failed');
};
const selectMemberIds = (collection: mvc.Collection<dia.Cell>) => (state: GraphState) =>
  state.getCells(collection).map((cell) => cell.id);
const selectMembers = (collection: mvc.Collection<dia.Cell>) => (state: GraphState) =>
  state.getCells(collection);
const isSameParity = (a: number, b: number) => a % 2 === b % 2;
const MANY_IDS = Array.from({ length: 50 }, (_, index) => `n${index}`);
const MANY_ELEMENTS = MANY_IDS.map((id) => element(id));
const createStore = () => new GraphStore({ initialCells: [element('a'), element('b', 50)] });
/** Changes the graph and drains the store's microtask commit. */
const commit = async (run: () => void) => {
  run();
  await flush();
};

describe('createGraphStateReader', () => {
  let store: ReturnType<typeof createStore>;
  const getElement = (id: string) => store.graph.getCell(id) as dia.Element;

  beforeEach(() => {
    store = createStore();
  });
  afterEach(() => store.destroy(false));

  describe('read', () => {
    it('selects from all cells, one cell, several cells and the sizing version', async () => {
      await flush();
      const reader = createGraphStateReader<CellRecord, unknown>(store);

      expect(reader.read(selectCount)).toBe(2);
      expect(reader.read(selectX('b'))).toBe(50);
      expect(reader.read(selectX('missing'))).toBeUndefined();
      expect(reader.read(selectPicked)).toEqual(['b', 'a']);
      expect(reader.read(selectMeasured)).toBe(store.measurement.getSizingVersion());
    });

    it('does not run the selector again while what it read is unchanged', async () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      const selector = jest.fn(selectX('a'));

      reader.read(selector);
      reader.read(selector);
      // Another cell changed: this selector read only `a`.
      await commit(() => getElement('b').position(70, 0));
      reader.read(selector);

      expect(selector).toHaveBeenCalledTimes(1);
    });

    // Regression: the render-to-subscribe gap. Staleness is tested against the
    // store, so a change is seen without any subscription delivering it.
    it('sees a change that happened while nothing was subscribed', async () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      const selector = selectX('a');
      expect(reader.read(selector)).toBe(0);

      await commit(() => getElement('a').position(30, 0));

      expect(reader.read(selector)).toBe(30);
    });

    it('runs a new selector function even when the store did not change', () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);

      expect(reader.read(selectX('a'))).toBe(0);
      expect(reader.read(selectX('b'))).toBe(50);
    });

    it('returns the previous reference while the new value is equal', async () => {
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const before = reader.read(selectIds);
      await commit(() => getElement('a').position(30, 0));

      expect(reader.read(selectIds)).toBe(before);
    });

    it('uses a custom equality', async () => {
      const reader = createGraphStateReader<CellRecord, number>(store);
      expect(reader.read(selectCount, isSameParity)).toBe(2);
      await commit(() => store.graph.addCells([element('c'), element('d')]));
      expect(reader.read(selectCount, isSameParity)).toBe(2);
      await commit(() => store.graph.addCell(element('e')));
      expect(reader.read(selectCount, isSameParity)).toBe(5);
    });

    it('recovers after a selector that throws', () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      expect(reader.read(selectX('a'))).toBe(0);

      expect(() => reader.read(selectAndThrow)).toThrow('selector failed');
      expect(reader.read(selectX('a'))).toBe(0);
    });
  });

  // The reader follows what a selector reads while it runs. A state kept and
  // read later would silently never update, so it says so.
  it('warns, and follows nothing, when the state is read outside of a selector', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const reader = createGraphStateReader<CellRecord, GraphState>(store);
    const listener = jest.fn();
    const leaked = reader.read(selectState);
    reader.subscribe(listener);

    expect(leaked.getCell('a')?.id).toBe('a');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside of its selector'));

    await commit(() => getElement('a').position(30, 0));
    expect(listener).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  describe('subscribe', () => {
    it('subscribes only to what the selector read', async () => {
      const { cells } = store.graphProjection;
      const subscribeToAll = jest.spyOn(cells, 'subscribe');
      const subscribeById = jest.spyOn(cells, 'subscribeById');
      const subscribeToMeasurement = jest.spyOn(store.measurement, 'subscribe');
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      const listener = jest.fn();

      reader.read(selectX('a'));
      const unsubscribe = reader.subscribe(listener);

      expect(subscribeById).toHaveBeenCalledTimes(1);
      expect(subscribeById).toHaveBeenCalledWith('a', expect.any(Function));
      expect(subscribeToAll).not.toHaveBeenCalled();
      expect(subscribeToMeasurement).not.toHaveBeenCalled();

      await commit(() => getElement('b').position(70, 0));
      expect(listener).not.toHaveBeenCalled();
      await commit(() => getElement('a').position(30, 0));
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      await commit(() => getElement('a').position(40, 0));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('is not notified of a cell change when the selector reads the sizing version', async () => {
      await flush();
      const reader = createGraphStateReader<CellRecord, number>(store);
      const listener = jest.fn();
      reader.read(selectMeasured);
      reader.subscribe(listener);

      await commit(() => getElement('a').position(30, 0));
      expect(listener).not.toHaveBeenCalled();

      await commit(() => store.graph.addCell(element('c')));
      expect(listener).toHaveBeenCalled();
    });

    // Regression: the render-to-subscribe gap, with the subscription in place
    // by the time of the next read. Nothing notified it of the change.
    it('sees a change that happened between the read and the subscription', async () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      const selector = selectX('a');
      expect(reader.read(selector)).toBe(0);

      await commit(() => getElement('a').position(30, 0));
      reader.subscribe(jest.fn());

      expect(reader.read(selector)).toBe(30);
    });

    it('moves the subscription when the selector reads something else', async () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      const listener = jest.fn();
      reader.read(selectX('a'));
      reader.subscribe(listener);

      reader.sync(selectX('b'));

      await commit(() => getElement('a').position(30, 0));
      expect(listener).not.toHaveBeenCalled();
      await commit(() => getElement('b').position(70, 0));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    // Regression: a read alone moved the subscription. React reads while
    // rendering, and a render it throws away (a transition, a suspended tree)
    // left the committed selector without its notifications.
    it('keeps the subscription where it is on a read that does not sync', async () => {
      const reader = createGraphStateReader<CellRecord, number | undefined>(store);
      const listener = jest.fn();
      const committed = selectX('a');
      reader.read(committed);
      reader.subscribe(() => {
        listener();
        reader.read(committed);
      });

      // What a discarded render does: reads with another selector, and no more.
      reader.read(selectX('b'));

      await commit(() => getElement('a').position(30, 0));
      expect(listener).toHaveBeenCalledTimes(1);
      expect(reader.read(committed)).toBe(30);
    });

    it('follows a selector that reads conditionally', async () => {
      const emptyStore = new GraphStore({});
      const reader = createGraphStateReader<CellRecord, number>(emptyStore);
      const listener = jest.fn();
      const selector = selectCountOnceMeasured;
      expect(reader.read(selector)).toBe(-1);
      reader.subscribe(() => {
        listener();
        reader.read(selector);
      });

      // Measured now: the listener's read picks up the cells as a second source.
      emptyStore.graph.addCells([element('a'), element('b')]);
      await flush();
      expect(reader.read(selector)).toBe(2);
      listener.mockClear();

      emptyStore.graph.getCell('a').set('position', { x: 30, y: 0 });
      await flush();
      expect(listener).toHaveBeenCalled();
      emptyStore.destroy(false);
    });

    // Regression: every notification scanned all the watched cells, so one
    // commit moving k of N watched cells cost k scans of N.
    it('reads each watched cell a constant number of times when all of them change at once', async () => {
      const ids = MANY_IDS;
      store.graph.addCells(MANY_ELEMENTS);
      await flush();
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const selector = jest.fn((state: GraphState) => state.getCells(ids));
      reader.read(selector);
      // What a subscribed hook does: read again on every notification.
      reader.subscribe(() => reader.read(selector));
      selector.mockClear();
      const getCell = jest.spyOn(store.graphProjection.cells, 'get');

      await commit(() => {
        store.graph.startBatch('move');
        for (const id of ids) getElement(id).position(5, 5);
        store.graph.stopBatch('move');
      });

      expect(selector).toHaveBeenCalledTimes(1);
      // One lookup per notification and one per id in the selector run, not ids².
      expect(getCell.mock.calls.length).toBeLessThanOrEqual(ids.length * 3);
    });

    it('is notified when a missing cell it asked for is added', async () => {
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const listener = jest.fn();
      const selector = selectAAndLate;
      expect(reader.read(selector)).toHaveLength(1);
      reader.subscribe(listener);

      await commit(() => store.graph.addCell(element('late')));

      expect(listener).toHaveBeenCalled();
      expect(reader.read(selector)).toHaveLength(2);
    });
  });

  describe('collections', () => {
    it('reads the members of a collection, in its order, and follows membership', () => {
      const collection = new mvc.Collection<dia.Cell>([getElement('b')]);
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const listener = jest.fn();
      const selector = selectMemberIds(collection);
      expect(reader.read(selector)).toEqual(['b']);
      reader.subscribe(listener);

      collection.add(getElement('a'));
      expect(listener).toHaveBeenCalledTimes(1);
      expect(reader.read(selector)).toEqual(['b', 'a']);

      collection.remove(getElement('b'));
      expect(reader.read(selector)).toEqual(['a']);

      collection.reset([]);
      expect(reader.read(selector)).toEqual([]);
    });

    // Regression: membership was tracked by a counter the subscription bumped,
    // so a change before the subscription existed was missed.
    it('sees a membership change that happened while nothing was subscribed', () => {
      const collection = new mvc.Collection<dia.Cell>();
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const selector = selectMemberIds(collection);
      expect(reader.read(selector)).toEqual([]);

      collection.add(getElement('a'));

      expect(reader.read(selector)).toEqual(['a']);
    });

    it('is notified once for several cells added together', () => {
      const collection = new mvc.Collection<dia.Cell>();
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const listener = jest.fn();
      reader.read(selectMemberIds(collection));
      reader.subscribe(listener);

      collection.add([getElement('a'), getElement('b')]);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('reads a member the graph does not hold from the collection, as one stable record', () => {
      const detached = new dia.Element({ id: 'clone', type: ELEMENT_MODEL_TYPE });
      const collection = new mvc.Collection<dia.Cell>([detached]);
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const first = reader.read(selectMembers(collection));
      const second = reader.read(selectMembers(collection));

      expect(first.map((cell) => (cell as CellRecord).id)).toEqual(['clone']);
      expect(second[0]).toBe(first[0]);
    });

    it('stops listening to the collection on unsubscribe', () => {
      const collection = new mvc.Collection<dia.Cell>();
      const reader = createGraphStateReader<CellRecord, readonly unknown[]>(store);
      const listener = jest.fn();
      reader.read(selectMemberIds(collection));
      const unsubscribe = reader.subscribe(listener);

      unsubscribe();
      collection.add(getElement('a'));

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
