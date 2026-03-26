import { renderHook, waitFor, act } from '@testing-library/react';
import { graphProviderWrapper } from '../../utils/test-wrappers';
import { useElementsNew } from '../use-elements';
import { useElementsLayout } from '../use-stores';
import { useGraphStore } from '../use-graph-store';
import type { dia } from '@joint/core';
import type { CellData } from '../../types/cell-data';
import type { CellId } from '../../types/cell-id';

type ElementsMap = Map<CellId, CellData>;

describe('useElementsNew', () => {
  // GraphProvider sets up graphView, but initial elements are synced via
  // graphState.updateGraph with isUpdateFromReact flag — which graphChanges filters out.
  // So we pass empty initial state and add elements directly to the graph.
  const wrapper = graphProviderWrapper({});

  function useSetupAndElements<T = ElementsMap>(
    selector?: (items: ElementsMap) => T,
    isEqual?: (a: T, b: T) => boolean
  ) {
    const store = useGraphStore();
    const elements = useElementsNew(selector, isEqual);
    return { elements: elements as T, graph: store.graph };
  }

  function addElementsToGraph(graph: dia.Graph) {
    graph.addCell({ id: '1', type: 'PortalElement', position: { x: 0, y: 0 }, size: { width: 97, height: 99 } });
    graph.addCell({ id: '2', type: 'PortalElement', position: { x: 10, y: 10 }, size: { width: 50, height: 60 } });
  }

  it('returns a Map of all elements without selector', async () => {
    const { result } = renderHook(() => useSetupAndElements(), { wrapper });

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      const map = result.current.elements;
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(2);
      expect(map.get('1')).toEqual(expect.objectContaining({ width: 97, height: 99 }));
      expect(map.get('2')).toEqual(expect.objectContaining({ width: 50, height: 60 }));
    });
  });

  it('applies selector to extract element count', async () => {
    const { result } = renderHook(
       
      () => useSetupAndElements((elements) => elements.size),
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements).toBe(2);
    });
  });

  it('applies selector to get a single element', async () => {
    const { result } = renderHook(
       
      () => useSetupAndElements((elements) => elements.get('1')),
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements).toEqual(expect.objectContaining({ width: 97, height: 99 }));
    });
  });

  it('applies selector to extract array of widths', async () => {
    const { result } = renderHook(
      // eslint-disable-next-line sonarjs/no-nested-functions
      () => useSetupAndElements((elements) => [...elements.values()].map((item) => item.width)),
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements).toEqual([97, 50]);
    });
  });

  it('re-renders when an element changes (no selector)', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return {
          ...useSetupAndElements(),
          elementsLayout: useElementsLayout(),
        };
      },
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements.size).toBe(2);
    });

    const rendersBefore = renders.mock.calls.length;

    // Position changes update elementsLayout, not elements data container
    act(() => {
      (result.current.graph.getCell('1') as dia.Element).position(100, 200);
    });

    await waitFor(() => {
      expect(renders.mock.calls.length).toBeGreaterThan(rendersBefore);
      expect(result.current.elementsLayout.get('1')).toEqual(
        expect.objectContaining({ x: 100, y: 200 })
      );
    });
  });

  it('no-selector returns a new Map copy (immutable snapshot)', async () => {
    const { result } = renderHook(() => useSetupAndElements(), { wrapper });

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements.size).toBe(2);
    });

    const mapBefore = result.current.elements;

    // Use a data change (z-index) that updates the elements data container, not layout
    act(() => {
      (result.current.graph.getCell('1') as dia.Element).set('z', 10);
    });

    await waitFor(() => {
      // New Map reference (snapshot copy), not the same mutable Map
      expect(result.current.elements).not.toBe(mapBefore);
    });
  });

  it('skips re-render when selector output is unchanged', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
         
        return useSetupAndElements((elements) => elements.size);
      },
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements).toBe(2);
    });

    const rendersBefore = renders.mock.calls.length;

    // Position change — count stays the same
    act(() => {
      (result.current.graph.getCell('1') as dia.Element).position(100, 200);
    });

    await waitFor(() => {
      expect(result.current.elements).toBe(2);
    });

    // Renders should not have increased
    expect(renders.mock.calls.length).toBe(rendersBefore);
  });

  it('uses custom isEqual to prevent re-render', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useSetupAndElements(
           
          (items) => items,
           
          (previous, next) => previous.size === next.size
        );
      },
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    await waitFor(() => {
      expect(result.current.elements.size).toBe(2);
    });

    const rendersBefore = renders.mock.calls.length;

    // Position change — size unchanged → isEqual returns true → no re-render
    act(() => {
      (result.current.graph.getCell('1') as dia.Element).position(100, 200);
    });

    await waitFor(() => {
      expect(result.current.elements.size).toBe(2);
    });

    expect(renders.mock.calls.length).toBe(rendersBefore);
  });

  it('identity selector (map) => map NEVER re-renders (footgun)', async () => {
    const renders = jest.fn();
    const { result } = renderHook(
      () => {
        renders();
         
        return useSetupAndElements((map) => map);
      },
      { wrapper }
    );

    act(() => {
      addElementsToGraph(result.current.graph);
    });

    // Wait for initial render to settle
    await waitFor(() => {
      expect(result.current.elements).toBeInstanceOf(Map);
    });

    const rendersBefore = renders.mock.calls.length;

    // Add a new element — this is a real change
    act(() => {
      result.current.graph.addCell({
        id: '3',
        type: 'PortalElement',
        position: { x: 99, y: 99 },
        size: { width: 30, height: 30 },
      });
    });

    // Give React time to potentially re-render
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should NOT have re-rendered because (map) => map returns the same
    // mutable Map reference — Object.is says equal, React skips.
    expect(renders.mock.calls.length).toBe(rendersBefore);
  });
});
