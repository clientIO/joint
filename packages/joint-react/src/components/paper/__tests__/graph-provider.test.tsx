/* eslint-disable react-perf/jsx-no-new-array-as-prop */
import React, { createRef, useState, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphStoreContext } from '../../../context';
import { GraphStore } from '../../../store';
import { dia, shapes } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import type { GraphElement } from '../../../types/element-types';
import type { GraphLink } from '../../../types/link-types';
import { mapLinkFromGraph } from '../../../utils/cell/cell-utilities';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../../paper/paper';
import type { RenderLink } from '../../paper/paper.types';

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
    const elements = [
      {
        width: 100,
        height: 100,
        id: 'element1',
      },
    ];
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
      <GraphProvider elements={elements} links={[mapLinkFromGraph(link)]}>
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
    const elements = [
      { width: 100, height: 100, id: 'element1' },
      { width: 200, height: 200, id: 'element2' },
    ];
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
    const elements = [
      {
        width: 100,
        height: 100,
        id: 'element1',
        type: 'ReactElement',
      },
    ];
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
      <GraphProvider elements={elements} links={[mapLinkFromGraph(link)]}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });

  it('should update graph in controlled mode', async () => {
    const initialElements = [
      {
        width: 100,
        height: 100,
        id: 'element1',
        type: 'ReactElement',
      },
    ];
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
      const [elements, setElements] = useState<GraphElement[]>(() => initialElements);
      const [links, setLinks] = useState<GraphLink[]>(() => [mapLinkFromGraph(initialLink)]);
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
      setElementsOutside?.([
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
      ]);
    });

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(2);
    });

    // add link
    act(() => {
      setLinksOutside?.([
        mapLinkFromGraph(
          new dia.Link({
            id: 'link2',
            type: 'standard.Link',
            source: { id: 'element1' },
            target: { id: 'element2' },
          })
        ),
        mapLinkFromGraph(
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

  it('should pass correct link data to renderLink function', async () => {
    const elements = [
      {
        id: 'element-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      {
        id: 'element-2',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      },
    ];

    const links: GraphLink[] = [
      {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'ReactLink',
        z: 1,
      },
      {
        id: 'link-2',
        source: 'element-2',
        target: 'element-1',
        type: 'ReactLink',
        z: 2,
        customProperty: 'custom-value',
      },
    ];

    const receivedLinks: GraphLink[] = [];

    function TestComponent() {
      const renderLink: RenderLink = useCallback((link) => {
        receivedLinks.push(link);
        return <g data-testid={`link-${link.id}`} />;
      }, []);

      return (
        <Paper
          width={100}
          height={100}
          renderLink={renderLink}
          // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
          renderElement={() => <rect />}
        />
      );
    }

    render(
      <GraphProvider elements={elements} links={links}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(receivedLinks.length).toBe(2);
    });

    // Verify first link data
    const link1 = receivedLinks.find((link) => link.id === 'link-1');
    expect(link1).toBeDefined();
    expect(link1?.id).toBe('link-1');
    expect(link1?.source).toBe('element-1');
    expect(link1?.target).toBe('element-2');
    expect(link1?.type).toBe('ReactLink');
    expect(link1?.z).toBe(1);

    // Verify second link data
    const link2 = receivedLinks.find((link) => link.id === 'link-2');
    expect(link2).toBeDefined();
    expect(link2?.id).toBe('link-2');
    expect(link2?.source).toBe('element-2');
    expect(link2?.target).toBe('element-1');
    expect(link2?.type).toBe('ReactLink');
    expect(link2?.z).toBe(2);
    expect(link2?.customProperty).toBe('custom-value');
  });

  it('should pass updated link data to renderLink when links change', async () => {
    const elements = [
      {
        id: 'element-1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      {
        id: 'element-2',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      },
    ];

    const initialLinks: GraphLink[] = [
      {
        id: 'link-1',
        source: 'element-1',
        target: 'element-2',
        type: 'ReactLink',
      },
    ];

    const receivedLinks: GraphLink[] = [];

    let setLinksExternal: ((links: GraphLink[]) => void) | null = null;

    function ControlledGraph() {
      const [links, setLinks] = useState<GraphLink[]>(() => initialLinks);
      setLinksExternal = setLinks as unknown as (links: GraphLink[]) => void;

      const renderLink: RenderLink = useCallback((link) => {
        receivedLinks.push(link);
        return <g data-testid={`link-${link.id}`} />;
      }, []);

      return (
        <GraphProvider elements={elements} links={links} onLinksChange={setLinks}>
          <Paper
            width={100}
            height={100}
            renderLink={renderLink}
            // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
            renderElement={() => <rect />}
          />
        </GraphProvider>
      );
    }

    render(<ControlledGraph />);

    await waitFor(() => {
      expect(receivedLinks.length).toBeGreaterThanOrEqual(1);
    });

    const initialLink = receivedLinks.find((link) => link.id === 'link-1');
    expect(initialLink).toBeDefined();
    expect(initialLink?.source).toBe('element-1');
    expect(initialLink?.target).toBe('element-2');

    // Clear received links to track new ones
    receivedLinks.length = 0;

    // Update links
    act(() => {
      setLinksExternal?.([
        {
          id: 'link-2',
          source: 'element-2',
          target: 'element-1',
          type: 'ReactLink',
          customProperty: 'updated-value',
        },
      ]);
    });

    await waitFor(() => {
      expect(receivedLinks.length).toBeGreaterThanOrEqual(1);
    });

    const updatedLink = receivedLinks.find((link) => link.id === 'link-2');
    expect(updatedLink).toBeDefined();
    expect(updatedLink?.id).toBe('link-2');
    expect(updatedLink?.source).toBe('element-2');
    expect(updatedLink?.target).toBe('element-1');
    expect(updatedLink?.customProperty).toBe('updated-value');
  });
});
