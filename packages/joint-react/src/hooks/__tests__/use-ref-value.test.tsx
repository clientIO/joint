import { renderHook, waitFor } from '@testing-library/react';
import { useRefValue } from '../use-ref-value';

describe('use-ref-value', () => {
  it('should return current ref value when ref is set', async () => {
    const ref = { current: 'test-value' };
    const { result } = renderHook(() => useRefValue(ref));

    await waitFor(() => {
      expect(result.current).toBe('test-value');
    });
  });

  it('should return undefined when ref is not set', async () => {
    const ref = { current: null };
    const { result } = renderHook(() => useRefValue(ref));

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should return undefined when ref is undefined', async () => {
    const { result } = renderHook(() => useRefValue(undefined as never));

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should update when ref value changes', async () => {
    const ref = { current: null as string | null };
    const { result, rerender } = renderHook(() => useRefValue(ref));

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });

    ref.current = 'new-value';
    rerender();

    await waitFor(() => {
      expect(result.current).toBe('new-value');
    });
  });
});
