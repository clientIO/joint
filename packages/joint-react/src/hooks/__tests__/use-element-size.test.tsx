import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItem } from '../use-container-item';
import type { ElementLayout, ElementSize } from '../../types/cell-data';

const selectSize = (layout: ElementLayout): ElementSize => ({
  width: layout.width,
  height: layout.height,
});

const isSizeEqual = (a: ElementSize, b: ElementSize): boolean =>
  a.width === b.width && a.height === b.height;

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

function createTestContext() {
  const container = createContainer<ElementLayout>();
  const readOnly = asReadonlyContainer(container);

  return { container, readOnly, Wrapper };
}

describe('useElementSize', () => {
  it('returns undefined when element does not exist', () => {
    const { readOnly, Wrapper } = createTestContext();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'missing', selectSize, isSizeEqual),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns { width, height } from the elementsLayout container', async () => {
    const { container, readOnly, Wrapper } = createTestContext();

    container.set('el-1', { x: 10, y: 20, width: 100, height: 50, angle: 0 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'el-1', selectSize, isSizeEqual),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toEqual({ width: 100, height: 50 });
  });

  it('does NOT re-render when position changes but size stays the same', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { x: 0, y: 0, width: 200, height: 100, angle: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectSize, isSizeEqual);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ width: 200, height: 100 });
    const initialRenderCount = renderCount.mock.calls.length;

    // Change position and angle only — size unchanged
    await act(async () => {
      container.set('el-1', { x: 999, y: 999, width: 200, height: 100, angle: 45 });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBe(initialRenderCount);
    expect(result.current).toEqual({ width: 200, height: 100 });
  });

  it('re-renders when size changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext();
    container.set('el-1', { x: 0, y: 0, width: 100, height: 50, angle: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectSize, isSizeEqual);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    const initialRenderCount = renderCount.mock.calls.length;

    await act(async () => {
      container.set('el-1', { x: 0, y: 0, width: 300, height: 150, angle: 0 });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBeGreaterThan(initialRenderCount);
    expect(result.current).toEqual({ width: 300, height: 150 });
  });
});
