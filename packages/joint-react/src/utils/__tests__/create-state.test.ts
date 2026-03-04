/* eslint-disable sonarjs/no-nested-functions */
import { createState, derivedState } from '../create-state';

describe('createState', () => {
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

    it('should handle many updates', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      for (let index = 0; index < 1000; index++) {
        state.setState((previous) => ({ ...previous, count: previous.count + 1 }));
      }
      expect(state.getSnapshot().count).toBe(1000);
      expect(subscriber).toHaveBeenCalledTimes(1000);
    });
  });

  describe('subscribers', () => {
    it('should notify subscribers on state change', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState({ count: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should notify multiple subscribers', () => {
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
      state.setState({ count: 1 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      expect(subscriber3).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      const unsubscribe1 = state.subscribe(subscriber1);
      state.subscribe(subscriber2);
      state.setState({ count: 1 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      unsubscribe1();
      state.setState({ count: 2 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(2);
    });

    it('should not notify subscribers if state has not changed', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      const sameObject = { count: 1 };
      state.setState(sameObject);
      expect(subscriber).toHaveBeenCalledTimes(1);
      state.setState(sameObject);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should notify subscribers when state changes', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState({ count: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(state.getSnapshot().count).toBe(1);
    });
  });

  describe('equality checks', () => {
    it('should use default equality (deep equality with util.isEqual)', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      // First setState with different value should notify
      state.setState({ count: 1 });
      expect(subscriber).toHaveBeenCalledTimes(1);
      // Second setState with same value (deep equal) should not notify
      state.setState({ count: 1 });
      // With util.isEqual, same value won't trigger another notification
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should use custom equality function', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0, name: 'test' }),
        isEqual: (a, b) => a.count === b.count,
      });
      state.subscribe(subscriber);
      state.setState({ count: 0, name: 'changed' });
      expect(subscriber).not.toHaveBeenCalled();
      state.setState({ count: 1, name: 'test' });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should not notify when custom equality returns true', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
        isEqual: () => true,
      });
      state.subscribe(subscriber);
      state.setState({ count: 100 });
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('state updates', () => {
    it('should update state with updater function', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState((previous) => ({ ...previous, count: previous.count + 1 }));
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
    it('should create selector that tracks selected state', () => {
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
      state.setState({ count: 5, name: 'test' });
      expect(selectorState.getSnapshot()).toBe(5);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should not notify selector if selected value has not changed', () => {
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
      state.setState({ count: 0, name: 'changed' });
      expect(subscriber).not.toHaveBeenCalled();
      state.setState({ count: 1, name: 'test' });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should use custom equality for selector', () => {
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
      state.setState({ user: { id: 1, name: 'Bob' } });
      expect(subscriber).not.toHaveBeenCalled();
      state.setState({ user: { id: 2, name: 'Alice' } });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple selectors on same state', () => {
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
      state.setState({ count: 5, name: 'test' });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).not.toHaveBeenCalled();
      state.setState({ count: 5, name: 'changed' });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing from selector', () => {
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
      state.setState({ count: 5 });
      expect(selectorState.getSnapshot()).toBe(5);
      expect(subscriber).toHaveBeenCalledTimes(1);
      unsubscribe();
      state.setState({ count: 10 });
      expect(selectorState.getSnapshot()).toBe(10);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle nested selectors', () => {
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
      state.setState({ user: { profile: { name: 'Bob' } } });
      expect(nameSelector.getSnapshot()).toBe('Bob');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('derivedState', () => {
    it('should derive state from a single source store array', () => {
      const sourceState = createState({
        name: 'source',
        newState: () => ({ count: 0 }),
      });
      const doubledState = derivedState({
        name: 'source/doubled',
        state: [sourceState],
        selector: (snapshot) => snapshot.count * 2,
      });
      expect(doubledState.getSnapshot()).toBe(0);
      sourceState.setState({ count: 3 });
      expect(doubledState.getSnapshot()).toBe(6);
    });

    it('should derive state from multiple source stores and update from each source', () => {
      const layoutState = createState({
        name: 'layout',
        newState: () => ({
          elements: {
            a: { width: 0, height: 0 },
          },
          wasEverMeasured: false,
        }),
      });
      const overrideState = createState({
        name: 'override',
        newState: () => ({ forceMeasured: false }),
      });

      const areElementsMeasuredState = derivedState({
        name: 'Jointjs/AreElementsMeasured',
        state: [layoutState, overrideState],
        selector: (layoutSnapshot, overrideSnapshot) => {
          if (layoutSnapshot.wasEverMeasured || overrideSnapshot.forceMeasured) return true;
          const layoutEntries = Object.values(layoutSnapshot.elements);
          if (layoutEntries.length === 0) return false;
          return layoutEntries.every((layout) => layout.width > 1 && layout.height > 1);
        },
      });

      expect(areElementsMeasuredState.getSnapshot()).toBe(false);

      layoutState.setState({
        elements: {
          a: { width: 2, height: 2 },
        },
        wasEverMeasured: false,
      });
      expect(areElementsMeasuredState.getSnapshot()).toBe(true);

      layoutState.setState({
        elements: {
          a: { width: 0, height: 0 },
        },
        wasEverMeasured: false,
      });
      expect(areElementsMeasuredState.getSnapshot()).toBe(false);

      overrideState.setState({ forceMeasured: true });
      expect(areElementsMeasuredState.getSnapshot()).toBe(true);
    });

    it('should support deriving from any number of source stores', () => {
      const firstState = createState({
        name: 'first',
        newState: () => 1,
      });
      const secondState = createState({
        name: 'second',
        newState: () => 2,
      });
      const thirdState = createState({
        name: 'third',
        newState: () => 3,
      });

      const sumState = derivedState({
        name: 'sum',
        state: [firstState, secondState, thirdState],
        selector: (first, second, third) => first + second + third,
      });

      expect(sumState.getSnapshot()).toBe(6);
      thirdState.setState(10);
      expect(sumState.getSnapshot()).toBe(13);
      firstState.setState(5);
      expect(sumState.getSnapshot()).toBe(17);
    });

    it('should unsubscribe from all source stores on clean', () => {
      const firstState = createState({
        name: 'first',
        newState: () => 1,
      });
      const secondState = createState({
        name: 'second',
        newState: () => 2,
      });

      const sumState = derivedState({
        name: 'sum',
        state: [firstState, secondState],
        selector: (first, second) => first + second,
      });
      const subscriber = jest.fn();
      sumState.subscribe(subscriber);

      firstState.setState(5);
      expect(sumState.getSnapshot()).toBe(7);
      expect(subscriber).toHaveBeenCalledTimes(1);

      sumState.clean();
      firstState.setState(10);
      secondState.setState(10);

      expect(sumState.getSnapshot()).toBe(7);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset and clean', () => {
    it('should reset state to initial value', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState({ count: 10 });
      expect(state.getSnapshot().count).toBe(10);
      state.clean();
      expect(state.getSnapshot().count).toBe(0);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should clean state and clear subscribers', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber1);
      state.subscribe(subscriber2);
      state.setState({ count: 5 });
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
      state.clean();
      expect(state.getSnapshot().count).toBe(0);
      state.setState({ count: 10 });
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

    it('should return true after notifying subscribers', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState({ count: 1 });
      expect(state.getAreComponentsNotified()).toBe(true);
    });

    it('should return true after state update and notification', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState({ count: 1 });
      expect(state.getAreComponentsNotified()).toBe(true);
    });

    it('should return false when state does not change', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      const sameObject = { count: 1 };
      state.setState(sameObject);
      expect(state.getAreComponentsNotified()).toBe(true);
      state.setState(sameObject);
      expect(state.getAreComponentsNotified()).toBe(false);
    });

    it('should reset to false on new state update', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({ count: 0 }),
      });
      state.subscribe(subscriber);
      state.setState({ count: 1 });
      expect(state.getAreComponentsNotified()).toBe(true);
      state.setState({ count: 2 });
      expect(state.getAreComponentsNotified()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle primitive state values', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => 0,
      });
      state.subscribe(subscriber);
      state.setState(5);
      expect(state.getSnapshot()).toBe(5);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle array state values', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => [1, 2, 3],
      });
      state.subscribe(subscriber);
      state.setState([4, 5, 6]);
      expect(state.getSnapshot()).toEqual([4, 5, 6]);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle null and undefined states', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => null as null | string,
      });
      state.subscribe(subscriber);
      state.setState('test');
      expect(state.getSnapshot()).toBe('test');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle complex nested objects', () => {
      const subscriber = jest.fn();
      const state = createState({
        name: 'test',
        newState: () => ({
          users: [{ id: 1, name: 'Alice' }],
          metadata: { version: 1 },
        }),
      });
      state.subscribe(subscriber);
      state.setState({
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
});
