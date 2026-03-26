import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerKeys } from '../use-container-keys';

function createTestContext() {
  const container = createContainer<{ value: number }>();
  const readOnly = asReadonlyContainer(container);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  return { container, readOnly, Wrapper };
}

describe('useContainerKeys', () => {
  it('returns empty array when container is empty', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerKeys(readOnly),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual([]);
  });

  it('returns IDs after items are added', async () => {
    const { container, readOnly, Wrapper } = createTestContext();

    container.set('a', { value: 1 });
    container.set('b', { value: 2 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerKeys(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toEqual(expect.arrayContaining(['a', 'b']));
    expect(result.current.length).toBe(2);
  });

  it('re-renders when item is added (size changes)', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('a', { value: 1 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerKeys(readOnly);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const initialRenders = renderCount.mock.calls.length;

    await act(async () => {
      container.set('b', { value: 2 });
      container.commitChanges();
    });

    expect(result.current).toEqual(expect.arrayContaining(['a', 'b']));
    expect(renderCount.mock.calls.length).toBeGreaterThan(initialRenders);
  });

  it('does NOT re-render when item value changes (size unchanged)', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('a', { value: 1 });
    container.commitChanges();

    const renderCount = jest.fn();
    renderHook(
      () => {
        renderCount();
        return useContainerKeys(readOnly);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const initialRenders = renderCount.mock.calls.length;

    // Update value but don't change size
    await act(async () => {
      container.set('a', { value: 999 });
      container.commitChanges();
    });

    // Should NOT re-render — size didn't change
    expect(renderCount.mock.calls.length).toBe(initialRenders);
  });

  it('returns stable reference when IDs have not changed', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('a', { value: 1 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerKeys(readOnly),
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const firstRef = result.current;

    // Add and remove same item — net size change = 0
    await act(async () => {
      container.set('b', { value: 2 });
      container.delete('b');
      container.commitChanges();
    });

    // Keys should be same reference
    expect(result.current).toBe(firstRef);
  });

  it('detects add+remove of DIFFERENT items in same batch (net size unchanged)', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('a', { value: 1 });
    container.set('b', { value: 2 });
    container.commitChanges();

    const { result } = renderHook(() => useContainerKeys(readOnly), { wrapper: Wrapper });
    await act(async () => {});
    expect(result.current).toEqual(expect.arrayContaining(['a', 'b']));

    // Add c + remove b in same batch — net size stays 2
    await act(async () => {
      container.set('c', { value: 3 });
      container.delete('b');
      container.commitChanges();
    });

    // Keys should update to [a, c] even though size didn't change
    expect(result.current).toEqual(expect.arrayContaining(['a', 'c']));
    expect(result.current).not.toContain('b');
  });
});
