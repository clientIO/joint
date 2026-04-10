import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';

describe('useGraph', () => {
  const simpleWrapper = graphProviderWrapper({
    elements: { '1': { size: { width: 100, height: 100 } } },
  });

  it('should return graph instance and mutation methods', async () => {
    const { result } = renderHook(() => useGraph(), { wrapper: simpleWrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.graph).toHaveProperty('getCells');
      expect(result.current.graph).toHaveProperty('addCell');
      expect(result.current.graph).toHaveProperty('getCell');
      expect(result.current.setElement).toBeInstanceOf(Function);
      expect(result.current.removeElement).toBeInstanceOf(Function);
      expect(result.current.setLink).toBeInstanceOf(Function);
      expect(result.current.removeLink).toBeInstanceOf(Function);
    });
  });

  it('should return the same result on re-render', async () => {
    const { result, rerender } = renderHook(() => useGraph(), { wrapper: simpleWrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const firstResult = result.current;
    rerender();

    await waitFor(() => {
      expect(result.current).toBe(firstResult);
    });
  });
});
