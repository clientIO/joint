import { renderHook, act } from '@testing-library/react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItems } from '../use-container-items';

interface TestItem {
  readonly id: string;
  readonly value: number;
}

function createTestContext() {
  const container = createContainer<TestItem>();
  const readOnly = asReadonlyContainer(container);
  return { container, readOnly };
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const sumValues = (items: ReadonlyArray<{ readonly value: number }>) =>
  items.reduce((accumulator, item) => accumulator + item.value, 0);

describe('useContainerItems (map mode, no ids)', () => {
  it('returns all items keyed by id', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', value: 1 });
    container.set('b', { id: 'b', value: 2 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() => useContainerItems(readOnly));
    expect(result.current.size).toBe(2);
    expect(result.current.get('a')?.value).toBe(1);
    expect(result.current.get('b')?.value).toBe(2);
  });

  it('is stable across re-renders when nothing changed', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', value: 1 });
    container.commitChanges();
    await flush();

    const { result, rerender } = renderHook(() => useContainerItems(readOnly));
    const firstRef = result.current;
    rerender();
    expect(result.current).toBe(firstRef);
  });

  it('reflects mutations after commit', async () => {
    const { container, readOnly } = createTestContext();
    const { result } = renderHook(() => useContainerItems(readOnly));
    expect(result.current.size).toBe(0);

    await act(async () => {
      container.set('a', { id: 'a', value: 1 });
      container.commitChanges();
      await flush();
    });
    expect(result.current.get('a')?.value).toBe(1);
  });
});

describe('useContainerItems (map mode, with ids)', () => {
  it('returns only items in the id list', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', value: 1 });
    container.set('b', { id: 'b', value: 2 });
    container.set('c', { id: 'c', value: 3 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() => useContainerItems(readOnly, ['a', 'c']));
    expect(result.current.size).toBe(2);
    expect(result.current.get('a')?.value).toBe(1);
    expect(result.current.get('c')?.value).toBe(3);
    expect(result.current.has('b')).toBe(false);
  });
});

describe('useContainerItems (selector mode)', () => {
  it('applies the selector to the items array', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', value: 10 });
    container.set('b', { id: 'b', value: 20 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() => useContainerItems(readOnly, sumValues));
    expect(result.current).toBe(30);
  });
});
