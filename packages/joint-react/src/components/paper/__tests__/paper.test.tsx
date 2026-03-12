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
import { useGraph, useCellId, useLinks } from '../../../hooks';
import { useOnElementsMeasured } from '../../../hooks/use-on-elements-measured';
import type { ElementsMeasuredEvent } from '../../../types/event.types';
import type { FlatElementData } from '../../../types/element-types';
import type { FlatLinkData } from '../../../types/link-types';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../paper';
import { ReactLink, REACT_LINK_TYPE } from '../../../models/react-link';
import type { ReactPaper } from '../../../models/react-paper';

/** Test helper: listens to `elements:measured` event via hook and forwards to callback. */
function MeasuredListener({ paperId, callback }: Readonly<{ paperId: string; callback: (event: ElementsMeasuredEvent) => void }>) {
  useOnElementsMeasured(paperId, callback);
  return null;
}

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
const CUSTOM_PAPER_CLASSNAME = 'custom-paper-class flowchart-paper';
const STYLE_WIDTH = '620px';
const STYLE_HEIGHT = '240px';
const PROP_WIDTH = 480;
const PROP_HEIGHT = 180;

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

interface PaperPropsCombination {
  readonly name: string;
  readonly withClassName: boolean;
  readonly withStyle: boolean;
  readonly withWidth: boolean;
  readonly withHeight: boolean;
}

const PAPER_PROPS_COMBINATIONS: readonly PaperPropsCombination[] = Array.from(
  { length: 16 },
  (_, index) => {
    const withClassName = (index & 1) !== 0;
    const withStyle = (index & 2) !== 0;
    const withWidth = (index & 4) !== 0;
    const withHeight = (index & 8) !== 0;
    return {
      name: `class:${withClassName ? 'on' : 'off'} style:${withStyle ? 'on' : 'off'} width:${withWidth ? 'on' : 'off'} height:${withHeight ? 'on' : 'off'}`,
      withClassName,
      withStyle,
      withWidth,
      withHeight,
    };
  }
);

const BASE_COMBINATION_STYLE: React.CSSProperties = {
  width: STYLE_WIDTH,
  height: STYLE_HEIGHT,
  backgroundColor: 'rgb(10, 20, 30)',
  border: '2px solid rgb(5, 6, 7)',
};

function getPaperStyleForCombination(withStyle: boolean): React.CSSProperties | undefined {
  if (!withStyle) {
    return undefined;
  }
  return BASE_COMBINATION_STYLE;
}

function getExpectedDimensionForCombination(options: {
  readonly withDimensionProp: boolean;
  readonly propDimension: number;
  readonly withStyle: boolean;
  readonly styleDimension: string;
}): dia.Paper.Dimension | undefined {
  const { withDimensionProp, propDimension, withStyle, styleDimension } = options;

  if (withDimensionProp) {
    return propDimension;
  }
  if (withStyle) {
    return styleDimension;
  }
  return undefined;
}

function assertPaperDimension(options: {
  readonly paper: ReactPaper;
  readonly expectedDimension: dia.Paper.Dimension | undefined;
  readonly axis: 'width' | 'height';
}) {
  const { paper, expectedDimension, axis } = options;
  const optionDimension = axis === 'width' ? paper.options.width : paper.options.height;
  const elementDimension = paper.el.style[axis];

  expect(optionDimension).toBe(expectedDimension);

  if (expectedDimension == null) {
    return;
  }

  if (typeof expectedDimension === 'number') {
    expect(elementDimension).toBe(`${expectedDimension}px`);
    return;
  }

  expect(elementDimension).toBe(expectedDimension);
}

function assertCustomPaperClasses(paperElement: HTMLElement) {
  expect(paperElement).toHaveClass('custom-paper-class');
  expect(paperElement).toHaveClass('flowchart-paper');
  expect(paperElement).not.toHaveClass('joint-custom-paper-class');
  expect(paperElement).not.toHaveClass('joint-flowchart-paper');
}

