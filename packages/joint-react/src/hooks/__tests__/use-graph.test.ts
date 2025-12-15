import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';

describe('use-graph', () => {
  const wrapper = graphProviderWrapper({
    elements: [
      {
        id: '1',
        width: 100,
        height: 100,
      },
    ],
  });

  it('should return graph instance', async () => {
    const { result } = renderHook(() => useGraph(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('getCells');
      expect(result.current).toHaveProperty('addCell');
      expect(result.current).toHaveProperty('getCell');
    });
  });

  it('should return the same graph instance on re-render', async () => {
    const { result, rerender } = renderHook(() => useGraph(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const firstGraph = result.current;
    rerender();

    await waitFor(() => {
      expect(result.current).toBe(firstGraph);
    });
  });
});




