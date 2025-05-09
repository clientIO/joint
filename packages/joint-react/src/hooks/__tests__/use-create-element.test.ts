import { act, renderHook, waitFor } from '@testing-library/react';
import { useCreateElement } from '../use-create-element';
import { simpleRenderElementWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';
import { useElements } from '../use-elements';

describe('use-create-element', () => {
  it('should add element and should it be added also to the graph', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          add: useCreateElement(),
          graph: useGraph(),
          reactElementsCheck: useElements((items) => items.size),
        };
      },
      {
        wrapper: simpleRenderElementWrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(1);
      expect(result.current.reactElementsCheck).toBe(1);
    });
    act(() => {
      result.current.add({
        id: '100',
      });
    });

    // check if the element is added to the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsCheck).toBe(2);
    });
  });
});
