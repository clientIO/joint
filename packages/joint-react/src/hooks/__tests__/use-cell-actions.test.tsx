/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
import { renderHook, waitFor } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useGraph } from '../use-graph';
import { useCellActions } from '../use-cell-actions';
import { useElements } from '../use-elements';
import { act } from 'react';
import type { ReducerType } from '@reduxjs/toolkit';
import { useLinks } from '../use-links';

describe('useCellActions', () => {
  // @ts-expect-error - We setup in beforeEach
  let wrapper: ReducerType<React.JSX.Element, unknown>;
  beforeEach(() => {
    wrapper = graphProviderWrapper({
      elements: [
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
      links: [
        {
          id: '3',
          source: '1',
          target: '2',
        },
      ],
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
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(97);
    });

    act(() => {
      result.current.actions.set({ id: '1', width: 1000 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(result.current.reactElementsSizeCheck[0].width).toBe(1000);
    });

    act(() => {
      result.current.actions.set({ id: '10', width: 999 });
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(3);
      expect(result.current.reactElementsSizeCheck.length).toBe(3);
      expect(result.current.reactElementsSizeCheck[2].width).toBe(999);
    });

    act(() => {
      result.current.actions.set('2', (previous) => ({ ...previous, width: 500 }));
    });

    // check if the element is set in the graph
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(3);
      expect(result.current.reactElementsSizeCheck.length).toBe(3);
      expect(result.current.reactElementsSizeCheck[1].width).toBe(500);
    });

    // remove element
    act(() => {
      result.current.actions.remove('1');
    });

    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      expect(
        result.current.reactElementsSizeCheck.find((element) => element.id === '1')
      ).toBeUndefined();
    });

    // check if other element is still there
    await waitFor(() => {
      const { graph } = result.current;
      expect(graph.getElements().length).toBe(2);
      expect(result.current.reactElementsSizeCheck.length).toBe(2);
      const element = result.current.reactElementsSizeCheck.find((element) => element.id === '2');
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
      result.current.actions.set({
        id: '3',
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
      expect(result.current.links.length).toBe(1);
      expect(result.current.links[0].id).toBe('3');
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
      expect(result.current.links.length).toBe(1);
      expect(result.current.links[0].id).toBe('3');
      expect(link).toBeDefined();
      expect(link?.get('attrs')?.line?.stroke ?? '').toBe('#FF0000');
    });

    // add new link
    act(() => {
      result.current.actions.set({
        id: '30',
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
      expect(result.current.links.length).toBe(2);
      expect(result.current.links.find((l) => l.id === '30')?.id).toBe('30');
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
      expect(result.current.links.length).toBe(1);
      expect(result.current.links[0].id).toBe('30');
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
      expect(result.current.links.length).toBe(0);
      const link = graph.getCell('30');
      expect(link).toBeUndefined();
    });
  });
});
