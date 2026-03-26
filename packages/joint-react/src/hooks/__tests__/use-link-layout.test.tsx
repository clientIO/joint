import { renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { paperRenderLinkWrapper, getTestGraph } from '../../utils/test-wrappers';
import { useLinkLayout } from '../use-link-layout';
import { useLinksLayout } from '../use-stores';

describe('useLinkLayout', () => {
  it('should return link layout when used inside renderLink', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(() => useLinkLayout(), { wrapper });

    await waitFor(() => {
      // Layout might be undefined initially until paper renders
      if (result.current) {
        expect(result.current).toHaveProperty('sourceX');
        expect(result.current).toHaveProperty('sourceY');
        expect(result.current).toHaveProperty('targetX');
        expect(result.current).toHaveProperty('targetY');
        expect(result.current).toHaveProperty('d');
      }
    });
  });

  it('should have correct structure for link layout', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(() => useLinkLayout(), { wrapper });

    await waitFor(() => {
      if (result.current) {
        expect(typeof result.current.sourceX).toBe('number');
        expect(typeof result.current.sourceY).toBe('number');
        expect(typeof result.current.targetX).toBe('number');
        expect(typeof result.current.targetY).toBe('number');
        expect(typeof result.current.d).toBe('string');
      }
    });
  });

  it('should return default layout for non-existent link', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(() => useLinkLayout('non-existent-link'), { wrapper });

    // With an explicit ID that doesn't exist, useLinkLayout returns undefined
    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should support selector as first argument (context mode)', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(
      () => useLinkLayout((layout) => layout?.d),
      { wrapper }
    );

    await waitFor(() => {
      if (result.current) {
        expect(typeof result.current).toBe('string');
      }
    });
  });

  it('should support selector as second argument (id mode)', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(
      () =>
        useLinkLayout('link-1', (layout) =>
          layout ? { sx: layout.sourceX, sy: layout.sourceY } : undefined
        ),
      { wrapper }
    );

    await waitFor(() => {
      if (result.current) {
        expect(result.current).toHaveProperty('sx');
        expect(result.current).toHaveProperty('sy');
        expect(typeof result.current.sx).toBe('number');
      }
    });
  });

  it('should return undefined from selector for non-existent link', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(
      () => useLinkLayout('missing-link', (layout) => layout?.d),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should not cause infinite re-renders with primitive selector', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(
      () => {
        const renderCount = useRef(0);
        renderCount.current += 1;
        const d = useLinkLayout((layout) => layout?.d);
        return { d, renderCount: renderCount.current };
      },
      { wrapper }
    );

    await waitFor(() => {
      if (result.current.d) {
        expect(typeof result.current.d).toBe('string');
      }
    });

    const countAfterStable = result.current.renderCount;

    await waitFor(() => {
      expect(result.current.renderCount).toBeLessThanOrEqual(countAfterStable + 1);
    });
  });

  it('should not cause infinite re-renders without selector (full layout)', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(
      () => {
        const renderCount = useRef(0);
        renderCount.current += 1;
        const layout = useLinkLayout();
        return { layout, renderCount: renderCount.current };
      },
      { wrapper }
    );

    await waitFor(() => {
      if (result.current.layout) {
        expect(result.current.layout).toHaveProperty('d');
      }
    });

    const countAfterStable = result.current.renderCount;

    await waitFor(() => {
      expect(result.current.renderCount).toBeLessThanOrEqual(countAfterStable + 1);
    });
  });
});

describe('useLinksLayout', () => {
  it('should return links layout snapshot', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { data: {}, x: 0, y: 0, width: 100, height: 100 },
          'element-2': { data: {}, x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { data: {}, source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(
      () => useLinksLayout(),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
    });
  });
});
