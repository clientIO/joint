import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useAreElementMeasured } from '../use-are-elements-measured';

describe('use-are-elements-measured', () => {
  it('should return false initially when elements are not measured', async () => {
    const wrapper = graphProviderWrapper({
      elements: [
        {
          id: '1',
          width: 0,
          height: 0,
        },
      ],
    });

    const { result } = renderHook(() => useAreElementMeasured(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should return true when elements are measured', async () => {
    const wrapper = graphProviderWrapper({
      elements: [
        {
          id: '1',
          width: 100,
          height: 100,
        },
      ],
    });

    const { result } = renderHook(() => useAreElementMeasured(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false when elements have small dimensions', async () => {
    const wrapper = graphProviderWrapper({
      elements: [
        {
          id: '1',
          width: 1,
          height: 1,
        },
      ],
    });

    const { result } = renderHook(() => useAreElementMeasured(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
