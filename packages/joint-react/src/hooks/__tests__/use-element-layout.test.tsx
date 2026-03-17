import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderElementWrapper, getTestGraph } from '../../utils/test-wrappers';
import { useElementLayout } from '../use-element-layout';

describe('useElementLayout', () => {
  it('should return node layout when used inside renderElement', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderElementWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { x: 10, y: 20, width: 100, height: 50 },
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
          'element-1': { x: 10, y: 20, width: 100, height: 50 },
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
          'element-1': { x: 10, y: 20, width: 100, height: 50 },
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
          'element-1': { x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(
      () => useElementLayout((layout) => layout?.width),
      { wrapper }
    );

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
          'element-1': { x: 10, y: 20, width: 100, height: 50 },
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
          'element-1': { x: 10, y: 20, width: 100, height: 50 },
        },
      },
    });

    const { result } = renderHook(
      () => useElementLayout('missing', (layout) => layout?.x),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});
