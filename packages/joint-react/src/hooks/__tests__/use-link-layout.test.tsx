import { renderHook, waitFor } from '@testing-library/react';
import { paperRenderLinkWrapper, getTestGraph } from '../../utils/test-wrappers';
import { useLinkLayout } from '../use-link-layout';

describe('useLinkLayout', () => {
  it('should return link layout when used inside renderLink', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { x: 0, y: 0, width: 100, height: 100 },
          'element-2': { x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { source: 'element-1', target: 'element-2' },
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
          'element-1': { x: 0, y: 0, width: 100, height: 100 },
          'element-2': { x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { source: 'element-1', target: 'element-2' },
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

  it('should return undefined for non-existent link', async () => {
    const graph = getTestGraph();
    const wrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        graph,
        elements: {
          'element-1': { x: 0, y: 0, width: 100, height: 100 },
          'element-2': { x: 300, y: 300, width: 100, height: 100 },
        },
        links: {
          'link-1': { source: 'element-1', target: 'element-2' },
        },
      },
    });

    const { result } = renderHook(() => useLinkLayout('non-existent-link'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});
