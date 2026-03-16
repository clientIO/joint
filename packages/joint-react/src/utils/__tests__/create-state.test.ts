/* eslint-disable sonarjs/no-nested-functions */
import { sendToDevTool } from '../dev-tools';
import { createState } from '../create-state';

jest.mock('../dev-tools', () => ({
  sendToDevTool: jest.fn(),
}));

const sendToDevToolMock = sendToDevTool as jest.MockedFunction<typeof sendToDevTool>;

/** Flush the React scheduler by awaiting a macrotask. */
async function flushScheduler(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/** Helper: setState + flush scheduler so subscribers are notified in tests. */
async function setAndFlush<T>(state: { setState: (v: T) => void }, value: T): Promise<void> {
  state.setState(value);
  await flushScheduler();
}

describe('createState', () => {
  beforeEach(() => {
    sendToDevToolMock.mockClear();
  });

  describe('basic state management', () => {
    it('should create state with initial value', () => {
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      expect(state.getSnapshot()).toEqual({ count: 0 });
    });

    it('should update state with direct value', () => {
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.setState({ count: 5 });
      expect(state.getSnapshot()).toEqual({ count: 5 });
    });

    it('should update state with updater function', () => {
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.setState((previous) => ({ ...previous, count: previous.count + 1 }));
      expect(state.getSnapshot()).toEqual({ count: 1 });
    });

    it('should handle many updates', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      for (let index = 0; index < 1000; index++) {
        state.setState((previous) => ({ ...previous, count: previous.count + 1 }));
      }
      await flushScheduler();
      expect(state.getSnapshot().count).toBe(1000);
      // Scheduler batches, so subscriber may be called fewer times than 1000
      expect(subscriber).toHaveBeenCalled();
    });
  });

  describe('subscribers', () => {
    it('should notify subscribers on state change', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should notify multiple subscribers', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const subscriber3 = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber1);
      state.subscribe(subscriber2);
      state.subscribe(subscriber3);
      await setAndFlush(state, { count: 1 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber3).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      const unsubscribe1 = state.subscribe(subscriber1);
      state.subscribe(subscriber2);
      await setAndFlush(state, { count: 1 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      unsubscribe1();
      await setAndFlush(state, { count: 2 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(2);
    });

    it('should not notify subscribers if state has not changed', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      const sameObject = { count: 1 };
      await setAndFlush(state, sameObject);
      expect(subscriber).toHaveBeenCalledTimes(1);
      await setAndFlush(state, sameObject);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should notify subscribers when state changes', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(state.getSnapshot().count).toBe(1);
    });
  });

  describe('equality checks', () => {
    it('should use default equality (reference equality)', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      const value = { count: 1 };
      // First setState with different reference should notify
      await setAndFlush(state, value);
      expect(subscriber).toHaveBeenCalledTimes(1);
      // Same reference should not notify
      await setAndFlush(state, value);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should use custom equality function', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0, name: 'test' }),
        isEqual: (a, b) => a.count === b.count,
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 0, name: 'changed' });
      expect(subscriber).not.toHaveBeenCalled();
      await setAndFlush(state, { count: 1, name: 'test' });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should not notify when custom equality returns true', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
        isEqual: () => true,
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 100 });
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('state updates', () => {
    it('should update state with updater function', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState((previous) => ({ ...previous, count: previous.count + 1 }));
      await flushScheduler();
      expect(state.getSnapshot().count).toBe(1);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple state updates', () => {
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0, previous: 0 }),
      });
      state.setState({ count: 5, previous: 0 });
      const snapshot = state.getSnapshot();
      expect(snapshot.count).toBe(5);
      expect(snapshot.previous).toBe(0);
    });
  });

  describe('selectors', () => {
    it('should create selector that tracks selected state', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0, name: 'test' }),
      });
      const selectorState = state.select(
        'count',
        (s) => s.count,
        (a, b) => a === b
      );
      selectorState.subscribe(subscriber);
      expect(selectorState.getSnapshot()).toBe(0);
      await setAndFlush(state, { count: 5, name: 'test' });
      // Derived state also needs flushing
      await flushScheduler();
      expect(selectorState.getSnapshot()).toBe(5);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should not notify selector if selected value has not changed', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0, name: 'test' }),
      });
      const selectorState = state.select(
        'count',
        (s) => s.count,
        (a, b) => a === b
      );
      selectorState.subscribe(subscriber);
      await setAndFlush(state, { count: 0, name: 'changed' });
      await flushScheduler();
      expect(subscriber).not.toHaveBeenCalled();
      await setAndFlush(state, { count: 1, name: 'test' });
      await flushScheduler();
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should use custom equality for selector', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ user: { id: 1, name: 'Alice' } }),
      });
      const selectorState = state.select(
        'user',
        (s) => s.user,
        (a, b) => a.id === b.id
      );
      selectorState.subscribe(subscriber);
      await setAndFlush(state, { user: { id: 1, name: 'Bob' } });
      await flushScheduler();
      expect(subscriber).not.toHaveBeenCalled();
      await setAndFlush(state, { user: { id: 2, name: 'Alice' } });
      await flushScheduler();
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple selectors on same state', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0, name: 'test' }),
      });
      const countSelector = state.select(
        'count',
        (s) => s.count,
        (a, b) => a === b
      );
      const nameSelector = state.select(
        'name',
        (s) => s.name,
        (a, b) => a === b
      );
      countSelector.subscribe(subscriber1);
      nameSelector.subscribe(subscriber2);
      await setAndFlush(state, { count: 5, name: 'test' });
      await flushScheduler();
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).not.toHaveBeenCalled();
      await setAndFlush(state, { count: 5, name: 'changed' });
      await flushScheduler();
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing from selector', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      const selectorState = state.select(
        'count',
        (s) => s.count,
        (a, b) => a === b
      );
      const unsubscribe = selectorState.subscribe(subscriber);
      await setAndFlush(state, { count: 5 });
      await flushScheduler();
      expect(selectorState.getSnapshot()).toBe(5);
      expect(subscriber).toHaveBeenCalledTimes(1);
      unsubscribe();
      await setAndFlush(state, { count: 10 });
      await flushScheduler();
      expect(selectorState.getSnapshot()).toBe(10);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle nested selectors', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ user: { profile: { name: 'Alice' } } }),
      });
      const userSelector = state.select(
        'user',
        (s) => s.user,
        (a, b) => a === b
      );
      const nameSelector = userSelector.select(
        'name',
        (u: { profile: { name: string } }) => u.profile.name,
        (a, b) => a === b
      );
      nameSelector.subscribe(subscriber);
      await setAndFlush(state, { user: { profile: { name: 'Bob' } } });
      await flushScheduler();
      await flushScheduler();
      expect(nameSelector.getSnapshot()).toBe('Bob');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset and clean', () => {
    it('should reset state to initial value', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 10 });
      expect(state.getSnapshot().count).toBe(10);
      state.clean();
      expect(state.getSnapshot().count).toBe(0);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should clean state and clear subscribers', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber1);
      state.subscribe(subscriber2);
      await setAndFlush(state, { count: 5 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      state.clean();
      expect(state.getSnapshot().count).toBe(0);
      await setAndFlush(state, { count: 10 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(state.getSnapshot().count).toBe(10);
    });
  });

  describe('getAreComponentsNotified', () => {
    it('should return false initially', () => {
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      expect(state.getAreComponentsNotified()).toBe(false);
    });

    it('should return true after notifying subscribers', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 1 });
      expect(state.getAreComponentsNotified()).toBe(true);
    });

    it('should return true after state update and notification', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 1 });
      expect(state.getAreComponentsNotified()).toBe(true);
    });

    it('should return false when state does not change', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      const sameObject = { count: 1 };
      await setAndFlush(state, sameObject);
      expect(state.getAreComponentsNotified()).toBe(true);
      await setAndFlush(state, sameObject);
      expect(state.getAreComponentsNotified()).toBe(false);
    });

    it('should reset to false on new state update', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, { count: 1 });
      expect(state.getAreComponentsNotified()).toBe(true);
      await setAndFlush(state, { count: 2 });
      expect(state.getAreComponentsNotified()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle primitive state values', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => 0,
      });
      state.subscribe(subscriber);
      await setAndFlush(state, 5);
      expect(state.getSnapshot()).toBe(5);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle array state values', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => [1, 2, 3],
      });
      state.subscribe(subscriber);
      await setAndFlush(state, [4, 5, 6]);
      expect(state.getSnapshot()).toEqual([4, 5, 6]);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle null and undefined states', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => null as null | string,
      });
      state.subscribe(subscriber);
      await setAndFlush(state, 'test');
      expect(state.getSnapshot()).toBe('test');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle complex nested objects', async () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({
          users: [{ id: 1, name: 'Alice' }],
          metadata: { version: 1 },
        }),
      });
      state.subscribe(subscriber);
      await setAndFlush(state, {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        metadata: { version: 2 },
      });
      const snapshot = state.getSnapshot();
      expect(snapshot.users).toHaveLength(2);
      expect(snapshot.metadata.version).toBe(2);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('dev tools integration', () => {
    it('should not send updates when dev tools integration is disabled', async () => {
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
        isDevToolEnabled: false,
      });

      await setAndFlush(state, { count: 1 });

      expect(sendToDevToolMock).not.toHaveBeenCalled();
    });

    it('should avoid circular serialization crashes when dev tools integration is disabled', async () => {
      sendToDevToolMock.mockImplementation(({ value }) => {
        JSON.stringify(value);
      });

      const state = createState<{ readonly payload?: unknown }>({
        name: 'test',
        newState: () => ({}),
        isDevToolEnabled: false,
      });

      const payload: { self?: unknown } = {};
      payload.self = payload;

      state.setState({ payload });
      await flushScheduler();
      expect(sendToDevToolMock).not.toHaveBeenCalled();
    });
  });
});
