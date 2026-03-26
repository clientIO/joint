import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItems } from '../use-container-items';

interface TestItem {
  readonly data: { readonly label: string };
  readonly x: number;
}

function createTestContext() {
  const container = createContainer<TestItem>();
  const readOnly = asReadonlyContainer(container);

  function TestWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return <>{children}</>;
  }

  return { container, readOnly, Wrapper: TestWrapper };
}

describe('useContainerItems', () => {
  it('returns empty Map when container is empty', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerItems(readOnly),
      { wrapper: Wrapper },
    );

    expect(result.current.size).toBe(0);
  });

  it('returns all items when no IDs provided', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.set('el-2', { data: { label: 'B' }, x: 50 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-1')).toEqual({ data: { label: 'A' }, x: 0 });
    expect(result.current.get('el-2')).toEqual({ data: { label: 'B' }, x: 50 });
  });

  it('returns filtered items when IDs provided', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.set('el-2', { data: { label: 'B' }, x: 50 });
    container.set('el-3', { data: { label: 'C' }, x: 100 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, ['el-1', 'el-3']),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-1')).toEqual({ data: { label: 'A' }, x: 0 });
    expect(result.current.get('el-3')).toEqual({ data: { label: 'C' }, x: 100 });
    expect(result.current.has('el-2')).toBe(false);
  });

  it('applies selector over full Map', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.set('el-2', { data: { label: 'B' }, x: 50 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, (items) => items.size),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toBe(2);
  });

  it('updates when subscribed item changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'initial' }, x: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current.get('el-1')?.data.label).toBe('initial');

    await act(async () => {
      container.set('el-1', { data: { label: 'updated' }, x: 0 });
      container.commitChanges();
    });

    expect(result.current.get('el-1')?.data.label).toBe('updated');
  });

  it('updates when item is added', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current.size).toBe(1);

    await act(async () => {
      container.set('el-2', { data: { label: 'B' }, x: 50 });
      container.commitChanges();
    });

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-2')).toEqual({ data: { label: 'B' }, x: 50 });
  });

  it('returns stable Map reference when values have not changed', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.set('el-2', { data: { label: 'B' }, x: 50 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const firstRef = result.current;
    expect(firstRef.size).toBe(2);

    // Re-set with same reference — should be stable
    await act(async () => {
      const item = container.get('el-1')!;
      container.set('el-1', item);
      container.commitChanges();
    });

    expect(result.current).toBe(firstRef);
  });

  it('returns new Map reference when values change', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const firstRef = result.current;

    await act(async () => {
      container.set('el-1', { data: { label: 'changed' }, x: 0 });
      container.commitChanges();
    });

    expect(result.current).not.toBe(firstRef);
    expect(result.current.get('el-1')?.data.label).toBe('changed');
  });

  it('selector re-renders only when output changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.commitChanges();

    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useContainerItems(readOnly, (items) => items.size);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toBe(1);
    const renderCountAfterMount = renders.mock.calls.length;

    // Change x but not size — selector output doesn't change
    await act(async () => {
      container.set('el-1', { data: { label: 'A' }, x: 999 });
      container.commitChanges();
    });

    // Size is still 1 — should not re-render
    expect(result.current).toBe(1);
    expect(renders.mock.calls.length).toBe(renderCountAfterMount);
  });
});
