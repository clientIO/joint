import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphStoreContext } from '../../../context/graph-store-context';
import { GraphProvider } from '../graph-provider';
import { createStore, type Store } from '../../../data/create-store';
import { dia } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import { createElements } from '../../../utils/create';
import * as stories from '../graph-provider.stories';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import type { GraphElement } from '../../../types/element-types';

runStorybookSnapshot({
  Component: GraphProvider,
  stories,
  name: 'GraphProvider',
});
describe('graph-provider', () => {
  it('should render children and match snapshot', () => {
    const { asFragment, getByText } = render(
      <GraphProvider>
        <div>Child Content</div>
      </GraphProvider>
    );
    expect(getByText('Child Content')).toMatchSnapshot();
    expect(asFragment()).toMatchSnapshot();
  });

  it('should provide a graph instance in context', () => {
    let contextGraph: Store | undefined;
    function TestComponent() {
      contextGraph = React.useContext(GraphStoreContext);
      return null;
    }
    render(
      <GraphProvider>
        <TestComponent />
      </GraphProvider>
    );
    expect(contextGraph).toBeInstanceOf(Object);
  });

  it('should render graph provider with links and elements', async () => {
    const elements = createElements([
      {
        width: 100,
        height: 100,
        id: 'element1',
      },
    ]);
    const link = new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } });
    let linkCount = 0;
    let elementCount = 0;
    function TestComponent() {
      linkCount = useElements((items) => items.size);
      elementCount = useLinks((items) => {
        return items.size;
      });
      return null;
    }
    render(
      // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
      <GraphProvider initialElements={elements} initialLinks={[link]}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });
  it('should add elements and links after initial load and useElements and useLinks should catch them', async () => {
    const graph = new dia.Graph();
    let linkCount = 0;
    let elementCount = 0;
    // eslint-disable-next-line sonarjs/no-identical-functions
    function TestComponent() {
      linkCount = useElements((items) => items.size);
      elementCount = useLinks((items) => {
        return items.size;
      });
      return null;
    }
    render(
      <GraphProvider graph={graph}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(0);
      expect(elementCount).toBe(0);
    });

    act(() => {
      graph.addCells([
        new dia.Element({ id: 'element1', type: 'standard.Rectangle' }),
        new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } }),
      ]);
    });

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });

  it('should initialize with default elements', async () => {
    const elements = createElements([
      { width: 100, height: 100, id: 'element1' },
      { width: 200, height: 200, id: 'element2' },
    ]);
    let elementCount = 0;
    function TestComponent() {
      elementCount = useElements((items) => items.size);
      return null;
    }
    render(
      <GraphProvider initialElements={elements}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(elementCount).toBe(2);
    });
  });

  it('should use provided store and clean up on unmount', () => {
    const mockDestroy = jest.fn();
    const mockStore = createStore({});
    // @ts-expect-error its just unit test, readonly is not needed
    mockStore.destroy = mockDestroy;

    const { unmount } = render(
      <GraphProvider store={mockStore}>
        <div>Test</div>
      </GraphProvider>
    );

    expect(mockDestroy).not.toHaveBeenCalled();
    unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('should use graph provided by PaperOptions', async () => {
    const graph = new dia.Graph();
    const cell = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    graph.addCell(cell);
    let currentElements: GraphElement[] = [];
    function Elements() {
      const elements = useElements();
      currentElements = elements;
      return null;
    }

    const { unmount } = render(
      <GraphProvider graph={graph}>
        <Elements />
        <div>Test</div>
      </GraphProvider>
    );

    expect(graph.getCell('element1')).toBe(cell);

    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(1);
      expect(currentElements).toHaveLength(1);
    });

    act(() => {
      graph.addCell(new dia.Element({ id: 'element2', type: 'standard.Rectangle' }));
    });

    await waitFor(() => {
      expect(graph.getCell('element2')).toBeDefined();
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements).toHaveLength(2);
    });

    // its external graph, so we do not destroy it
    unmount();
    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements).toHaveLength(2);
    });
  });

  it('should use store provided by PaperOptions', async () => {
    const graph = new dia.Graph();
    const store = createStore({ graph });
    const cell = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    graph.addCell(cell);
    let currentElements: GraphElement[] = [];
    // eslint-disable-next-line sonarjs/no-identical-functions
    function Elements() {
      const elements = useElements();
      currentElements = elements;
      return null;
    }

    const { unmount } = render(
      <GraphProvider store={store}>
        <Elements />
        <div>Test</div>
      </GraphProvider>
    );

    expect(graph.getCell('element1')).toBe(cell);

    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(1);
      expect(currentElements).toHaveLength(1);
    });

    act(() => {
      graph.addCell(new dia.Element({ id: 'element2', type: 'standard.Rectangle' }));
    });

    await waitFor(() => {
      expect(graph.getCell('element2')).toBeDefined();
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements).toHaveLength(2);
    });

    // its external graph, so we do not destroy it
    unmount();
    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements).toHaveLength(2);
    });
  });
});
