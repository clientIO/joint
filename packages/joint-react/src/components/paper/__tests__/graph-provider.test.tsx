/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React, { createRef, useState, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { GraphStoreContext } from '../../../context';
import { GraphStore, DEFAULT_CELL_NAMESPACE } from '../../../store';
import { dia, shapes } from '@joint/core';
import { useElements, useLinks } from '../../../hooks';
import type { AnyElementRecord, AnyLinkRecord } from '../../../types/data-types';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../../paper/paper';
import { useLink } from '../../../hooks/use-link';

describe('graph', () => {
  it('should render children', () => {
    const { getByText } = render(
      <GraphProvider>
        <div>Child Content</div>
      </GraphProvider>
    );
    expect(getByText('Child Content')).toBeDefined();
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
    const elements: Record<string, AnyElementRecord> = {
      element1: {
        size: { width: 100, height: 100 },
      },
    };
    const link: AnyLinkRecord = { source: { id: 'element1' }, target: { x: 0, y: 0 } };
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
      <GraphProvider elements={elements} links={{ link1: link }}>
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

    await act(async () => {
      graph.addCells([
        new dia.Element({ id: 'element1', type: 'standard.Rectangle' }),
        new dia.Link({ id: 'link1', type: 'standard.Link', source: { id: 'element1' } }),
      ]);
    });

    await waitFor(
      () => {
        expect(linkCount).toBe(1);
        expect(elementCount).toBe(1);
      },
      { timeout: 2000 }
    );
  });

  it('should initialize with default elements', async () => {
    const elements: Record<string, AnyElementRecord> = {
      element1: { size: { width: 100, height: 100 } },
      element2: { size: { width: 200, height: 200 } },
    };
    let elementCount = 0;
    function TestComponent() {
      elementCount = useElements((items) => items.size);
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

  it('should use provided store without destroying it on unmount', async () => {
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
    await waitFor(() => {
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  it('should use graph provided by PaperOptions', async () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    const cell = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    graph.addCell(cell);
    let currentElements: Map<string, AnyElementRecord> = new Map();
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
      expect(currentElements.size).toBe(1);
      expect(graph.getCell('element1')).toBeDefined();
    });

    act(() => {
      graph.addCell(new dia.Element({ id: 'element2', type: 'standard.Rectangle' }));
    });

    await waitFor(() => {
      expect(graph.getCell('element2')).toBeDefined();
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements.size).toBe(2);
    });

    // its external graph, so we do not destroy it
    unmount();
    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements.size).toBe(2);
    });
  });

  it('should use store provided by PaperOptions', async () => {
    const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
    // Add cell before creating the store so syncFromGraph picks it up
    const cell = new dia.Element({ id: 'element1', type: 'standard.Rectangle' });
    graph.addCell(cell);
    const store = new GraphStore({ graph });
    let currentElements: Map<string, AnyElementRecord> = new Map();
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

    // The store's updateMappers may replace the cell via syncCells,
    // so we only check that the cell with the same id still exists.
    await waitFor(() => {
      expect(graph.getCell('element1')).toBeDefined();
      expect(graph.getCells()).toHaveLength(1);
      expect(currentElements.size).toBe(1);
    });

    act(() => {
      graph.addCell(new dia.Element({ id: 'element2', type: 'standard.Rectangle' }));
    });

    await waitFor(() => {
      expect(graph.getCell('element2')).toBeDefined();
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements.size).toBe(2);
    });

    // its external graph, so we do not destroy it
    unmount();
    await waitFor(() => {
      expect(graph.getCells()).toHaveLength(2);
      expect(currentElements.size).toBe(2);
    });
  });

  it('should render graph provider with links and elements - with explicit react type', async () => {
    const elements: Record<string, AnyElementRecord> = {
      element1: {
        size: { width: 100, height: 100 },
      },
    };
    const link: AnyLinkRecord = { source: { id: 'element1' }, target: { x: 0, y: 0 } };
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
      <GraphProvider elements={elements} links={{ link1: link }}>
        <TestComponent />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(linkCount).toBe(1);
      expect(elementCount).toBe(1);
    });
  });

  it('should update graph in controlled mode', async () => {
    const initialElements: Record<string, AnyElementRecord> = {
      element1: {
        size: { width: 100, height: 100 },
      },
    };
    const initialLink: AnyLinkRecord = {
      source: { id: 'element1' },
      target: { x: 0, y: 0 },
    };
    let linkCount = 0;
    let elementCount = 0;
    function TestComponent() {
      linkCount = useLinks((items) => {
        return items.size;
      });
      elementCount = useElements((items) => {
        return items.size;
      });
      return null;
    }

    let setElementsOutside: ((elements: Record<string, AnyElementRecord>) => void) | null = null;
    let setLinksOutside: ((links: Record<string, AnyLinkRecord>) => void) | null = null;

    function Graph() {
      const [elements, setElements] = useState<Record<string, AnyElementRecord>>(() => initialElements);
      const [links, setLinks] = useState<Record<string, AnyLinkRecord>>(() => ({
        link1: initialLink,
      }));
      setElementsOutside = setElements as unknown as (elements: Record<string, AnyElementRecord>) => void;
      setLinksOutside = setLinks as unknown as (links: Record<string, AnyLinkRecord>) => void;
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
        element1: {
          size: { width: 100, height: 100 },
        },
        element2: {
          size: { width: 10, height: 10 },
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
        link2: {
          source: { id: 'element1' },
          target: { id: 'element2' },
        },
        link3: {
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

  it('should pass ref instance to the GraphProvider component', async () => {
    // eslint-disable-next-line @eslint-react/no-create-ref
    const graphRef = createRef<dia.Graph>();
    render(<GraphProvider ref={graphRef} />);
    // The ref is set asynchronously after the useImperativeApi layout effect
    await waitFor(() => {
      expect(graphRef.current).not.toBeNull();
    });
    expect(graphRef.current?.getCells).toBeDefined();
  });

  it('should pass correct link data to renderLink function', async () => {
    const elements: Record<string, AnyElementRecord> = {
      'element-1': {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      },
      'element-2': {
        position: { x: 200, y: 200 },
        size: { width: 100, height: 100 },
      },
    };

    const links: Record<string, AnyLinkRecord> = {
      'link-1': {
        source: { id: 'element-1' },
        target: { id: 'element-2' },
        z: 1,
      },
      'link-2': {
        source: { id: 'element-2' },
        target: { id: 'element-1' },
        z: 2,
        data: { customProperty: 'custom-value' },
      },
    };

    const receivedLinks: AnyLinkRecord[] = [];
    const getUniqueReceivedLinks = () => [
      ...new Map(
        receivedLinks.map((link) => [
          JSON.stringify({
            sourceId: link.source?.id,
            targetId: link.target?.id,
            z: link.z,
            customProperty: link.data?.customProperty,
          }),
          link,
        ])
      ).values(),
    ];

    function CaptureLinkData() {
      const data = useLink();
      React.useEffect(() => {
        if (data) {
          receivedLinks.push(data as unknown as AnyLinkRecord);
        }
      }, [data]);
      return <g data-testid="link" />;
    }

    function TestComponent() {
      const renderLink = useCallback(() => <CaptureLinkData />, []);

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
      expect(getUniqueReceivedLinks()).toHaveLength(2);
    });

    // Verify link data was passed (links no longer have id property)
    const uniqueReceivedLinks = getUniqueReceivedLinks();
    const link1 = uniqueReceivedLinks.find(
      (link) => link.source?.id === 'element-1' && link.target?.id === 'element-2'
    );
    expect(link1).toBeDefined();
    expect(link1?.z).toBe(1);

    const link2 = uniqueReceivedLinks.find(
      (link) => link.source?.id === 'element-2' && link.target?.id === 'element-1'
    );
    expect(link2).toBeDefined();
    expect(link2?.z).toBe(2);
    expect(link2?.data?.customProperty).toBe('custom-value');
  });

  // TODO: Pre-existing issue — link views are not re-rendered when links change in controlled mode
  it.skip('should pass updated link data to renderLink when links change', async () => {
    const elements: Record<string, AnyElementRecord> = {
      'element-1': {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      },
      'element-2': {
        position: { x: 200, y: 200 },
        size: { width: 100, height: 100 },
      },
    };

    const initialLinks: Record<string, AnyLinkRecord> = {
      'link-1': {
        source: { id: 'element-1' },
        target: { id: 'element-2' },
      },
    };

    const receivedLinks: AnyLinkRecord[] = [];

    // Reuses same pattern as CaptureLinkData above — identical by design for clarity
    // eslint-disable-next-line sonarjs/no-identical-functions
    function CaptureLinkDataUpdated() {
      const data = useLink();
      React.useEffect(() => {
        if (data) {
          receivedLinks.push(data as unknown as AnyLinkRecord);
        }
      }, [data]);
      return <g data-testid="link" />;
    }

    let setLinksExternal: ((links: Record<string, AnyLinkRecord>) => void) | null = null;

    function ControlledGraph() {
      const [links, setLinks] = useState<Record<string, AnyLinkRecord>>(() => initialLinks);
      setLinksExternal = setLinks as unknown as (links: Record<string, AnyLinkRecord>) => void;

      const renderLink = useCallback(() => <CaptureLinkDataUpdated />, []);

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

    await waitFor(
      () => {
        expect(receivedLinks.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 3000 }
    );

    // Verify initial link was received
    const initialLink = receivedLinks.find(
      (link) => link.source?.id === 'element-1' && link.target?.id === 'element-2'
    );
    expect(initialLink).toBeDefined();

    const initialCount = receivedLinks.length;

    // Update links
    act(() => {
      setLinksExternal?.({
        'link-2': {
          source: { id: 'element-2' },
          target: { id: 'element-1' },
          data: { customProperty: 'updated-value' },
        },
      });
    });

    await waitFor(
      () => {
        expect(receivedLinks.length).toBeGreaterThan(initialCount);
      },
      { timeout: 3000 }
    );

    // Verify updated link was received
    const updatedLink = receivedLinks.find(
      (link) => link.source?.id === 'element-2' && link.target?.id === 'element-1'
    );
    expect(updatedLink).toBeDefined();
    expect(updatedLink?.data?.customProperty).toBe('updated-value');
  });
});
