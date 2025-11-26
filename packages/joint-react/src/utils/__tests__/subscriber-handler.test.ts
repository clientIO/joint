import { subscribeHandler } from '../subscriber-handler';

describe('subscriber-handler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should subscribe and notify subscribers', async () => {
    const handler = subscribeHandler();
    const subscriber = jest.fn();

    const unsubscribe = handler.subscribe(subscriber);
    handler.notifySubscribers();

    // Flush promises and timers
    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber).toHaveBeenCalled();
    unsubscribe();
  });

  it('should unsubscribe correctly', async () => {
    const handler = subscribeHandler();
    const subscriber = jest.fn();

    const unsubscribe = handler.subscribe(subscriber);
    unsubscribe();
    handler.notifySubscribers();

    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should coalesce multiple notifications in the same frame', async () => {
    const handler = subscribeHandler();
    const subscriber = jest.fn();

    handler.subscribe(subscriber);
    handler.notifySubscribers();
    handler.notifySubscribers();
    handler.notifySubscribers();

    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should handle different batch names separately', async () => {
    const handler = subscribeHandler();
    const subscriber = jest.fn();

    handler.subscribe(subscriber);
    handler.notifySubscribers('batch1');
    handler.notifySubscribers('batch2');

    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it('should call beforeSubscribe with batch name', async () => {
    const beforeSubscribe = jest.fn(() => undefined as never);
    const handler = subscribeHandler(beforeSubscribe);
    const subscriber = jest.fn();

    handler.subscribe(subscriber);
    handler.notifySubscribers('test-batch');

    await Promise.resolve();
    jest.runAllTimers();

    expect(beforeSubscribe).toHaveBeenCalledWith('test-batch');
  });

  it('should pass UpdateResult from beforeSubscribe to subscribers', async () => {
    const updateResult = {
      diffIds: new Set(['1', '2']),
      areElementsChanged: true,
      areLinksChanged: false,
    };
    const beforeSubscribe = jest.fn(() => updateResult);
    const handler = subscribeHandler(beforeSubscribe);
    const subscriber = jest.fn();

    handler.subscribe(subscriber);
    handler.notifySubscribers();

    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber).toHaveBeenCalledWith(updateResult);
  });

  it('should handle multiple subscribers', async () => {
    const handler = subscribeHandler();
    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();
    const subscriber3 = jest.fn();

    handler.subscribe(subscriber1);
    handler.subscribe(subscriber2);
    handler.subscribe(subscriber3);
    handler.notifySubscribers();

    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber1).toHaveBeenCalled();
    expect(subscriber2).toHaveBeenCalled();
    expect(subscriber3).toHaveBeenCalled();
  });
});
