/* eslint-disable @eslint-react/hooks-extra/no-unnecessary-use-prefix */
import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';
import { useMeasureNodeSize } from '../use-measure-node-size';

// Mocks for @joint/core and useGraphStore

// This is a mock for a hook, but the linter wants no 'use' prefix if not a real hook
jest.mock('../use-graph-store', () => {
  const graph = {
    getCell: jest.fn((_id: string) => ({
      isElement: () => true,
      set: jest.fn(),
    })),
  };
  return {
    useGraphStore: () => ({
      graph,
      setMeasuredNode: jest.fn(() => jest.fn()),
      hasMeasuredNode: jest.fn(),
    }),
  };
});

// This is a mock for a hook, but the linter wants no 'use' prefix if not a real hook
jest.mock('../use-cell-id', () => ({
  useCellId: () => 'cell-1',
}));

jest.mock('../../utils/create-element-size-observer', () => ({
  createElementSizeObserver: (
    element: HTMLElement,
    cb: (size: { width: number; height: number }) => void
  ) => {
    // Simulate initial measurement
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      cb({ width: rect.width, height: rect.height });
    }, 0);
    return jest.fn();
  },
}));

describe('useMeasureNodeSize', () => {
  interface TestComponentProps {
    readonly style: React.CSSProperties;
    readonly children?: React.ReactNode;
    readonly setSize: (options: {
      element: unknown;
      size: { width: number; height: number };
    }) => void;
  }
  function TestComponent({ style, children, setSize }: TestComponentProps) {
    const ref = useRef<HTMLDivElement>(null);
    useMeasureNodeSize(ref, { setSize });
    return (
      <div ref={ref} data-testid="measured" style={style}>
        {children}
      </div>
    );
  }

  const explicitStyle = { width: '123px', height: '45px' };
  const contentStyle = { padding: '10px', fontSize: '20px' };

  it('measures element with explicit width and height', async () => {
    const setSize = jest.fn();
    // Mock getBoundingClientRect for this test
    const getBoundingClientRect = jest.fn(() => ({ width: 123, height: 45 }));
    // Render and patch the ref after mount
    const { getByTestId } = render(
      <TestComponent style={explicitStyle} setSize={setSize}>
        Explicit
      </TestComponent>
    );
    const element = getByTestId('measured');
    // @ts-expect-error assigning mock getBoundingClientRect to element for test
    element.getBoundingClientRect = getBoundingClientRect;

    // Wait for measurement
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(setSize).toHaveBeenCalledWith(
      expect.objectContaining({
        size: { width: 123, height: 45 },
      })
    );
  });

  it('measures element with size from content/margin/padding', async () => {
    const setSize = jest.fn();
    // Mock getBoundingClientRect for this test
    const getBoundingClientRect = jest.fn(() => ({ width: 50, height: 30 }));
    const { getByTestId } = render(
      <TestComponent style={contentStyle} setSize={setSize}>
        Hello world
      </TestComponent>
    );
    const element = getByTestId('measured');
    // @ts-expect-error assigning mock getBoundingClientRect to element for test
    element.getBoundingClientRect = getBoundingClientRect;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Should be called with some nonzero size
    expect(setSize).toHaveBeenCalledWith(
      expect.objectContaining({
        size: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      })
    );
    // Should not be zero
    const [[call]] = setSize.mock.calls;
    expect(call.size.width).toBeGreaterThan(0);
    expect(call.size.height).toBeGreaterThan(0);
  });
});
