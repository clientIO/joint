import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createContainer, asReadonlyContainer } from '../../store/state-container';
import { useContainerItem } from '../use-container-item';
import { CellIdContext } from '../../context';
import type { ElementLayout, ElementPosition } from '../../types/cell-data';

const selectPosition = (layout: ElementLayout): ElementPosition => ({
  x: layout.x,
  y: layout.y,
});

const isPositionEqual = (a: ElementPosition, b: ElementPosition): boolean =>
  a.x === b.x && a.y === b.y;

function createTestContext(cellId?: string) {
  const container = createContainer<ElementLayout>();
  const readOnly = asReadonlyContainer(container);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CellIdContext.Provider value={cellId}>
        {children}
      </CellIdContext.Provider>
    );
  }

  return { container, readOnly, Wrapper };
}

describe('useElementPosition', () => {
  it('returns undefined when element does not exist', () => {
    const { readOnly, Wrapper } = createTestContext('el-missing');

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'el-missing', selectPosition, isPositionEqual),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it('returns { x, y } from the layout container', async () => {
    const { container, readOnly, Wrapper } = createTestContext('el-1');

    container.set('el-1', { x: 100, y: 200, width: 50, height: 30, angle: 45 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'el-1', selectPosition, isPositionEqual),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toEqual({ x: 100, y: 200 });
  });

  it('only returns x and y, not other layout fields', async () => {
    const { container, readOnly, Wrapper } = createTestContext('el-1');

    container.set('el-1', { x: 10, y: 20, width: 100, height: 200, angle: 90 });
    container.commitChanges();

    const { result } = renderHook(
      () => useContainerItem(readOnly, 'el-1', selectPosition, isPositionEqual),
      { wrapper: Wrapper },
    );

    await act(async () => {});

    expect(result.current).toEqual({ x: 10, y: 20 });
    expect(result.current).not.toHaveProperty('width');
    expect(result.current).not.toHaveProperty('height');
    expect(result.current).not.toHaveProperty('angle');
  });

  it('does not re-render when only non-position fields change', async () => {
    const { container, readOnly, Wrapper } = createTestContext('el-1');

    container.set('el-1', { x: 50, y: 60, width: 100, height: 100, angle: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectPosition, isPositionEqual);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ x: 50, y: 60 });
    const afterInitialRenders = renderCount.mock.calls.length;

    // Change angle and size, but keep x,y the same
    await act(async () => {
      container.set('el-1', { x: 50, y: 60, width: 200, height: 300, angle: 90 });
      container.commitChanges();
    });

    expect(renderCount.mock.calls.length).toBe(afterInitialRenders);
    expect(result.current).toEqual({ x: 50, y: 60 });
  });

  it('re-renders when position changes', async () => {
    const { container, readOnly, Wrapper } = createTestContext('el-1');

    container.set('el-1', { x: 0, y: 0, width: 100, height: 100, angle: 0 });
    container.commitChanges();

    const renderCount = jest.fn();
    const { result } = renderHook(
      () => {
        renderCount();
        return useContainerItem(readOnly, 'el-1', selectPosition, isPositionEqual);
      },
      { wrapper: Wrapper },
    );

    await act(async () => {});
    expect(result.current).toEqual({ x: 0, y: 0 });
    const afterInitialRenders = renderCount.mock.calls.length;

    await act(async () => {
      container.set('el-1', { x: 99, y: 88, width: 100, height: 100, angle: 0 });
      container.commitChanges();
    });

    expect(result.current).toEqual({ x: 99, y: 88 });
    expect(renderCount.mock.calls.length).toBeGreaterThan(afterInitialRenders);
  });
});
