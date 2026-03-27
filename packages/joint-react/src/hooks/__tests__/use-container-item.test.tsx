import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItem } from '../use-container-item';

interface TestItem {
  readonly data: { readonly label: string };
  readonly x: number;
}

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

function createTestContext() {
  const container = createContainer<TestItem>();
  const readOnly = asReadonlyContainer(container);

  return { container, readOnly, Wrapper };
}

describe('useContainerItem', () => {
  it('returns undefined when item does not exist', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'missing', (item) => item.data),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns selected value from existing item', async () => {
    const { container, readOnly, Wrapper } = createTestContext();

    container.set('el-1', { data: { label: 'test' }, x: 100 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'el-1', (item) => item.data),
      { wrapper: Wrapper },
    );

    // Flush microtasks
    await act(async () => {});

    expect(result.current).toEqual({ label: 'test' });
  });

  it('re-renders when subscribed item changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'initial' }, x: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', (item) => item.data.label);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toBe('initial');
    const initialRenderCount = renderCount.mock.calls.length;

    // Update the item
    await act(async () => {
      container.set('el-1', { data: { label: 'updated' }, x: 0 });
      container.commitChanges();
    });

    expect(result.current).toBe('updated');
    expect(renderCount.mock.calls.length).toBeGreaterThan(initialRenderCount);
  });

  it('does NOT re-render when a different ID changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'mine' }, x: 0 });
    container.set('el-2', { data: { label: 'other' }, x: 50 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', (item) => item.data.label);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toBe('mine');
    const afterInitialRenders = renderCount.mock.calls.length;

    // Update el-2 only
    await act(async () => {
      container.set('el-2', { data: { label: 'changed' }, x: 99 });
      container.commitChanges();
    });

    // el-1 subscriber should NOT have re-rendered
    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
    expect(result.current).toBe('mine');
  });

  it('does NOT re-render when selector output is equal', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'test' }, x: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', (item) => item.data.label);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const afterInitialRenders = renderCount.mock.calls.length;

    // Update x but keep label the same — selector output unchanged
    await act(async () => {
      container.set('el-1', { data: { label: 'test' }, x: 999 });
      container.commitChanges();
    });

    // Should NOT re-render because selector returned same string
    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
    expect(result.current).toBe('test');
  });
});
