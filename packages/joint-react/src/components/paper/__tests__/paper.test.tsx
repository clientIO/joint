/* eslint-disable @eslint-react/web-api/no-leaked-timeout */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { shapes } from '@joint/core';
import type { dia } from '@joint/core';
import React from 'react';
import { useNodeSize } from '../../../hooks/use-node-size';
import { act, useEffect, useRef, useState, type RefObject } from 'react';
import { useGraph, usePaperStoreContext, useCellId, useLinks } from '../../../hooks';
import type { FlatElementData } from '../../../types/element-types';
import type { FlatLinkData } from '../../../types/link-types';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../paper';
import { ReactLink, REACT_LINK_TYPE } from '../../../models/react-link';
import type { ReactPaper } from '../../../models/react-paper';

const elements: Record<string, { label: string; width: number; height: number }> = {
  '1': { label: 'Node 1', width: 10, height: 10 },
  '2': { label: 'Node 2', width: 10, height: 10 },
};

function TestNode({ width, height }: Readonly<{ width?: number; height?: number }>) {
  const id = useCellId();
  return (
    <div id={`node-${id}`} style={{ width, height }} className="test-node">
      {id}
    </div>
  );
}

type Element = (typeof elements)[keyof typeof elements];
const WIDTH = 200;
const SOURCE_ELEMENT_ID = 'source';
const TARGET_ELEMENT_ID = 'target';
const SOURCE_PORT_ID = 'out';
const TARGET_PORT_ID = 'in';

type DefaultLinkProperty =
  | dia.Link
  | Partial<FlatLinkData>
  | ((cellView: dia.CellView, magnet: SVGElement) => dia.Link | Partial<FlatLinkData>);

type PortDragElementView = dia.ElementView & {
  findPortNode: (portId: string, selector?: string) => SVGElement | null;
  dragLinkStart: (event_: dia.Event, magnet: SVGElement, x: number, y: number) => void;
  dragLink: (event_: dia.Event, x: number, y: number) => void;
  dragLinkEnd: (event_: dia.Event, x: number, y: number) => void;
};

function getPortDragElements(): Record<string, FlatElementData> {
  return {
    [SOURCE_ELEMENT_ID]: {
      x: 40,
      y: 40,
      width: 120,
      height: 80,
      ports: [{ id: SOURCE_PORT_ID, cx: 120, cy: 40 }],
    },
    [TARGET_ELEMENT_ID]: {
      x: 320,
      y: 40,
      width: 120,
      height: 80,
      ports: [{ id: TARGET_PORT_ID, cx: 0, cy: 40 }],
    },
  };
}

function getPortAbsolutePosition(element: dia.Element, portId: string) {
  const position = element.position();
  const port = element.getPort(portId);
  const portX = Number((port?.position as { args?: { x?: number } } | undefined)?.args?.x ?? 0);
  const portY = Number((port?.position as { args?: { y?: number } } | undefined)?.args?.y ?? 0);
  return { x: position.x + portX, y: position.y + portY };
}

function createJointPointerEvent(
  type: 'mousedown' | 'mousemove' | 'mouseup',
  target: SVGElement,
  data: Record<string, unknown>
) {
  return { type, target, data } as unknown as dia.Event;
}

