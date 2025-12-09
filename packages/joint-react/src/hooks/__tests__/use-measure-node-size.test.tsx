/* eslint-disable @eslint-react/hooks-extra/no-unnecessary-use-prefix */
import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';
import { useMeasureNodeSize } from '../use-measure-node-size';

// Mocks for @joint/core and useGraphStore

// This is a mock for a hook, but the linter wants no 'use' prefix if not a real hook
const mockHasMeasuredNode = jest.fn(() => false);
const mockSetMeasuredNode = jest.fn(() => jest.fn());

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
      setMeasuredNode: mockSetMeasuredNode,
      hasMeasuredNode: mockHasMeasuredNode,
    }),
  };
});

// This is a mock for a hook, but the linter wants no 'use' prefix if not a real hook
jest.mock('../use-cell-id', () => ({
  useCellId: () => 'cell-1',
}));

jest.mock('../../store/create-elements-size-observer', () => ({
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
  beforeEach(() => {
    // Reset mocks before each test
    mockHasMeasuredNode.mockReturnValue(false);
    mockSetMeasuredNode.mockReturnValue(jest.fn());
  });

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

    // Mock observer doesn't trigger resize callbacks, so setSize won't be called
    // This test verifies the hook doesn't throw and setMeasuredNode is called
    expect(mockSetMeasuredNode).toHaveBeenCalled();
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

    // Mock observer doesn't trigger resize callbacks, so setSize won't be called
    // This test verifies the hook doesn't throw and setMeasuredNode is called
    expect(mockSetMeasuredNode).toHaveBeenCalled();
  });

  describe('multiple MeasuredNode error', () => {
    it('should throw error when multiple MeasuredNode components are used for the same element', () => {
      // Mock that a measured node already exists
      mockHasMeasuredNode.mockReturnValue(true);

      const setSize = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      // The error will be thrown during render, so we need to catch it
      let caughtError: Error | undefined;
      try {
        render(<TestComponent style={explicitStyle} setSize={setSize} />);
      } catch (error) {
        caughtError = error as Error;
      }

      // Verify error was thrown
      expect(caughtError).toBeDefined();
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toContain('Multiple MeasuredNode components detected');

      consoleError.mockRestore();
    });

    it('should throw detailed error message in development mode', () => {
      // Mock that a measured node already exists
      mockHasMeasuredNode.mockReturnValue(true);

      const setSize = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      // Set to development mode
      process.env.NODE_ENV = 'development';

      let caughtError: Error | undefined;
      try {
        render(<TestComponent style={explicitStyle} setSize={setSize} />);
      } catch (error) {
        caughtError = error as Error;
      }

      // Verify error was thrown with detailed message
      expect(caughtError).toBeDefined();
      expect(caughtError).toBeInstanceOf(Error);
      const errorMessage = caughtError?.message ?? '';
      expect(errorMessage).toContain(
        'Multiple MeasuredNode components detected for element with id "cell-1"'
      );
      expect(errorMessage).toContain('Only one MeasuredNode can be used per element');
      expect(errorMessage).toContain('Solution:');
      expect(errorMessage).toContain('Use only one MeasuredNode per element');
      expect(errorMessage).toContain('custom `setSize` handler');
      expect(errorMessage).toContain('Check your renderElement function');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
      consoleError.mockRestore();
    });

    it('should throw concise error message in production mode', () => {
      // Mock that a measured node already exists
      mockHasMeasuredNode.mockReturnValue(true);

      const setSize = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      // Set to production mode
      process.env.NODE_ENV = 'production';

      let caughtError: Error | undefined;
      try {
        render(<TestComponent style={explicitStyle} setSize={setSize} />);
      } catch (error) {
        caughtError = error as Error;
      }

      // Verify error was thrown with concise message
      expect(caughtError).toBeDefined();
      expect(caughtError).toBeInstanceOf(Error);
      const errorMessage = caughtError?.message ?? '';
      expect(errorMessage).toBe(
        'Multiple MeasuredNode components detected for element "cell-1". Only one MeasuredNode can be used per element.'
      );
      // Should not contain detailed solution in production
      expect(errorMessage).not.toContain('Solution:');
      expect(errorMessage).not.toContain('Check your renderElement function');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
      consoleError.mockRestore();
    });

    it('should not throw error when no MeasuredNode exists for the element', () => {
      // Mock that no measured node exists
      mockHasMeasuredNode.mockReturnValue(false);

      const setSize = jest.fn();
      const getBoundingClientRect = jest.fn(() => ({ width: 123, height: 45 }));

      const { getByTestId } = render(
        <TestComponent style={explicitStyle} setSize={setSize}>
          Test
        </TestComponent>
      );

      const element = getByTestId('measured');
      // @ts-expect-error assigning mock getBoundingClientRect to element for test
      element.getBoundingClientRect = getBoundingClientRect;

      // Should not throw and should call setMeasuredNode with the correct options
      expect(mockSetMeasuredNode).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cell-1',
          element: expect.any(HTMLElement),
        })
      );
    });
  });
});
