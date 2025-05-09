import { act, renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useRemoveCell } from '../use-remove-cell';
import { useGraph } from '../use-graph';
import { useLinks } from '../use-links';
import { useElements } from '../use-elements';

describe('use-remove-cell', () => {
  const wrapper = graphProviderWrapper({
    initialElements: [
      {
        id: '1',
        width: 97,
        height: 99,
      },
      {
        id: '2',
        width: 97,
        height: 99,
      },
    ],
    initialLinks: [
      {
        id: '3',
        source: '1',
        target: '2',
      },
    ],
  });

  it('should remove element from the graph', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          remove: useRemoveCell(),
          graph: useGraph(),
          reactLinksSizeCheck: useLinks((items) => items.size),
          reactElementsSizeCheck: useElements((items) => items.size),
        };
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(2);
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(graph.getLinks().length).toBe(1);
      expect(result.current.reactElementsSizeCheck).toBe(2);
      expect(result.current.reactLinksSizeCheck).toBe(1);
    });
    act(() => {
      // remove link
      result.current.remove('3');
    });
    // check if the element is removed from the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(graph.getLinks().length).toBe(0);
      expect(result.current.reactElementsSizeCheck).toBe(2);
      expect(result.current.reactLinksSizeCheck).toBe(0);
    });

    act(() => {
      // remove element
      result.current.remove('1');
    });
    // check if the element is removed from the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(1);
      expect(graph.getLinks().length).toBe(0);
      expect(result.current.reactElementsSizeCheck).toBe(1);
      expect(result.current.reactLinksSizeCheck).toBe(0);
    });

    act(() => {
      // remove element
      result.current.remove('2');
    });
    // check if the element is removed from the graph
    await waitFor(() => {
      const { graph } = result.current;

      expect(graph.getElements().length).toBe(0);
      expect(graph.getLinks().length).toBe(0);
      expect(result.current.reactElementsSizeCheck).toBe(0);
      expect(result.current.reactLinksSizeCheck).toBe(0);
    });
  });
});
