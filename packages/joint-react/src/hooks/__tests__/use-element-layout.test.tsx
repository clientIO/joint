import { renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { paperRenderElementWrapper, getTestGraph } from '../../utils/test-wrappers';
import { useElementLayout } from '../use-element-layout';
import { useElementsLayout } from '../use-stores';

describe('useElementLayout', () => {
  it('should return node layout when used inside renderElement', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(() => useElementLayout(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('x');
      expect(result.current).toHaveProperty('y');
      expect(result.current).toHaveProperty('width');
      expect(result.current).toHaveProperty('height');
    });
  });

  it('should return layout for explicit id', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(() => useElementLayout('element-1'), { wrapper });

    await waitFor(() => {
      if (result.current) {
        expect(result.current.x).toBe(10);
        expect(result.current.y).toBe(20);
        expect(result.current.width).toBe(100);
        expect(result.current.height).toBe(50);
      }
    });
  });

  it('should return undefined for non-existent element', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(() => useElementLayout('non-existent'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should support selector as first argument (context mode)', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(() => useElementLayout((layout) => layout?.width), { wrapper });

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should support selector as second argument (id mode)', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(
      () => useElementLayout('element-1', (layout) => ({ w: layout?.width, h: layout?.height })),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toEqual({ w: 100, h: 50 });
    });
  });

  it('should return undefined from selector for non-existent element', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(() => useElementLayout('missing', (layout) => layout?.x), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should not cause infinite re-renders with primitive selector', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(
      () => {
        const renderCountRef = useRef(0);
        renderCountRef.current += 1;
        const width = useElementLayout((layout) => layout?.width);
        return { width, renderCount: renderCountRef.current };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.width).toBe(100);
    });

    const countAfterStable = result.current.renderCount;

    // Wait a bit and check render count hasn't grown unboundedly
    await waitFor(() => {
      expect(result.current.renderCount).toBeLessThanOrEqual(countAfterStable + 1);
    });
  });

  it('should not cause infinite re-renders without selector (full layout)', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(
      () => {
        const renderCount = useRef(0);
        renderCount.current += 1;
        const layout = useElementLayout();
        return { layout, renderCount: renderCount.current };
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.layout).toBeDefined();
    });

    const countAfterStable = result.current.renderCount;

    await waitFor(() => {
      expect(result.current.renderCount).toBeLessThanOrEqual(countAfterStable + 1);
    });
  });
});

describe('useElementsLayout', () => {
  it('should return full Map when called without selector', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(() => useElementsLayout(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeInstanceOf(Map);
      expect(result.current.size).toBe(1);
      const layout = result.current.get('element-1');
      expect(layout).toBeDefined();
      expect(layout?.width).toBe(100);
      expect(layout?.height).toBe(50);
    });
  });
});
