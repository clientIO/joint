/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React, { createRef, useState, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphStoreContext } from '../../../context';
import { GraphStore, DEFAULT_CELL_NAMESPACE } from '../../../store';
import { dia, shapes } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import type { GraphElement } from '../../../types/element-types';
import type { GraphLink } from '../../../types/link-types';
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
    const elements: Record<string, GraphElement> = {
      'element1': {
        width: 100,
        height: 100,
      },
    };
    const link: GraphLink = { type: 'standard.Link', source: { id: 'element1' }, target: {} };
    let linkCount = 0;
    let elementCount = 0;
    function TestComponent() {
      linkCount = useElements((items) => Object.keys(items).length);
      elementCount = useLinks((items) => {
        return Object.keys(items).length;
      });
      return null;
    }
    render(
      <GraphProvider elements={elements} links={{ 'link1': link }}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });
  it('should add elements and links after initial load and useElements and useLinks should catch them', async () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    let linkCount = 0;
    let elementCount = 0;
    // eslint-disable-next-line sonarjs/no-identical-functions
    function TestComponent() {
      linkCount = useElements((items) => Object.keys(items).length);
      elementCount = useLinks((items) => {
        return Object.keys(items).length;
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

    await act(async () => {
      graph.addCells([
        new dia.Element({ id: 'element1', type: 'standard.Rectangle' }),
        new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } }),
      ]);
    });

    // Allow multiple scheduler ticks to flush
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    }, { timeout: 2000 });
  });

  it('should initialize with default elements', async () => {
    const elements: Record<string, GraphElement> = {
      'element1': { width: 100, height: 100 },
      'element2': { width: 200, height: 200 },
    };
    let elementCount = 0;
    function TestComponent() {
      elementCount = useElements((items) => Object.keys(items).length);
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
    let currentElements: Record<string, GraphElement> = {};
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
      expect(Object.keys(currentElements)).toHaveLength(1);
      expect(graph.getCell('element1')).toBeDefined();
    });

    act(() => {
      graph.addCell(new dia.Element({ id: 'element2', type: 'standard.Rectangle' }));
    });

    await waitFor(() => {
      expect(graph.getCell('element2')).toBeDefined();
      expect(graph.getCells()).toHaveLength(2);
      expect(Object.keys(currentElements)).toHaveLength(2);
    });

    // its external graph, so we do not destroy it
    unmount();
    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(2);
      expect(Object.keys(currentElements)).toHaveLength(2);
    });
  });

  it('should use store provided by PaperOptions', async () => {
    const graph = new dia.Graph();
    const store = new GraphStore({ graph });
    const cell = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    graph.addCell(cell);
    let currentElements: Record<string, GraphElement> = {};
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
      expect(Object.keys(currentElements)).toHaveLength(1);
    });

    act(() => {
      graph.addCell(new dia.Element({ id: 'element2', type: 'standard.Rectangle' }));
    });

    await waitFor(() => {
      expect(graph.getCell('element2')).toBeDefined();
      expect(graph.getCells()).toHaveLength(2);
      expect(Object.keys(currentElements)).toHaveLength(2);
    });

    // its external graph, so we do not destroy it
    unmount();
    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(2);
      expect(Object.keys(currentElements)).toHaveLength(2);
    });
  });

  it('should render graph provider with links and elements - with explicit react type', async () => {
    const elements: Record<string, GraphElement> = {
      'element1': {
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    };
    const link: GraphLink = { type: 'standard.Link', source: { id: 'element1' }, target: {} };
    let linkCount = 0;
    let elementCount = 0;
    // eslint-disable-next-line sonarjs/no-identical-functions
    function TestComponent() {
      linkCount = useElements((items) => Object.keys(items).length);
      elementCount = useLinks((items) => {
        return Object.keys(items).length;
      });
      return null;
    }
    render(
      <GraphProvider elements={elements} links={{ 'link1': link }}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });

  it('should update graph in controlled mode', async () => {
    const initialElements: Record<string, GraphElement> = {
      'element1': {
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    };
    const initialLink: GraphLink = {
      type: 'standard.Link',
      source: { id: 'element1' },
      target: {},
    };
    let linkCount = 0;
    let elementCount = 0;
    function TestComponent() {
      linkCount = useLinks((items) => {
        return Object.keys(items).length;
      });
      elementCount = useElements((items) => {
        return Object.keys(items).length;
      });
      return null;
    }

    let setElementsOutside: ((elements: Record<string, GraphElement>) => void) | null = null;
    let setLinksOutside: ((links: Record<string, GraphLink>) => void) | null = null;

    function Graph() {
      const [elements, setElements] = useState<Record<string, GraphElement>>(() => initialElements);
      const [links, setLinks] = useState<Record<string, GraphLink>>(() => ({
        'link1': initialLink,
      }));
      setElementsOutside = setElements as unknown as (elements: Record<string, GraphElement>) => void;
      setLinksOutside = setLinks as unknown as (links: Record<string, GraphLink>) => void;
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
      setElementsOutside?.({
        'element1': {
          width: 100,
          height: 100,
          type: 'ReactElement',
        },
        'element2': {
          width: 10,
          height: 10,
          type: 'ReactElement',
        },
      });
    });

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(2);
    });

    // add link
    act(() => {
      setLinksOutside?.({
        'link2': {
          type: 'standard.Link',
          source: { id: 'element1' },
          target: { id: 'element2' },
        },
        'link3': {
          type: 'standard.Link',
          source: { id: 'element1' },
          target: { id: 'element2' },
        },
      });
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
    const elements: Record<string, GraphElement> = {
      'element-1': {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      'element-2': {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      },
    };

    const links: Record<string, GraphLink> = {
      'link-1': {
        source: 'element-1',
        target: 'element-2',
        type: 'ReactLink',
        z: 1,
      },
      'link-2': {
        source: 'element-2',
        target: 'element-1',
        type: 'ReactLink',
        z: 2,
        customProperty: 'custom-value',
      },
    };

    const receivedLinks: GraphLink[] = [];

    function TestComponent() {
      const renderLink: RenderLink = useCallback((link) => {
        receivedLinks.push(link);
        return <g data-testid="link" />;
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

    // Verify link data was passed (links no longer have id property)
    const link1 = receivedLinks.find((link) => link.source === 'element-1' && link.target === 'element-2');
    expect(link1).toBeDefined();
    expect(link1?.type).toBe('ReactLink');
    expect(link1?.z).toBe(1);

    const link2 = receivedLinks.find((link) => link.source === 'element-2' && link.target === 'element-1');
    expect(link2).toBeDefined();
    expect(link2?.type).toBe('ReactLink');
    expect(link2?.z).toBe(2);
    expect(link2?.customProperty).toBe('custom-value');
  });

  it('should pass updated link data to renderLink when links change', async () => {
    const elements: Record<string, GraphElement> = {
      'element-1': {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      'element-2': {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      },
    };

    const initialLinks: Record<string, GraphLink> = {
      'link-1': {
        source: 'element-1',
        target: 'element-2',
        type: 'ReactLink',
      },
    };

    const receivedLinks: GraphLink[] = [];

    let setLinksExternal: ((links: Record<string, GraphLink>) => void) | null = null;

    function ControlledGraph() {
      const [links, setLinks] = useState<Record<string, GraphLink>>(() => initialLinks);
      setLinksExternal = setLinks as unknown as (links: Record<string, GraphLink>) => void;

      const renderLink: RenderLink = useCallback((link) => {
        receivedLinks.push(link);
        return <g data-testid="link" />;
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

    // Verify initial link was received
    const initialLink = receivedLinks.find((link) => link.source === 'element-1' && link.target === 'element-2');
    expect(initialLink).toBeDefined();
    expect(initialLink?.type).toBe('ReactLink');

    // Clear received links to track new ones
    receivedLinks.length = 0;

    // Update links
    act(() => {
      setLinksExternal?.({
        'link-2': {
          source: 'element-2',
          target: 'element-1',
          type: 'ReactLink',
          customProperty: 'updated-value',
        },
      });
    });

    await waitFor(() => {
      expect(receivedLinks.length).toBeGreaterThanOrEqual(1);
    });

    // Verify updated link was received
    const updatedLink = receivedLinks.find((link) => link.source === 'element-2' && link.target === 'element-1');
    expect(updatedLink).toBeDefined();
    expect(updatedLink?.type).toBe('ReactLink');
    expect(updatedLink?.customProperty).toBe('updated-value');
  });
});
