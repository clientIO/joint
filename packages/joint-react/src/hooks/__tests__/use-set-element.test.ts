import { act, renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useSetElement } from '../use-set-element';
import { useGraph } from '../use-graph';
import { useElements } from '../use-elements';

describe('use-set-element', () => {
  const wrapper = graphProviderWrapper({
    defaultElements: [
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
    defaultLinks: [
      {
        id: '3',
        source: '1',
        target: '2',
      },
    ],
  });

  it('should set element with all properties', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement(),
          graph: useGraph(),
          reactElementsSizeCheck: useElements(),
        };
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(97);
    });

    act(() => {
      result.current.set('1', 'size', { width: 1000, height: 1000 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(1000);
    });
  });

  it('should set element with selected id', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement('1'),
          graph: useGraph(),
          reactElementsSizeCheck: useElements(),
        };
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(97);
    });

    act(() => {
      result.current.set('size', { width: 1000, height: 1000 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(1000);
    });
  });

  it('should set element with selected id and attribute', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement('1', 'size'),
          graph: useGraph(),
          reactElementsSizeCheck: useElements(),
        };
      },
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(97);
    });

    act(() => {
      result.current.set({ width: 1000, height: 1000 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(1000);
    });
  });

  it('should not set element if ID is invalid', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement(),
          graph: useGraph(),
        };
      },
      {
        wrapper,
      }
    );

    act(() => {
      result.current.set('invalid-id', 'size', { width: 500, height: 500 });
    });

    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(graph.getCell('invalid-id')).toBeUndefined();
    });
  });

  it('should set element if attribute is invalid', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement('1'),
          graph: useGraph(),
        };
      },
      {
        wrapper,
      }
    );

    act(() => {
      result.current.set('invalid-attribute', { width: 500, height: 500 });
    });

    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element.get('invalid-attribute')).toEqual({
        width: 500,
        height: 500,
      });
    });
  });

  it('should set element if value is undefined', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement('1', 'size'),
          graph: useGraph(),
        };
      },
      {
        wrapper,
      }
    );

    act(() => {
      result.current.set(undefined);
    });

    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element.get('size')).toEqual(undefined);
    });
  });

  it('should skip setting if value is the same as the current value', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement('1', 'size'),
          graph: useGraph(),
        };
      },
      {
        wrapper,
      }
    );

    act(() => {
      result.current.set({ width: 97, height: 99 });
    });

    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element.get('size')).toEqual({ width: 97, height: 99 });
    });
  });

  it('should handle setter function for value', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          set: useSetElement('1', 'size'),
          graph: useGraph(),
        };
      },
      {
        wrapper,
      }
    );

    act(() => {
      result.current.set((previous) => ({
        // @ts-expect-error just mocks
        width: previous?.width + 10,
        // @ts-expect-error just mocks
        height: previous?.height + 10,
      }));
    });

    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element.get('size')).toEqual({ width: 107, height: 109 });
    });
  });
});