async function dragLinkFromSourcePortToTargetPort(paper: dia.Paper): Promise<dia.Link> {
  await waitFor(() => {
    const sourceView = paper.findViewByModel(SOURCE_ELEMENT_ID) as PortDragElementView | null;
    const targetView = paper.findViewByModel(TARGET_ELEMENT_ID) as PortDragElementView | null;
    expect(sourceView).not.toBeNull();
    expect(targetView).not.toBeNull();
    expect(sourceView?.findPortNode(SOURCE_PORT_ID)).not.toBeNull();
    expect(targetView?.findPortNode(TARGET_PORT_ID)).not.toBeNull();
  });

  const sourceView = paper.findViewByModel(SOURCE_ELEMENT_ID) as PortDragElementView;
  const targetView = paper.findViewByModel(TARGET_ELEMENT_ID) as PortDragElementView;
  const sourcePortRoot = sourceView.findPortNode(SOURCE_PORT_ID);
  const targetPortRoot = targetView.findPortNode(TARGET_PORT_ID);
  const sourceMagnet = (sourcePortRoot?.querySelector('[magnet]') as SVGElement | null) ?? sourcePortRoot;
  const targetMagnet = (targetPortRoot?.querySelector('[magnet]') as SVGElement | null) ?? targetPortRoot;

  if (!(sourceMagnet instanceof SVGElement) || !(targetMagnet instanceof SVGElement)) {
    throw new TypeError('Expected both source and target port magnets to exist before dragging.');
  }

  const sourcePoint = getPortAbsolutePosition(sourceView.model as dia.Element, SOURCE_PORT_ID);
  const targetPoint = getPortAbsolutePosition(targetView.model as dia.Element, TARGET_PORT_ID);
  const dragData: Record<string, unknown> = {};
  const startEvent = createJointPointerEvent('mousedown', sourceMagnet, dragData);
  const moveEvent = createJointPointerEvent('mousemove', targetMagnet, dragData);
  const endEvent = createJointPointerEvent('mouseup', targetMagnet, dragData);
  let addedLink: dia.Link | null = null;
  const captureLink = (cell: dia.Cell) => {
    if (!addedLink && cell.isLink()) {
      addedLink = cell as dia.Link;
    }
  };

  paper.model.on('add', captureLink);

  act(() => {
    sourceView.dragLinkStart(startEvent, sourceMagnet, sourcePoint.x, sourcePoint.y);
    sourceView.dragLink(moveEvent, targetPoint.x, targetPoint.y);
    sourceView.dragLinkEnd(endEvent, targetPoint.x, targetPoint.y);
  });
  paper.model.off('add', captureLink);

  if (!addedLink) {
    throw new Error('Expected a link to be created after dragging from source port.');
  }

  return addedLink;
}

function renderPortDragPaper(defaultLink?: DefaultLinkProperty) {
  const ref: RefObject<dia.Paper | null> = { current: null };
  let linksSnapshot: Record<string, FlatLinkData> = {};

  function CaptureLinksSnapshot() {
    linksSnapshot = useLinks();
    return null;
  }

  render(
    <GraphProvider elements={getPortDragElements()}>
      <Paper<FlatElementData>
        ref={ref}
        defaultLink={defaultLink}
        renderElement={() => <div>Drag Node</div>}
      />
      <CaptureLinksSnapshot />
    </GraphProvider>
  );

  return {
    ref,
    getLinksSnapshot() {
      return linksSnapshot;
    },
  };
}

// we need to mock `new ResizeObserver`, to return the size width 50 and height 50 for test purposes
// Mock ResizeObserver to return a size with width 50 and height 50
function mockCleanup() {
  // Empty cleanup function
}
jest.mock('../../../store/create-elements-size-observer', () => {
  const mockAdd = jest.fn(() => mockCleanup);
  return {
    createElementsSizeObserver: jest.fn(() => {
      // Return a mock observer that matches the GraphStoreObserver interface
      return {
        add: mockAdd,
        clean: jest.fn(),
        has: jest.fn(() => false),
      };
    }),
  };
});

if (typeof document.elementFromPoint !== 'function') {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    writable: true,
    value: () => document.body,
  });
}

