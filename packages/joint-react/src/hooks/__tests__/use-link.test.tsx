import { renderHook, waitFor, act } from '@testing-library/react';
import { paperRenderLinkWrapper } from '../../utils/test-wrappers';
import { useLink } from '../use-link';
import { useGraph } from '../use-graph';
import type { dia } from '@joint/core';

describe('useLink', () => {
  const wrapper = paperRenderLinkWrapper({
    graphProviderProps: {
      elements: {
        '1': { data: undefined, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
        '2': { data: undefined, position: { x: 100, y: 100 }, size: { width: 10, height: 10 } },
      },
      links: {
        'link-1': { source: { id: '1' }, target: { id: '2' }, color: '#FF0000' },
      },
    },
    paperProps: {
      renderLink: () => <line />,
    },
  });

  it('should get link without selector', async () => {
    const { result } = renderHook(() => useLink(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.source).toEqual({ id: '1' });
      expect(result.current.target).toEqual({ id: '2' });
    });
  });

  it('should get link with selector', async () => {
    const { result } = renderHook(
      () => useLink((link) => link.source),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current).toEqual({ id: '1' });
    });
  });

  it('layout.d should match native JointJS link path after element move', async () => {
    let graphRef: dia.Graph | null = null;

    const moveWrapper = paperRenderLinkWrapper({
      graphProviderProps: {
        elements: {
          a: { data: undefined, position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
          b: { data: undefined, position: { x: 300, y: 200 }, size: { width: 100, height: 50 } },
        },
        links: {
          'link-1': { source: 'a', target: 'b' },
        },
      },
      paperProps: {
        renderLink: () => <line />,
      },
    });

    const { result } = renderHook(
      () => {
        const { graph } = useGraph();
        graphRef = graph;
        return useLink();
      },
      { wrapper: moveWrapper }
    );

    // Wait for initial render with layout
    await waitFor(() => {
      expect(result.current.layout).toBeDefined();
      expect(result.current.layout!.d).not.toBe('');
    });

    const initialD = result.current.layout!.d;

    // Move element — simulates user dragging
    act(() => {
      const element = graphRef!.getCell('b') as dia.Element;
      element.position(100, 400);
    });

    // After move, layout.d should update to match the new native link path
    await waitFor(() => {
      const layout = result.current.layout;
      expect(layout).toBeDefined();
      expect(layout!.d).not.toBe('');
      // The path must have changed from the initial position
      expect(layout!.d).not.toBe(initialD);
    });

    // Verify the React layout matches the actual JointJS link view path
    const linkCell = graphRef!.getCell('link-1') as dia.Link;
    const paper = graphRef!.findView(linkCell)?.paper;
    if (paper) {
      const linkView = paper.findViewByModel(linkCell) as dia.LinkView;
      const nativeD = linkView.getSerializedConnection?.() ?? '';
      expect(result.current.layout!.d).toBe(nativeD);
    }
  });
});
