import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';
import { useCellActions } from '../use-cell-actions';
import { useElements } from '../use-elements';
import { act } from 'react';
import type { ReducerType } from '@reduxjs/toolkit';
import { useLinks } from '../use-links';
import { useNodeLayout } from '../use-node-layout';

describe('useCellActions', () => {
  // @ts-expect-error - We setup in beforeEach
  let wrapper: ReducerType<React.JSX.Element, unknown>;
  beforeEach(() => {
    wrapper = graphProviderWrapper({
      elements: {
        '1': {
          x: 50,
          y: 50,
          width: 97,
          height: 99,
        },
        '2': {
          x: 200,
          y: 200,
          width: 97,
          height: 99,
        },
      },
      links: {
        '3': {
          source: '1',
          target: '2',
        },
      },
    });
  });

  it('should test set and remove actions for elements', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          actions: useCellActions(),
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
      expect(Object.keys(result.current.reactElementsSizeCheck).length).toBe(2);
      expect(result.current.reactElementsSizeCheck['1'].width).toBe(97);
    });

    act(() => {
      result.current.actions.set('1', { width: 1000 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(Object.keys(result.current.reactElementsSizeCheck).length).toBe(2);
      expect(result.current.reactElementsSizeCheck['1'].width).toBe(1000);
    });

    act(() => {
      result.current.actions.set('10', { width: 999 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(3);
      expect(Object.keys(result.current.reactElementsSizeCheck).length).toBe(3);
      expect(result.current.reactElementsSizeCheck['10'].width).toBe(999);
    });

    act(() => {
      result.current.actions.set('2', (previous) => ({ ...previous, width: 500 }));
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(3);
      expect(Object.keys(result.current.reactElementsSizeCheck).length).toBe(3);
      expect(result.current.reactElementsSizeCheck['2'].width).toBe(500);
    });

    // remove element
    act(() => {
      result.current.actions.remove('1');
    });

    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(Object.keys(result.current.reactElementsSizeCheck).length).toBe(2);
      expect(result.current.reactElementsSizeCheck['1']).toBeUndefined();
    });

    // check if other element is still there
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(Object.keys(result.current.reactElementsSizeCheck).length).toBe(2);
      const element = result.current.reactElementsSizeCheck['2'];
      expect(element).toBeDefined();
      expect(element?.width).toBe(500);
    });
  });

  it('should test set and remove actions for links', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          actions: useCellActions(),
          graph: useGraph(),
          links: useLinks(),
        };
      },
      {
        wrapper,
      }
    );
    await waitFor(() => {
      expect(renders).toHaveBeenCalledTimes(1);
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(1);
    });

    act(() => {
      result.current.actions.set('3', {
        source: { id: '1' },
        target: { id: '2' },
        attrs: {
          line: { stroke: '#001DFF' },
        },
      });
    });

    // check if the link is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(1);
      const link = graph.getCell('3');
      expect(Object.keys(result.current.links).length).toBe(1);
      expect(result.current.links['3'].source).toBeDefined();
      expect(link).toBeDefined();
      expect(link?.get('attrs')?.line?.stroke ?? '').toBe('#001DFF');
    });

    // update link with updater function
    act(() => {
      result.current.actions.set('3', (previous) => ({
        ...previous,
        attrs: {
          line: { stroke: '#FF0000' },
        },
      }));
    });

    // check if the link is updated in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(1);
      const link = graph.getCell('3');
      expect(Object.keys(result.current.links).length).toBe(1);
      expect(result.current.links['3'].source).toBeDefined();
      expect(link).toBeDefined();
      expect(link?.get('attrs')?.line?.stroke ?? '').toBe('#FF0000');
    });

    // add new link
    act(() => {
      result.current.actions.set('30', {
        source: { id: '2' },
        target: { id: '1' },
        attrs: {
          line: { stroke: '#00FF00' },
        },
      });
    });

    // check if the link is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(2);
      const link = graph.getCell('30');
      expect(Object.keys(result.current.links).length).toBe(2);
      expect(result.current.links['30']?.source).toBeDefined();
      expect(link).toBeDefined();
      expect(link?.get('attrs')?.line?.stroke ?? '').toBe('#00FF00');
    });

    // remove link
    act(() => {
      result.current.actions.remove('3');
    });

    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(1);
      expect(Object.keys(result.current.links).length).toBe(1);
      expect(result.current.links['30'].source).toBeDefined();
      const link = graph.getCell('3');
      expect(link).toBeUndefined();
    });

    // remove last
    act(() => {
      result.current.actions.remove('30');
    });

    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(0);
      expect(Object.keys(result.current.links).length).toBe(0);
      const link = graph.getCell('30');
      expect(link).toBeUndefined();
    });
  });

  it('should set position using nested position object', async () => {
    const { result } = renderHook(
      () => {
        return {
          actions: useCellActions(),
          graph: useGraph(),
          elements: useElements(),
        };
      },
      { wrapper }
    );

    // Wait for initial render
    await waitFor(() => {
      expect(result.current.elements['1']).toBeDefined();
      expect(result.current.elements['1'].x).toBe(50);
      expect(result.current.elements['1'].y).toBe(50);
    });

    // Set position using nested position object (JointJS-style)
    act(() => {
      result.current.actions.set('1', (previous) => ({
        ...previous,
        position: { x: 100, y: 150 },
      }));
    });

    // Verify the graph element has the new position
    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element).toBeDefined();
      const position = element?.get('position');
      expect(position?.x).toBe(100);
      expect(position?.y).toBe(150);
      // Also verify React state
      expect(result.current.elements['1'].x).toBe(100);
      expect(result.current.elements['1'].y).toBe(150);
    });
  });

  it('should set size using nested size object', async () => {
    const { result } = renderHook(
      () => {
        return {
          actions: useCellActions(),
          graph: useGraph(),
          elements: useElements(),
        };
      },
      { wrapper }
    );

    // Wait for initial render
    await waitFor(() => {
      expect(result.current.elements['1']).toBeDefined();
      expect(result.current.elements['1'].width).toBe(97);
      expect(result.current.elements['1'].height).toBe(99);
    });

    // Set size using nested size object (JointJS-style)
    act(() => {
      result.current.actions.set('1', (previous) => ({
        ...previous,
        size: { width: 200, height: 250 },
      }));
    });

    // Verify the graph element has the new size
    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element).toBeDefined();
      const size = element?.get('size');
      expect(size?.width).toBe(200);
      expect(size?.height).toBe(250);
    });

    // Verify the React state has the new size (flat format)
    await waitFor(() => {
      expect(result.current.elements['1'].width).toBe(200);
      expect(result.current.elements['1'].height).toBe(250);
    });
  });

  it('should set size using flat width/height properties', async () => {
    const { result } = renderHook(
      () => {
        return {
          actions: useCellActions(),
          graph: useGraph(),
          elements: useElements(),
        };
      },
      { wrapper }
    );

    // Wait for initial render
    await waitFor(() => {
      expect(result.current.elements['1']).toBeDefined();
      expect(result.current.elements['1'].width).toBe(97);
      expect(result.current.elements['1'].height).toBe(99);
    });

    // Set size using flat width/height properties
    act(() => {
      result.current.actions.set('1', (previous) => ({
        ...previous,
        width: 300,
        height: 350,
      }));
    });

    // Verify the graph element has the new size
    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element).toBeDefined();
      const size = element?.get('size');
      expect(size?.width).toBe(300);
      expect(size?.height).toBe(350);
    });

    // Verify the React state has the new size
    await waitFor(() => {
      expect(result.current.elements['1'].width).toBe(300);
      expect(result.current.elements['1'].height).toBe(350);
    });
  });

  it('should set angle correctly', async () => {
    const { result } = renderHook(
      () => {
        return {
          actions: useCellActions(),
          graph: useGraph(),
          elements: useElements(),
        };
      },
      { wrapper }
    );

    // Wait for initial render
    await waitFor(() => {
      expect(result.current.elements['1']).toBeDefined();
    });

    // Set angle
    act(() => {
      result.current.actions.set('1', (previous) => ({
        ...previous,
        angle: 45,
      }));
    });

    // Verify the graph element has the new angle
    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      expect(element).toBeDefined();
      expect(element?.get('angle')).toBe(45);
    });

    // Verify the React state has the new angle
    await waitFor(() => {
      expect(result.current.elements['1'].angle).toBe(45);
    });
  });

  it('should create a new link via set and make it visible in graph', async () => {
    const { result } = renderHook(
      () => {
        return {
          actions: useCellActions(),
          graph: useGraph(),
          links: useLinks(),
        };
      },
      { wrapper }
    );

    // Wait for initial render with the existing link
    await waitFor(() => {
      expect(result.current.links['3']).toBeDefined();
      expect(result.current.graph.getLinks().length).toBe(1);
    });

    // Create a new link
    act(() => {
      result.current.actions.set('new-link', {
        source: '2',
        target: '1',
        attrs: {
          line: { stroke: '#FF0000' },
        },
      });
    });

    // Verify the link exists in React state
    await waitFor(() => {
      expect(Object.keys(result.current.links).length).toBe(2);
      expect(result.current.links['new-link']).toBeDefined();
      expect(result.current.links['new-link'].source).toBe('2');
      expect(result.current.links['new-link'].target).toBe('1');
    });

    // Verify the link exists in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getLinks().length).toBe(2);
      const link = graph.getCell('new-link');
      expect(link).toBeDefined();
      expect(link?.get('source')).toEqual({ id: '2' });
      expect(link?.get('target')).toEqual({ id: '1' });
    });
  });

  it('should update layout state when size is changed via set', async () => {
    const { result } = renderHook(
      () => {
        return {
          actions: useCellActions(),
          graph: useGraph(),
          elements: useElements(),
          layout: useNodeLayout('1'),
        };
      },
      { wrapper }
    );

    // Wait for initial render with layout state
    await waitFor(() => {
      expect(result.current.elements['1']).toBeDefined();
      expect(result.current.layout).toBeDefined();
      expect(result.current.layout?.width).toBe(97);
      expect(result.current.layout?.height).toBe(99);
    });

    // Set size using useCellActions
    act(() => {
      result.current.actions.set('1', (previous) => ({
        ...previous,
        width: 400,
        height: 450,
      }));
    });

    // Verify the layout state is updated (this was the bug - layout state wasn't updating)
    await waitFor(() => {
      expect(result.current.layout).toBeDefined();
      expect(result.current.layout?.width).toBe(400);
      expect(result.current.layout?.height).toBe(450);
    });

    // Also verify graph and elements state are updated
    await waitFor(() => {
      const { graph } = result.current;
      const element = graph.getCell('1');
      const size = element?.get('size');
      expect(size?.width).toBe(400);
      expect(size?.height).toBe(450);
      expect(result.current.elements['1'].width).toBe(400);
      expect(result.current.elements['1'].height).toBe(450);
    });
  });
});
