import { createState } from '../create-state';
import { scheduler } from '../scheduler';

describe('global scheduler.wrap', () => {
  afterEach(() => {
    scheduler.flushNowForTests();
  });

  it('should apply queued updaters in order using pending snapshot', () => {
    const baseStore = createState<{ readonly value: number }>({
      name: 'scheduler/order',
      newState: () => ({ value: 0 }),
      isEqual: (a, b) => a.value === b.value,
    });
    const wrappedStore = scheduler.wrap(baseStore);

    wrappedStore.setState(() => ({ value: 1 }));
    wrappedStore.setState((previous: { readonly value: number }) => ({ value: previous.value + 1 }));
    wrappedStore.setState((previous: { readonly value: number }) => ({ value: previous.value * 2 }));

    expect(wrappedStore.getSnapshot().value).toBe(4);
    expect(baseStore.getSnapshot().value).toBe(0);

    scheduler.flushNowForTests();

    expect(baseStore.getSnapshot().value).toBe(4);
    expect(wrappedStore.getSnapshot().value).toBe(4);
  });

  it('should batch multiple writes into one subscriber notification', () => {
    const baseStore = createState<{ readonly value: number }>({
      name: 'scheduler/notifications',
      newState: () => ({ value: 0 }),
      isEqual: (a, b) => a.value === b.value,
    });
    const wrappedStore = scheduler.wrap(baseStore);

    let notifications = 0;
    const unsubscribe = wrappedStore.subscribe(() => {
      notifications += 1;
    });

    wrappedStore.setState(() => ({ value: 1 }));
    wrappedStore.setState(() => ({ value: 2 }));
    wrappedStore.setState(() => ({ value: 3 }));

    scheduler.flushNowForTests();

    expect(notifications).toBe(1);
    expect(wrappedStore.getSnapshot().value).toBe(3);
    unsubscribe();
  });

  it('should batch updates across multiple wrapped stores in one flush cycle', () => {
    const firstStore = scheduler.wrap(
      createState<{ readonly value: number }>({
        name: 'scheduler/first',
        newState: () => ({ value: 0 }),
        isEqual: (a, b) => a.value === b.value,
      })
    );
    const secondStore = scheduler.wrap(
      createState<{ readonly value: number }>({
        name: 'scheduler/second',
        newState: () => ({ value: 0 }),
        isEqual: (a, b) => a.value === b.value,
      })
    );

    let firstNotifications = 0;
    let secondNotifications = 0;
    const unsubscribeFirst = firstStore.subscribe(() => {
      firstNotifications += 1;
    });
    const unsubscribeSecond = secondStore.subscribe(() => {
      secondNotifications += 1;
    });

    firstStore.setState(() => ({ value: 10 }));
    secondStore.setState(() => ({ value: 20 }));

    scheduler.flushNowForTests();

    expect(firstStore.getSnapshot().value).toBe(10);
    expect(secondStore.getSnapshot().value).toBe(20);
    expect(firstNotifications).toBe(1);
    expect(secondNotifications).toBe(1);
    unsubscribeFirst();
    unsubscribeSecond();
  });

  it('should return same wrapped instance for same base store', () => {
    const baseStore = createState<{ readonly value: number }>({
      name: 'scheduler/identity',
      newState: () => ({ value: 0 }),
      isEqual: (a, b) => a.value === b.value,
    });

    const wrappedA = scheduler.wrap(baseStore);
    const wrappedB = scheduler.wrap(baseStore);

    expect(wrappedA).toBe(wrappedB);
  });
});
