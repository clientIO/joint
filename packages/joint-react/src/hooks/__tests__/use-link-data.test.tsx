import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItem } from '../use-container-item';

interface TestLinkItem {
  readonly data: Record<string, unknown>;
  readonly source: string;
  readonly target: string;
}

const selectData = <D,>(item: { readonly data: D }): D => item.data;

function createTestContext() {
  const container = createContainer<TestLinkItem>();
  const readOnly = asReadonlyContainer(container);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  return { container, readOnly, Wrapper };
}

describe('useLinkData', () => {
  it('returns undefined when link does not exist', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'missing', selectData),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns the data field from links container', async () => {
    const { container, readOnly, Wrapper } = createTestContext();

    container.set('link-1', {
      data: { label: 'connection', weight: 5 },
      source: 'el-1',
      target: 'el-2',
    });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'link-1', selectData),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toEqual({ label: 'connection', weight: 5 });
  });

  it('re-renders when link data changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('link-1', {
      data: { label: 'initial' },
      source: 'el-1',
      target: 'el-2',
    });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'link-1', selectData);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ label: 'initial' });
    const initialRenderCount = renderCount.mock.calls.length;

    await act(async () => {
      container.set('link-1', {
        data: { label: 'updated' },
        source: 'el-1',
        target: 'el-2',
      });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBeGreaterThan(initialRenderCount);
    expect(result.current).toEqual({ label: 'updated' });
  });

  it('does NOT re-render when a different link changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('link-1', { data: { label: 'mine' }, source: 'a', target: 'b' });
    container.set('link-2', { data: { label: 'other' }, source: 'c', target: 'd' });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'link-1', selectData);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ label: 'mine' });
    const afterInitialRenders = renderCount.mock.calls.length;

    await act(async () => {
      container.set('link-2', { data: { label: 'changed' }, source: 'c', target: 'd' });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
    expect(result.current).toEqual({ label: 'mine' });
  });
});