function assertCustomPaperStyle(paperElement: HTMLElement) {
  expect(paperElement.style.backgroundColor).toBe('rgb(10, 20, 30)');
  expect(paperElement.style.borderTopWidth).toBe('2px');
}

function appendPaperHostSizeStyle(options: {
  readonly className: string;
  readonly width: string;
  readonly height: string;
}) {
  const { className, width, height } = options;
  const styleElement = document.createElement('style');
  styleElement.textContent = `.${className} { width: ${width}; height: ${height}; }`;
  document.head.append(styleElement);
  return () => {
    styleElement.remove();
  };
}

function getPortDragElements(): Record<string, FlatElementData> {
  return {
    [SOURCE_ELEMENT_ID]: {
      x: 40,
      y: 40,
      width: 120,
      height: 80,
      ports: { [SOURCE_PORT_ID]: { cx: 120, cy: 40 } },
    },
    [TARGET_ELEMENT_ID]: {
      x: 320,
      y: 40,
      width: 120,
      height: 80,
      ports: { [TARGET_PORT_ID]: { cx: 0, cy: 40 } },
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
  const sourceMagnet =
    (sourcePortRoot?.querySelector('[magnet]') as SVGElement | null) ?? sourcePortRoot;
  const targetMagnet =
    (targetPortRoot?.querySelector('[magnet]') as SVGElement | null) ?? targetPortRoot;

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

    const PAPER_ID = 'test-measured';
    render(
      <GraphProvider elements={elements}>
        <MeasuredListener paperId={PAPER_ID} callback={onMeasuredMock} />
        <Paper
          id={PAPER_ID}
          width={WIDTH}
          height={150}
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

  it('calls onElementsMeasured when element sizes change', async () => {
    const onMeasuredMock = jest.fn();
    const updatedElements: Record<string, { label: string; width: number; height: number }> = {
      '1': { label: 'Node 1', width: 100, height: 50 },
      '2': { label: 'Node 2', width: 150, height: 75 },
    };

    const PAPER_ID = 'test-size-change';
    function ControlledPaperHost() {
      const [controlledElements, setControlledElements] = useState(elements);
      const hasUpdatedRef = useRef(false);

      return (
        <GraphProvider elements={controlledElements} onElementsChange={setControlledElements}>
          <MeasuredListener paperId={PAPER_ID} callback={({ isInitial }) => {
            onMeasuredMock();
            if (isInitial && !hasUpdatedRef.current) {
              hasUpdatedRef.current = true;
              setControlledElements(updatedElements);
            }
          }} />
          <Paper<Element>
            id={PAPER_ID}
            renderElement={({ label }) => <div className="node">{label}</div>}
          />
        </GraphProvider>
      );
    }

    render(<ControlledPaperHost />);

    await waitFor(() => {
      // First call: initial measurement, second call: after size change.
      expect(onMeasuredMock).toHaveBeenCalledTimes(2);
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

  it('calls onElementsMeasured when elements are measured', async () => {
    const onMeasuredMock = jest.fn();
    const PAPER_ID = 'test-measured-basic';

    render(
      <GraphProvider elements={elements}>
        <MeasuredListener paperId={PAPER_ID} callback={onMeasuredMock} />
        <Paper<Element>
          id={PAPER_ID}
          renderElement={() => <div>Test</div>}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onMeasuredMock).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onElementsMeasured when elements are measured - conditional render', async () => {
    const RenderElement = jest.fn(({ label }) => <div className="node">{label}</div>);
    const onMeasuredMock = jest.fn();
    const PAPER_ID = 'test-measured-conditional';

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
            <>
              <MeasuredListener paperId={PAPER_ID} callback={onMeasuredMock} />
              <Paper<Element>
                id={PAPER_ID}
                renderElement={RenderElement}
              />
            </>
          )}
        </GraphProvider>
      );
    }

    render(<Content />);
    await waitFor(() => {
      expect(RenderElement.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(onMeasuredMock).toHaveBeenCalled();
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

  it('provides non-null ref inside onElementsMeasured callback', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const onMeasuredMock = jest.fn();
    const PAPER_ID = 'test-measured-ref';

    render(
      <GraphProvider elements={elements}>
        <MeasuredListener paperId={PAPER_ID} callback={() => {
          onMeasuredMock(ref.current);
        }} />
        <Paper<Element>
          id={PAPER_ID}
          ref={ref}
          renderElement={() => <div>Test</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(onMeasuredMock).toHaveBeenCalledTimes(1);
      expect(onMeasuredMock).toHaveBeenCalledWith(expect.any(Object));
      expect(onMeasuredMock.mock.calls[0][0]).not.toBeNull();
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
      expect(captureRefInEffectMock).toHaveBeenCalled();
    });

    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).toEqual(
      expect.arrayContaining([expect.any(Object)])
    );
    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).not.toContain(null);
  });

  it('provides non-null ref in parent useEffect on mount', async () => {
    const captureRefInEffectMock = jest.fn();

    function PaperWithEffectRefCapture() {
      const ref = useRef<ReactPaper | null>(null);

      useEffect(() => {
        captureRefInEffectMock(ref.current);
      }, []);

      return <Paper<Element> ref={ref} renderElement={() => <div>Test</div>} />;
    }

    render(
      <GraphProvider elements={elements}>
        <PaperWithEffectRefCapture />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(captureRefInEffectMock).toHaveBeenCalled();
    });

    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).toEqual(
      expect.arrayContaining([expect.any(Object)])
    );
    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).not.toContain(null);
  });

  it('provides non-null ref in parent useEffect on mount for empty graph', async () => {
    const captureRefInEffectMock = jest.fn();

    function PaperWithEffectRefCapture() {
      const ref = useRef<ReactPaper | null>(null);

      useEffect(() => {
        captureRefInEffectMock(ref.current);
      }, []);

      return <Paper ref={ref} />;
    }

    render(
      <GraphProvider elements={{}}>
        <PaperWithEffectRefCapture />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(captureRefInEffectMock).toHaveBeenCalled();
    });

    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).toEqual(
      expect.arrayContaining([expect.any(Object)])
    );
    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).not.toContain(null);
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

  it('preserves custom className and style with renderElement', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          ref={ref}
          className="custom-paper-class flowchart-paper"
          width={720}
          height={320}
          style={{ backgroundColor: 'rgb(10, 20, 30)', border: '1px solid rgb(10, 20, 30)' }}
          renderElement={({ label }) => <div>{label}</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
    });

    const paperElement = ref.current!.el;

    expect(paperElement).toHaveClass('custom-paper-class');
    expect(paperElement).toHaveClass('flowchart-paper');
    expect(paperElement).toHaveClass('joint-paper');
    expect(paperElement).not.toHaveClass('joint-custom-paper-class');
    expect(paperElement).not.toHaveClass('joint-flowchart-paper');
    expect(paperElement.style.width).toBe('720px');
    expect(paperElement.style.height).toBe('320px');
    expect(paperElement.style.backgroundColor).toBe('rgb(10, 20, 30)');
    expect(paperElement.style.borderTopWidth).toBe('1px');
  });

  it('extracts width and height from style when paper props are not provided', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element>
          ref={ref}
          style={{ width: '640px', height: '360px' }}
          renderElement={({ label }) => <div>{label}</div>}
        />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
    });

    expect(ref.current!.options.width).toBe('640px');
    expect(ref.current!.options.height).toBe('360px');
    expect(ref.current!.el.style.width).toBe('640px');
    expect(ref.current!.el.style.height).toBe('360px');
  });

  it('uses className CSS dimensions when width, height, and style dimensions are omitted', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const cleanupPaperHostStyle = appendPaperHostSizeStyle({
      className: 'paper-host-sized-by-class',
      width: '200px',
      height: '120px',
    });

    try {
      render(
        <GraphProvider elements={elements}>
          <Paper<Element>
            ref={ref}
            className="paper-host-sized-by-class"
            renderElement={({ label }) => <div>{label}</div>}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      expect(ref.current!.options.width).toBeUndefined();
      expect(ref.current!.options.height).toBeUndefined();
      expect(ref.current!.el.style.width).toBe('');
      expect(ref.current!.el.style.height).toBe('');
      expect(getComputedStyle(ref.current!.el).width).toBe('200px');
      expect(getComputedStyle(ref.current!.el).height).toBe('120px');
    } finally {
      cleanupPaperHostStyle();
    }
  });

  it('gives style dimensions precedence over className CSS dimensions', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const cleanupPaperHostStyle = appendPaperHostSizeStyle({
      className: 'paper-host-size-conflict',
      width: '200px',
      height: '120px',
    });

    try {
      render(
        <GraphProvider elements={elements}>
          <Paper<Element>
            ref={ref}
            className="paper-host-size-conflict"
            style={{ width: '320px', height: '180px' }}
            renderElement={({ label }) => <div>{label}</div>}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      expect(ref.current!.options.width).toBe('320px');
      expect(ref.current!.options.height).toBe('180px');
      expect(ref.current!.el.style.width).toBe('320px');
      expect(ref.current!.el.style.height).toBe('180px');
      expect(getComputedStyle(ref.current!.el).width).toBe('320px');
      expect(getComputedStyle(ref.current!.el).height).toBe('180px');
    } finally {
      cleanupPaperHostStyle();
    }
  });

  it('gives width and height props precedence over style and className CSS dimensions', async () => {
    const ref: RefObject<ReactPaper | null> = { current: null };
    const cleanupPaperHostStyle = appendPaperHostSizeStyle({
      className: 'paper-host-size-priority',
      width: '200px',
      height: '120px',
    });

    try {
      render(
        <GraphProvider elements={elements}>
          <Paper<Element>
            ref={ref}
            className="paper-host-size-priority"
            width={480}
            height={260}
            style={{ width: '320px', height: '180px' }}
            renderElement={({ label }) => <div>{label}</div>}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      expect(ref.current!.options.width).toBe(480);
      expect(ref.current!.options.height).toBe(260);
      expect(ref.current!.el.style.width).toBe('480px');
      expect(ref.current!.el.style.height).toBe('260px');
      expect(getComputedStyle(ref.current!.el).width).toBe('480px');
      expect(getComputedStyle(ref.current!.el).height).toBe('260px');
    } finally {
      cleanupPaperHostStyle();
    }
  });

  test.each(PAPER_PROPS_COMBINATIONS)(
    'supports Paper props combination ($name)',
    async ({ withClassName, withStyle, withWidth, withHeight }) => {
      const ref: RefObject<ReactPaper | null> = { current: null };
      const style = getPaperStyleForCombination(withStyle);

      render(
        <GraphProvider elements={elements}>
          <Paper<Element>
            ref={ref}
            className={withClassName ? CUSTOM_PAPER_CLASSNAME : undefined}
            style={style}
            width={withWidth ? PROP_WIDTH : undefined}
            height={withHeight ? PROP_HEIGHT : undefined}
            renderElement={({ label }) => <div>{label}</div>}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
        expect(screen.getByText('Node 1')).toBeInTheDocument();
        expect(screen.getByText('Node 2')).toBeInTheDocument();
      });

      const paper = ref.current!;
      const paperElement = paper.el;
      const expectedWidth = getExpectedDimensionForCombination({
        withDimensionProp: withWidth,
        propDimension: PROP_WIDTH,
        withStyle,
        styleDimension: STYLE_WIDTH,
      });
      const expectedHeight = getExpectedDimensionForCombination({
        withDimensionProp: withHeight,
        propDimension: PROP_HEIGHT,
        withStyle,
        styleDimension: STYLE_HEIGHT,
      });

      assertPaperDimension({ paper, expectedDimension: expectedWidth, axis: 'width' });
      assertPaperDimension({ paper, expectedDimension: expectedHeight, axis: 'height' });

      if (withClassName) {
        assertCustomPaperClasses(paperElement);
      }

      if (withStyle) {
        assertCustomPaperStyle(paperElement);
      }
    }
  );

  it('does not overwrite paper percentage width with pixel values from resizePaperContainer', async () => {
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
      expect(ref.current!.el.style.width).not.toBe('800px');
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
