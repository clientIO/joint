import { act, renderHook, waitFor } from '@testing-library/react';
import { useAddLink } from '../use-add-link';
import { useGraph } from '../use-graph';
import { useLinks } from '../use-links';
import { graphProviderWrapper } from '../../utils/test-wrappers';

describe('use-add-link', () => {
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
  });

  it('should test adding link properly', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          add: useAddLink(),
          graph: useGraph(),
          reactLinksSizeCheck: useLinks((items) => items.size),
        };
      },
      {
        wrapper,
      }
    );
    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(0);
      expect(result.current.reactLinksSizeCheck).toBe(0);
    });
    act(() => {
      result.current.add({
        id: '100',
        source: { id: '1' },
        target: { id: '2' },
      });
    });
    // check if the link is added to the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(1);
      expect(result.current.reactLinksSizeCheck).toBe(1);
    });
  });
});
