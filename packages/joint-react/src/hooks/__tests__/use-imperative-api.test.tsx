import { renderHook, act } from '@testing-library/react';
import { useImperativeApi } from '../use-imperative-api';

describe('useImperativeApi', () => {
  it('should initialize and cleanup properly', () => {
    const onLoad = jest.fn(() => ({
      instance: { value: 'test-instance' },
      cleanup: jest.fn(),
    }));
    const onUpdate = jest.fn();
    const { result, unmount } = renderHook(() => useImperativeApi({ onLoad, onUpdate }, []));

    // Verify onLoad is called and instance is set
    expect(onLoad).toHaveBeenCalled();
    expect(result.current.isReady).toBe(true);
    expect(result.current.ref.current).toEqual({ value: 'test-instance' });

    // Unmount and verify cleanup
    unmount();
    for (const cleanup of onLoad.mock.results.map(({ value }) => value.cleanup)) {
      expect(cleanup).toHaveBeenCalledTimes(1);
    }
  });

  it('should handle isDisabled properly', () => {
    const onLoad = jest.fn(() => ({
      instance: { value: 'test-instance' },
      cleanup: jest.fn(),
    }));
    const { result, rerender } = renderHook(
      ({ isDisabled }) => useImperativeApi({ onLoad, isDisabled }, []),
      { initialProps: { isDisabled: false } }
    );

    // Verify instance is loaded initially
    expect(result.current.isReady).toBe(true);
    expect(result.current.ref.current).toEqual({ value: 'test-instance' });

    // Set isDisabled to true and verify cleanup
    act(() => {
      rerender({ isDisabled: true });
    });
    expect(result.current.isReady).toBe(false);
    expect(result.current.ref.current).toBeNull();
    for (const cleanup of onLoad.mock.results.map(({ value }) => value.cleanup)) {
      expect(cleanup).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onUpdate when dependencies change', () => {
    const onLoad = jest.fn(() => ({
      instance: { value: 'test-instance' },
      cleanup: jest.fn(),
    }));
    const onUpdate = jest.fn();
    const { rerender } = renderHook(
      ({ dependencies }) => useImperativeApi({ onLoad, onUpdate }, dependencies),
      { initialProps: { dependencies: [1] } }
    );

    // Verify onUpdate is not called initially
    expect(onUpdate).not.toHaveBeenCalled();

    // Change dependencies and verify onUpdate is called with reset function
    rerender({ dependencies: [2] });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(
      { value: 'test-instance' },
      expect.any(Function) // Ensure reset function is passed
    );
  });

  it('should handle cleanup from onUpdate', () => {
    const onLoad = jest.fn(() => ({
      instance: { value: 'test-instance' },
      cleanup: jest.fn(),
    }));
    const onUpdateCleanup = jest.fn();
    const onUpdate = jest.fn(() => onUpdateCleanup);
    const { rerender, unmount } = renderHook(
      ({ dependencies }) => useImperativeApi({ onLoad, onUpdate }, dependencies),
      { initialProps: { dependencies: [1] } }
    );

    // Change dependencies and verify onUpdate cleanup is called
    rerender({ dependencies: [2] });

    // Unmount and verify final cleanup
    unmount();
    expect(onLoad.mock.results[0].value.cleanup).toHaveBeenCalledTimes(1);
    expect(onUpdateCleanup).toHaveBeenCalledTimes(1);
  });

  it('should handle reset functionality properly', () => {
    let instanceValue = 'test-load';
    const onLoad = jest.fn(() => ({
      instance: { value: instanceValue },
      cleanup: jest.fn(),
    }));
    const onUpdate = jest.fn((instance, reset) => {
      reset();
    });
    const { result, rerender } = renderHook(
      ({ counter }) => useImperativeApi({ onLoad, onUpdate }, [counter]),
      {
        initialProps: { counter: 0 },
      }
    );

    // Verify initial load
    expect(onLoad).toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(true);
    expect(result.current.ref.current).toEqual({ value: 'test-load' });

    act(() => {
      instanceValue = 'test-reset';
      rerender({ counter: 1 });
    });

    // Verify onUpdate and reset behavior
    expect(onLoad.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(result.current.ref.current).toEqual({ value: 'test-reset' });
  });

  it('should cleanup the current instance before reset and cleanup the reset instance on unmount', () => {
    let nextId = 0;
    const events: string[] = [];
    const onLoad = jest.fn(() => {
      const id = nextId++;
      events.push(`load:${id}`);
      return {
        instance: { id },
        cleanup: jest.fn(() => {
          events.push(`cleanup:${id}`);
        }),
      };
    });
    const onUpdate = jest.fn((_instance, reset) => {
      reset();
    });

    const { result, rerender, unmount } = renderHook(
      ({ counter }) => useImperativeApi({ onLoad, onUpdate }, [counter]),
      {
        initialProps: { counter: 0 },
      }
    );

    const initialInstanceId = result.current.ref.current?.id;
    expect(initialInstanceId).toBeDefined();

    act(() => {
      rerender({ counter: 1 });
    });

    const resetInstanceId = result.current.ref.current?.id;
    expect(resetInstanceId).toBeDefined();
    expect(resetInstanceId).not.toBe(initialInstanceId);
    expect(events.slice(-2)).toEqual([`cleanup:${initialInstanceId}`, `load:${resetInstanceId}`]);

    unmount();
    expect(events.at(-1)).toBe(`cleanup:${resetInstanceId}`);
  });
});
