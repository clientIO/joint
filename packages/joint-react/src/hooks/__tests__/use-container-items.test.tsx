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

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  return { container, readOnly, Wrapper };
}

const selectLabel = (item: TestItem): string => item.data.label;

describe('useContainerItems', () => {
  it('returns empty Map when container is empty', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerItems(readOnly, selectLabel),
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
      () => useContainerItems(readOnly, selectLabel),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-1')).toBe('A');
    expect(result.current.get('el-2')).toBe('B');
  });

  it('returns filtered items when IDs provided', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.set('el-2', { data: { label: 'B' }, x: 50 });
    container.set('el-3', { data: { label: 'C' }, x: 100 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, selectLabel, ['el-1', 'el-3']),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-1')).toBe('A');
    expect(result.current.get('el-3')).toBe('C');
    expect(result.current.has('el-2')).toBe(false);
  });

  it('updates when subscribed item changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'initial' }, x: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, selectLabel),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current.get('el-1')).toBe('initial');

    await act(async () => {
      container.set('el-1', { data: { label: 'updated' }, x: 0 });
      container.commitChanges();
    });

    expect(result.current.get('el-1')).toBe('updated');
  });

  it('updates when item is added', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, selectLabel),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current.size).toBe(1);

    await act(async () => {
      container.set('el-2', { data: { label: 'B' }, x: 50 });
      container.commitChanges();
    });

    expect(result.current.size).toBe(2);
    expect(result.current.get('el-2')).toBe('B');
  });

  it('returns stable Map reference when selected values have not changed', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.set('el-2', { data: { label: 'B' }, x: 50 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, selectLabel),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const firstRef = result.current;
    expect(firstRef.size).toBe(2);

    // Change x (not label) — selector output is the same
    await act(async () => {
      container.set('el-1', { data: { label: 'A' }, x: 999 });
      container.commitChanges();
    });

    // Should return the same Map reference since selected values are identical
    expect(result.current).toBe(firstRef);
  });

  it('returns new Map reference when selected values change', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'A' }, x: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItems(readOnly, selectLabel),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const firstRef = result.current;

    await act(async () => {
      container.set('el-1', { data: { label: 'changed' }, x: 0 });
      container.commitChanges();
    });

    expect(result.current).not.toBe(firstRef);
    expect(result.current.get('el-1')).toBe('changed');
  });
});
