import {
  GraphExternalContextStore,
  type GraphExternalContextId,
  type GraphExternalContextSnapshot,
} from '../graph-external-context-store';

describe('GraphExternalContextStore', () => {
  it('should keep string, number, and symbol external context ids distinct', () => {
    const store = new GraphExternalContextStore();
    const stringId = '1';
    const numberId = 1;
    const symbolId = Symbol('external-context');

    store.setExternalContext(stringId, 'string-value');
    store.setExternalContext(numberId, 'number-value');
    store.setExternalContext(symbolId, 'symbol-value');

    expect(store.entries).toBeInstanceOf(Map);
    expect(store.entries.get(stringId)?.value).toBe('string-value');
    expect(store.entries.get(numberId)?.value).toBe('number-value');
    expect(store.entries.get(symbolId)?.value).toBe('symbol-value');

    const snapshot = store.versionState.getSnapshot() as unknown as GraphExternalContextSnapshot;
    expect(snapshot).toBeInstanceOf(Map);
    expect(snapshot.get(stringId)).toBe(1);
    expect(snapshot.get(numberId)).toBe(1);
    expect(snapshot.get(symbolId)).toBe(1);
  });

  it('should expose the registered external context through getExternalContext and clear it after removeExternalContext', () => {
    const store = new GraphExternalContextStore();
    const cleanup = jest.fn();
    const contextId = 'external-context-access';

    store.setExternalContext(contextId, { label: 'context-value' }, cleanup);

    expect(store.getExternalContext(contextId)?.value).toEqual({ label: 'context-value' });
    expect(store.getExternalContext(contextId)?.cleanup).toBe(cleanup);

    store.removeExternalContext(contextId);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(store.getExternalContext(contextId)).toBeNull();
  });

  it('should call cleanup, remove the external context value, and bump its revision', () => {
    const store = new GraphExternalContextStore();
    const cleanup = jest.fn();
    const contextId: GraphExternalContextId = Symbol('external-context-to-remove');

    store.setExternalContext(contextId, 'value', cleanup);
    store.removeExternalContext(contextId);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(store.entries.has(contextId)).toBe(false);
    expect((store.versionState.getSnapshot() as GraphExternalContextSnapshot).get(contextId)).toBe(
      2
    );
  });

  it('should cleanup all registered external contexts on destroy', () => {
    const store = new GraphExternalContextStore();
    const firstCleanup = jest.fn();
    const secondCleanup = jest.fn();

    store.setExternalContext('first', 'value', firstCleanup);
    store.setExternalContext('second', 'value', secondCleanup);
    store.destroy();

    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(store.entries.size).toBe(0);
    expect((store.versionState.getSnapshot() as GraphExternalContextSnapshot).size).toBe(0);
  });
});