describe('Paper Component', () => {
  it('renders elements correctly with correct measured node and onMeasured event', async () => {
    const onMeasuredMock = jest.fn();
    let size = { width: 0, height: 0 };

    const renderElement = ({ label, width, height }: Element) => {
      size = { width, height };
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const elementRef = React.useRef<HTMLDivElement>(null);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useNodeSize(elementRef);
      return (
        <foreignObject width={width} height={height}>
          <div ref={elementRef} className="node">
            {label}
          </div>
        </foreignObject>
      );
    };

    render(
      <GraphProvider elements={elements}>
        <Paper
          width={WIDTH}
          height={150}
          onElementsSizeReady={onMeasuredMock}
          renderElement={renderElement}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
      expect(onMeasuredMock).toHaveBeenCalledTimes(1);
      // Size remains as initial since mock observer doesn't trigger updates
      expect(size).toEqual({ width: 10, height: 10 });
    });
  });

  it('renders elements correctly with useHTMLOverlay enabled', async () => {
    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          useHTMLOverlay
          renderElement={({ label }) => {
            return <div className="html-node">{label}</div>;
          }}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
      expect(screen.getByText('Node 1').closest('.html-node')).toBeTruthy();
    });
  });

  it('calls onElementsSizeChange when element sizes change', async () => {
    const onElementsSizeChangeMock = jest.fn();
    const updatedElements: Record<string, { label: string; width: number; height: number }> = {
      '1': { label: 'Node 1', width: 100, height: 50 },
      '2': { label: 'Node 2', width: 150, height: 75 },
    };

    const { rerender } = render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          onElementsSizeChange={onElementsSizeChangeMock}
          renderElement={({ label }) => <div className="node">{label}</div>}
        />
      </GraphProvider>
    );

    // Simulate element size change by rerendering with updated elements
    rerender(
      <GraphProvider elements={updatedElements}>
        <Paper<Element>
          onElementsSizeChange={onElementsSizeChangeMock}
          renderElement={({ label }) => <div className="node">{label}</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(onElementsSizeChangeMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should fire custom event on the Paper', async () => {
    const handleCustomEvent = jest.fn();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function FireEvent() {
      const { paper } = usePaperStoreContext() ?? {};
      useEffect(() => {
        paper?.trigger('MyCustomEventOnClick', { message: 'Hello from custom event!' });
      }, [paper]);
      return null;
    }

    const customEvents = { MyCustomEventOnClick: handleCustomEvent };
    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          customEvents={customEvents}
          renderElement={({ label }) => <div className="node">{label}</div>}
        >
          <FireEvent />
        </Paper>
      </GraphProvider>
    );

    await waitFor(() => {
      expect(handleCustomEvent).toHaveBeenCalledTimes(1);
    });
  });

  it('applies default clickThreshold and custom clickThreshold', () => {
    render(
      <GraphProvider elements={elements}>
        <Paper<Element> renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );
    const PaperElement = document.querySelector('.joint-paper');
    expect(PaperElement).toBeInTheDocument();

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> clickThreshold={20} renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );
    // Ensure no errors occur when custom clickThreshold is applied
    expect(PaperElement).toBeInTheDocument();
  });

  it('applies scale to the Paper', async () => {
    render(
      <GraphProvider elements={elements}>
        <Paper<Element> scale={2} renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );

    await waitFor(() => {
      const layersGroup = document.querySelector('.joint-layers');
      expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
    });
  });

  it('calls onElementsSizeReady when elements are measured', async () => {
    const onElementsSizeReadyMock = jest.fn();
    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          onElementsSizeReady={onElementsSizeReadyMock}
          renderElement={() => <div>Test</div>}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onElementsSizeReadyMock).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onElementsSizeReady when elements are measured - conditional render', async () => {
    const RenderElement = jest.fn(({ label }) => <div className="node">{label}</div>);
    function Content() {
      const [isReady, setIsReady] = useState(false);
      useEffect(() => {
        setTimeout(() => {
          setIsReady(true);
        }, 100);
      }, []);
      return (
        <GraphProvider elements={elements}>
          {isReady && (
            <Paper<Element>
              renderElement={RenderElement}
              onElementsSizeReady={onElementsSizeReadyMock}
            />
          )}
        </GraphProvider>
      );
    }
    const onElementsSizeReadyMock = jest.fn();
    render(<Content />);
    await waitFor(() => {
      expect(RenderElement).toHaveBeenCalledTimes(2); // Called for each element
      expect(onElementsSizeReadyMock).toHaveBeenCalledTimes(1);
    });
  });

  it('handles ref from Paper correctly', async () => {
    const ref = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );
    await waitFor(
      () => {
        expect(ref.current).not.toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('provides non-null ref inside onElementsSizeReady', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const onElementsSizeReadyMock = jest.fn();

    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          ref={ref}
          renderElement={() => <div>Test</div>}
          onElementsSizeReady={({ paper }) => {
            onElementsSizeReadyMock({
              paperFromCallback: paper,
              paperFromRef: ref.current,
            });
          }}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(onElementsSizeReadyMock).toHaveBeenCalledWith({
        paperFromCallback: expect.any(Object),
        paperFromRef: expect.any(Object),
      });
      expect(onElementsSizeReadyMock).toHaveBeenCalledTimes(1);
      expect(onElementsSizeReadyMock.mock.calls[0][0].paperFromRef).toBe(
        onElementsSizeReadyMock.mock.calls[0][0].paperFromCallback
      );
    });
  });

  it('provides non-null ref in child useEffect on mount', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const captureRefInEffectMock = jest.fn();

    function CapturePaperRef({
      paperRef,
    }: Readonly<{
      paperRef: RefObject<ReactPaper | null>;
    }>) {
      useEffect(() => {
        captureRefInEffectMock(paperRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />
        <CapturePaperRef paperRef={ref} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(captureRefInEffectMock).toHaveBeenCalledTimes(1);
      expect(captureRefInEffectMock).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  it('exposes paper ref for empty graph without requiring view updates', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={{}}>
        <Paper ref={ref} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeDefined();
    });
  });

  it('binds paper pointer events for empty graph', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const onBlankPointerClick = jest.fn();

    render(
      <GraphProvider elements={{}}>
        <Paper ref={ref} onBlankPointerClick={onBlankPointerClick} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).toBeDefined();
    });

    act(() => {
      ref.current!.trigger('blank:pointerclick', {}, 0, 0);
    });

    expect(onBlankPointerClick).toHaveBeenCalledTimes(1);
  });

  it('binds onElementPointerClick for empty graph once paper is ready', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const onElementPointerClick = jest.fn();

    render(
      <GraphProvider elements={{}}>
        <Paper ref={ref} onElementPointerClick={onElementPointerClick} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).toBeDefined();
    });

    act(() => {
      ref.current!.trigger('element:pointerclick', null, null, 0, 0);
    });

    expect(onElementPointerClick).toHaveBeenCalledTimes(1);
  });
  it('should access paper via context and change scale', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function ChangeScale({ paperRef }: { paperRef: RefObject<ReactPaper | null> }) {
      useEffect(() => {
        const checkAndScale = () => {
          if (paperRef.current) {
            paperRef.current.scale(2, 2);
          } else {
            setTimeout(checkAndScale, 10);
          }
        };
        const timeoutId = setTimeout(checkAndScale, 0);
        return () => {
          clearTimeout(timeoutId);
        };
      }, [paperRef]);
      return null;
    }

    function Component() {
      const ref = useRef<ReactPaper | null>(null);
      return (
        <GraphProvider elements={elements}>
          <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />
          <ChangeScale paperRef={ref} />
        </GraphProvider>
      );
    }

    render(<Component />);

    await waitFor(
      () => {
        const layersGroup = document.querySelector('.joint-layers');
        expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
      },
      { timeout: 3000 }
    );
  });
  it('should access paper via ref and change scale', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    function ChangeScale() {
      useEffect(() => {
        const checkAndScale = () => {
          if (ref.current) {
            ref.current.scale(2, 2);
          } else {
            setTimeout(checkAndScale, 10);
          }
        };
        const timeoutId = setTimeout(checkAndScale, 0);
        return () => {
          clearTimeout(timeoutId);
        };
      }, []);
      return null;
    }

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />
        <ChangeScale />
      </GraphProvider>
    );

    await waitFor(
      () => {
        expect(ref.current?.scale().sx).toBe(2);
      },
      { timeout: 3000 }
    );
  });

  it('should set elements and positions via react state, when change it via paper api', async () => {
    // Create elements with initial x/y so they can be synced back
    const elementsWithPosition: Record<
      string,
      { label: string; x: number; y: number; width: number; height: number }
    > = {
      '1': { label: 'Node 1', x: 0, y: 0, width: 10, height: 10 },
      '2': { label: 'Node 2', x: 0, y: 0, width: 10, height: 10 },
    };
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function UpdatePosition() {
      const graph = useGraph();
      useEffect(() => {
        setTimeout(() => {
          const element = graph.getCell('1');
          element.set('position', { x: 100, y: 100 });
        }, 20);
      }, [graph]);
      return null;
    }
    let currentOutsideElements: Record<string, Element> = {};
    function Content() {
      const [currentElements, setCurrentElements] =
        useState<Record<string, FlatElementData>>(elementsWithPosition);
      currentOutsideElements = currentElements as Record<string, Element>;
      return (
        <GraphProvider elements={currentElements} onElementsChange={setCurrentElements}>
          <Paper<Element> renderElement={() => <div>Test</div>} />
          <UpdatePosition />
        </GraphProvider>
      );
    }
    render(<Content />);
    await waitFor(() => {
      const element1 = currentOutsideElements['1'];
      expect(element1).toBeDefined();
      // @ts-expect-error we know it's element
      expect(element1.x).toBe(100);
      // @ts-expect-error we know it's element
      expect(element1.y).toBe(100);
    });
  });
  it('should update elements via react state, and then reflect the changes in the paper', async () => {
    function Content() {
      const [currentElements, setCurrentElements] =
        useState<Record<string, FlatElementData>>(elements);

      return (
        <GraphProvider elements={currentElements} onElementsChange={setCurrentElements}>
          <Paper<Element>
            renderElement={({ width, height }) => {
              return <TestNode width={width} height={height} />;
            }}
          />
          <button
            type="button"
            onClick={() => {
              setCurrentElements((els) => {
                const newEls = { ...els };
                if (newEls['1']) {
                  newEls['1'] = { ...newEls['1'], width: 200, height: 200 };
                }
                return newEls;
              });
            }}
          >
            Update Element 1
          </button>
        </GraphProvider>
      );
    }
    render(<Content />);
    const button = screen.getByRole('button', { name: 'Update Element 1' });
    expect(button).toBeInTheDocument();
    act(() => {
      button.click();
    });
    await waitFor(() => {
      const element = document.querySelector('#node-1');
      expect(element).toBeDefined();
      expect(element).toHaveStyle({ width: '200px', height: '200px' });
    });
  });
  it('should test two separate Paper with same paper, and get their data via ref', async () => {
    const view1Ref: RefObject<ReactPaper | null> = { current: null };
    const view2Ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={view1Ref} renderElement={() => <div>Test</div>} />
        <Paper<Element> ref={view2Ref} renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );

    await waitFor(
      () => {
        expect(view1Ref.current).not.toBeNull();
        expect(view2Ref.current).not.toBeNull();
        expect(view1Ref.current).not.toBe(view2Ref.current);
      },
      { timeout: 3000 }
    );
  });

  it('applies default defaultConnectionPoint and measureNode options', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      const paperOptions = ref.current!.options;
      // Default connection point should be a function that dispatches between rectangle and boundary
      expect(typeof paperOptions.defaultConnectionPoint).toBe('function');
      // Default measureNode should be defined
      expect(typeof paperOptions.measureNode).toBe('function');
    });
  });

  it('allows user to override defaultConnectionPoint and measureNode', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const customMeasureNode = jest.fn();

    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          ref={ref}
          defaultConnectionPoint={{ name: 'boundary' }}
          measureNode={customMeasureNode}
          renderElement={() => <div>Test</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      const paperOptions = ref.current!.options;
      expect(paperOptions.defaultConnectionPoint).toEqual({ name: 'boundary' });
      expect(paperOptions.measureNode).toBe(customMeasureNode);
    });
  });

  it('applies percentage width to JointJS paper when only width="100%" is set', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} width="100%" renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      // The JointJS paper should have 100% width, not the default 800px
      expect(ref.current!.el.style.width).toBe('100%');
    });
  });

  it('applies percentage height to JointJS paper when only height="100%" is set', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} height="100%" renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      // The JointJS paper should have 100% height, not the default 600px
      expect(ref.current!.el.style.height).toBe('100%');
    });
  });

  it('applies percentage dimensions to JointJS paper when both width and height are "100%"', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          ref={ref}
          width="100%"
          height="100%"
          renderElement={() => <div>Test</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(ref.current!.el.style.width).toBe('100%');
      expect(ref.current!.el.style.height).toBe('100%');
    });
  });

  it('does not overwrite container percentage width with pixel values from resizePaperContainer', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          ref={ref}
          width="100%"
          height="100%"
          renderElement={() => <div>Test</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      // The paper container div should maintain percentage width
      const paperContainer = ref.current!.el.parentElement;
      expect(paperContainer).not.toBeNull();
      expect(paperContainer!.style.width).not.toBe('800px');
    });
  });

  it('uses ReactLink from graph namespace when defaultLink is not provided', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    class CustomNamespaceReactLink extends ReactLink {}
    ref.current!.model.layerCollection.cellNamespace.ReactLink = CustomNamespaceReactLink;

    const defaultLinkFactory = ref.current!.options.defaultLink as (
      cellView: dia.CellView,
      magnet: SVGElement
    ) => dia.Link;

    const createdLink = defaultLinkFactory(
      {} as dia.CellView,
      document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    );
    expect(createdLink).toBeInstanceOf(CustomNamespaceReactLink);
  });

  describe('defaultLink drag integration', () => {
    it('uses default ReactLink theme when defaultLink is not provided', async () => {
      const { ref, getLinksSnapshot } = renderPortDragPaper();

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(createdLink).toBeInstanceOf(ReactLink);
      expect(createdLink.get('type')).toBe(REACT_LINK_TYPE);
      expect(createdLink.attr(['line', 'stroke'])).toBe('#333333');
      expect(createdLink.attr(['line', 'strokeWidth'])).toBe(2);

      await waitFor(() => {
        expect(Object.keys(getLinksSnapshot())).toHaveLength(1);
      });

      const [createdLinkData] = Object.values(getLinksSnapshot());
      expect(createdLinkData.color).toBe('#333333');
      expect(createdLinkData.width).toBe(2);
      expect(createdLinkData.targetMarker).toBe('none');
    });

    it('supports defaultLink as a dia.Link instance when dragging between ports', async () => {
      const providedLink = new shapes.standard.Link({
        attrs: {
          line: {
            stroke: '#123456',
          },
        },
      });
      const { ref, getLinksSnapshot } = renderPortDragPaper(providedLink);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(createdLink).toBeInstanceOf(shapes.standard.Link);
      expect(createdLink).not.toBe(providedLink);
      expect(createdLink.attr(['line', 'stroke'])).toBe('#123456');
      expect(createdLink.getSourceCell()?.id).toBe(SOURCE_ELEMENT_ID);
      expect(createdLink.getTargetCell()?.id).toBe(TARGET_ELEMENT_ID);
      expect(createdLink.source().port).toBe(SOURCE_PORT_ID);
      expect(createdLink.target().port).toBe(TARGET_PORT_ID);

      await waitFor(() => {
        expect(Object.keys(getLinksSnapshot())).toHaveLength(1);
      });
    });

    it('supports defaultLink as a callback returning a dia.Link when dragging between ports', async () => {
      const defaultLinkCallback = jest.fn(
        (_cellView: dia.CellView, _magnet: SVGElement): dia.Link =>
          new shapes.standard.Link({
            attrs: {
              line: {
                stroke: '#abcdef',
              },
            },
          })
      );
      const { ref } = renderPortDragPaper(defaultLinkCallback as DefaultLinkProperty);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(defaultLinkCallback).toHaveBeenCalledTimes(1);
      const [firstCall] = defaultLinkCallback.mock.calls;
      if (!firstCall) {
        throw new Error('Expected defaultLink callback to be called at least once.');
      }
      const [calledCellView, calledMagnet] = firstCall;
      expect(calledCellView.model.id).toBe(SOURCE_ELEMENT_ID);
      expect(calledMagnet.getAttribute('port')).toBe(SOURCE_PORT_ID);
      expect(createdLink).toBeInstanceOf(shapes.standard.Link);
      expect(createdLink.attr(['line', 'stroke'])).toBe('#abcdef');
      expect(createdLink.getSourceCell()?.id).toBe(SOURCE_ELEMENT_ID);
      expect(createdLink.getTargetCell()?.id).toBe(TARGET_ELEMENT_ID);
    });

    it('supports defaultLink as FlatLinkData object when dragging between ports', async () => {
      const defaultLinkData: Partial<FlatLinkData> = {
        color: '#ff5500',
        width: 7,
        className: 'custom-default-link',
        targetMarker: 'none',
        customProperty: 'flat-link-default',
      };
      const { ref, getLinksSnapshot } = renderPortDragPaper(defaultLinkData);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(createdLink).toBeInstanceOf(ReactLink);
      expect(createdLink.get('type')).toBe(REACT_LINK_TYPE);
      expect(createdLink.attr(['line', 'stroke'])).toBe('#ff5500');
      expect(createdLink.attr(['line', 'strokeWidth'])).toBe(7);
      expect(createdLink.attr(['line', 'class'])).toBe('custom-default-link');
      expect(createdLink.get('data')).toEqual(
        expect.objectContaining({
          color: '#ff5500',
          width: 7,
          customProperty: 'flat-link-default',
        })
      );

      await waitFor(() => {
        expect(Object.keys(getLinksSnapshot())).toHaveLength(1);
      });

      const [createdLinkData] = Object.values(getLinksSnapshot());
      expect(createdLinkData.color).toBe('#ff5500');
      expect(createdLinkData.width).toBe(7);
      expect(createdLinkData.customProperty).toBe('flat-link-default');
      expect(createdLinkData.source).toBe(SOURCE_ELEMENT_ID);
      expect(createdLinkData.target).toBe(TARGET_ELEMENT_ID);
      expect(createdLinkData.sourcePort).toBe(SOURCE_PORT_ID);
      expect(createdLinkData.targetPort).toBe(TARGET_PORT_ID);
    });

    it('supports defaultLink callback returning FlatLinkData when dragging between ports', async () => {
      const defaultLinkCallback = jest.fn(
        (_cellView: dia.CellView, _magnet: SVGElement): Partial<FlatLinkData> => ({
          color: '#22aa55',
          width: 4,
          wrapperBuffer: 16,
          customProperty: 'callback-flat-link-default',
        })
      );
      const { ref, getLinksSnapshot } = renderPortDragPaper(
        defaultLinkCallback as DefaultLinkProperty
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(defaultLinkCallback).toHaveBeenCalledTimes(1);
      expect(createdLink).toBeInstanceOf(ReactLink);
      expect(createdLink.get('type')).toBe(REACT_LINK_TYPE);
      expect(createdLink.attr(['line', 'stroke'])).toBe('#22aa55');
      expect(createdLink.attr(['line', 'strokeWidth'])).toBe(4);
      expect(createdLink.attr(['wrapper', 'strokeWidth'])).toBe(20);
      expect(createdLink.get('data')).toEqual(
        expect.objectContaining({
          wrapperBuffer: 16,
          customProperty: 'callback-flat-link-default',
        })
      );

      await waitFor(() => {
        expect(Object.keys(getLinksSnapshot())).toHaveLength(1);
      });

      const [createdLinkData] = Object.values(getLinksSnapshot());
      expect(createdLinkData.color).toBe('#22aa55');
      expect(createdLinkData.width).toBe(4);
      expect(createdLinkData.wrapperBuffer).toBe(16);
      expect(createdLinkData.customProperty).toBe('callback-flat-link-default');
    });
  });
});
