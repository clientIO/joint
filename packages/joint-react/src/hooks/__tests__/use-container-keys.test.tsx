import { renderHook, act } from '@testing-library/react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerKeys } from '../use-container-keys';

interface TestItem {
  readonly id: string;
  readonly value: number;
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('useContainerKeys', () => {
  it('returns an empty array when the container is empty', () => {
    const container = createContainer<TestItem>();
    const readOnly = asReadonlyContainer(container);
    const { result } = renderHook(() => useContainerKeys(readOnly));
    expect(result.current).toEqual([]);
  });

  it('reflects current keys after a commit', async () => {
    const container = createContainer<TestItem>();
    const readOnly = asReadonlyContainer(container);

    const { result } = renderHook(() => useContainerKeys(readOnly));

    await act(async () => {
      container.set('a', { id: 'a', value: 1 });
      container.set('b', { id: 'b', value: 2 });
      container.commitChanges();
      await flush();
    });

    expect([...result.current].toSorted((a, b) => String(a).localeCompare(String(b)))).toEqual([
      'a',
      'b',
    ]);
  });

  it('returns a stable reference when the key set does not change', async () => {
    const container = createContainer<TestItem>();
    const readOnly = asReadonlyContainer(container);
    container.set('a', { id: 'a', value: 1 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() => useContainerKeys(readOnly));
    const first = result.current;

    await act(async () => {
      container.set('a', { id: 'a', value: 99 });
      container.commitChanges();
      await flush();
    });
    // Value-only change → no key-set change → same array reference
    expect(result.current).toBe(first);
  });

  it('updates the array when a key is added or removed', async () => {
    const container = createContainer<TestItem>();
    const readOnly = asReadonlyContainer(container);
    container.set('a', { id: 'a', value: 1 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() => useContainerKeys(readOnly));

    await act(async () => {
      container.set('b', { id: 'b', value: 2 });
      container.commitChanges();
      await flush();
    });
    expect(result.current).toHaveLength(2);

    await act(async () => {
      container.delete('a');
      container.commitChanges();
      await flush();
    });
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toBe('b');
  });
});
