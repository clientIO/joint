import React, { createRef, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphStoreContext } from '../../../context';
import { GraphStore } from '../../../store';
import { dia, shapes } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import { createElements } from '../../../utils/create';
import type { GraphElement } from '../../../types/element-types';
import type { GraphLink } from '../../../types/link-types';
import { linkFromGraph } from '../../../utils/cell/cell-utilities';
import { GraphProvider } from '../../graph/graph-provider';

describe('graph', () => {
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
    let contextGraph: GraphStore | null = null;
    function TestComponent() {
      contextGraph = React.useContext(GraphStoreContext);
      return null;
    }
    render(
      <GraphProvider>
        <TestComponent />
      </GraphProvider>
    );

    if (!contextGraph) {
      throw new Error('contextGraph is not defined');
    }
    expect(contextGraph).toBeDefined();
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
      linkCount = useElements((items) => items.length);
      elementCount = useLinks((items) => {
        return items.length;
      });
      return null;
    }
    render(
      // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
      <GraphProvider elements={elements} links={[linkFromGraph(link)]}>
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
      linkCount = useElements((items) => items.length);
      elementCount = useLinks((items) => {
        return items.length;
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
      elementCount = useElements((items) => items.length);
      return null;
    }
    render(
      <GraphProvider elements={elements}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(elementCount).toBe(2);
    });
  });

  it('should use provided store and clean up on unmount', () => {
    const mockDestroy = jest.fn();
    const mockStore = new GraphStore({});
    jest.spyOn(mockStore, 'destroy').mockImplementation(mockDestroy);

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
    const graph = new dia.Graph({}, { cellNamespace: shapes });
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

    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(1);
      expect(currentElements).toHaveLength(1);
      expect(graph.getCell('element1')).toBeDefined();
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
    const store = new GraphStore({ graph });
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

  it('should render graph provider with links and elements - with explicit react type', async () => {
    const elements = createElements([
      {
        width: 100,
        height: 100,
        id: 'element1',
        type: 'ReactElement',
      },
    ]);
    const link = new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } });
    let linkCount = 0;
    let elementCount = 0;
    // eslint-disable-next-line sonarjs/no-identical-functions
    function TestComponent() {
      linkCount = useElements((items) => items.length);
      elementCount = useLinks((items) => {
        return items.length;
      });
      return null;
    }
    render(
      // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop
      <GraphProvider elements={elements} links={[linkFromGraph(link)]}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });

  it('should update graph in controlled mode', async () => {
    const initialElements = createElements([
      {
        width: 100,
        height: 100,
        id: 'element1',
        type: 'ReactElement',
      },
    ]);
    const initialLink = new dia.Link({
      id: 'link1',
      type: 'standard.Link',
      source: { id: 'element1' },
    });
    let linkCount = 0;
    let elementCount = 0;
    function TestComponent() {
      linkCount = useLinks((items) => {
        return items.length;
      });
      elementCount = useElements((items) => {
        return items.length;
      });
      return null;
    }

    let setElementsOutside: ((elements: GraphElement[]) => void) | null = null;
    let setLinksOutside: ((links: GraphLink[]) => void) | null = null;

    function Graph() {
      const [elements, setElements] = useState<GraphElement[]>(initialElements);
      const [links, setLinks] = useState<GraphLink[]>([linkFromGraph(initialLink)]);
      setElementsOutside = setElements as unknown as (elements: GraphElement[]) => void;
      setLinksOutside = setLinks as unknown as (links: GraphLink[]) => void;
      return (
        <GraphProvider
          elements={elements}
          onElementsChange={setElements}
          links={links}
          onLinksChange={setLinks}
        >
          <TestComponent />
        </GraphProvider>
      );
    }
    render(<Graph />);

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });

    act(() => {
      setElementsOutside?.(
        createElements([
          {
            width: 100,
            height: 100,
            id: 'element1',
            type: 'ReactElement',
          },
          {
            width: 10,
            height: 10,
            id: 'element2',
            type: 'ReactElement',
          },
        ])
      );
    });

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(2);
    });

    // add link
    act(() => {
      setLinksOutside?.([
        linkFromGraph(
          new dia.Link({
            id: 'link2',
            type: 'standard.Link',
            source: { id: 'element1' },
            target: { id: 'element2' },
          })
        ),
        linkFromGraph(
          new dia.Link({
            id: 'link3',
            type: 'standard.Link',
            source: { id: 'element1' },
            target: { id: 'element2' },
          })
        ),
      ]);
    });

    await waitFor(() => {
      expect(linkCount).toBe(2);
      expect(elementCount).toBe(2);
    });
  });

  it('should pass ref instance to the GraphProvider component', () => {
    // eslint-disable-next-line @eslint-react/no-create-ref
    const graphRef = createRef<GraphStore>();
    render(<GraphProvider ref={graphRef} />);
    expect(graphRef.current).not.toBeNull();
    expect(graphRef.current?.destroy).toBeDefined();
  });
});
