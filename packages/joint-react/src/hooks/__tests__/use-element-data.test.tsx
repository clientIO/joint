import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItem } from '../use-container-item';

interface TestElementItem {
  readonly data: Record<string, unknown>;
  readonly z?: number;
}

const selectData = <D,>(item: { readonly data: D }): D => item.data;

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

function createTestContext() {
  const container = createContainer<TestElementItem>();
  const readOnly = asReadonlyContainer(container);

  return { container, readOnly, Wrapper };
}

describe('useElementData', () => {
  it('returns undefined when element does not exist', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'missing', selectData),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns the data field from elements container', async () => {
    const { container, readOnly, Wrapper } = createTestContext();

    container.set('el-1', { data: { label: 'Rectangle', color: 'blue' }, z: 1 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'el-1', selectData),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toEqual({ label: 'Rectangle', color: 'blue' });
  });

  it('re-renders when element data changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'initial' }, z: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectData);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ label: 'initial' });
    const initialRenderCount = renderCount.mock.calls.length;

    await act(async () => {
      container.set('el-1', { data: { label: 'updated' }, z: 0 });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBeGreaterThan(initialRenderCount);
    expect(result.current).toEqual({ label: 'updated' });
  });

  it('does NOT re-render when non-data fields change', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'test' }, z: 0 });
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
    expect(result.current).toBe('test');
    const afterInitialRenders = renderCount.mock.calls.length;

    // Change z only — selector output (data.label) unchanged
    await act(async () => {
      container.set('el-1', { data: { label: 'test' }, z: 99 });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
    expect(result.current).toBe('test');
  });

  it('does NOT re-render when a different element changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { data: { label: 'mine' }, z: 0 });
    container.set('el-2', { data: { label: 'other' }, z: 1 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectData);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ label: 'mine' });
    const afterInitialRenders = renderCount.mock.calls.length;

    await act(async () => {
      container.set('el-2', { data: { label: 'changed' }, z: 1 });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
    expect(result.current).toEqual({ label: 'mine' });
  });

  it('does NOT re-render when graphView sets new object with same data reference', async () => {
    const { container, readOnly, Wrapper } = createTestContext();

    const userData = { label: 'Node' };
    container.set('el-1', { data: userData });
    container.commitChanges();

    const renderCount = jest.fn();
    renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectData);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const afterInitialRenders = renderCount.mock.calls.length;

    // Simulate graphView re-computing elementToData() on position change:
    // Creates a NEW wrapper object but with the SAME data reference.
    // This is the bug: elements.set() creates a new object, container notifies,
    // but selectData returns the same ref → isEqual should prevent re-render.
    await act(async () => {
      container.set('el-1', { data: userData }); // new wrapper, same data ref
      container.commitChanges();
    });

    // The selector output (item.data) is the same reference → no re-render
    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
  });
});
