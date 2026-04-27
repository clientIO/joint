import { renderHook, act } from '@testing-library/react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItem } from '../use-container-item';

interface TestItem {
  readonly id: string;
  readonly data: { readonly label: string };
  readonly x: number;
}

function createTestContext() {
  const container = createContainer<TestItem>();
  const readOnly = asReadonlyContainer(container);
  return { container, readOnly };
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('useContainerItem', () => {
  it('returns undefined when item does not exist', () => {
    const { readOnly } = createTestContext();
    const { result } = renderHook(() =>
      useContainerItem(readOnly, 'missing', (item) => item.data)
    );
    expect(result.current).toBeUndefined();
  });

  it('returns selected value from existing item', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', data: { label: 'hi' }, x: 1 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() =>
      useContainerItem(readOnly, 'a', (item) => item.data.label)
    );
    expect(result.current).toBe('hi');
  });

  it('re-renders when the subscribed item changes', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', data: { label: 'v1' }, x: 1 });
    container.commitChanges();
    await flush();

    const { result } = renderHook(() =>
      useContainerItem(readOnly, 'a', (item) => item.data.label)
    );
    expect(result.current).toBe('v1');

    await act(async () => {
      container.set('a', { id: 'a', data: { label: 'v2' }, x: 2 });
      container.commitChanges();
      await flush();
    });
    expect(result.current).toBe('v2');
  });

  it('ignores changes to other ids', async () => {
    const { container, readOnly } = createTestContext();
    container.set('a', { id: 'a', data: { label: 'a' }, x: 1 });
    container.set('b', { id: 'b', data: { label: 'b' }, x: 2 });
    container.commitChanges();
    await flush();

    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useContainerItem(readOnly, 'a', (item) => item.data.label);
    });
    expect(result.current).toBe('a');
    const initialRenders = renders;

    await act(async () => {
      container.set('b', { id: 'b', data: { label: 'b2' }, x: 2 });
      container.commitChanges();
      await flush();
    });
    expect(renders).toBe(initialRenders);
  });
});
