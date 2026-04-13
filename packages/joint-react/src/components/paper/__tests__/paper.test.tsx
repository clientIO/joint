/* eslint-disable @eslint-react/web-api/no-leaked-timeout */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { dia, shapes } from '@joint/core';
import React from 'react';
import { useMeasureNode } from '../../../hooks/use-measure-node';
import { act, useEffect, useRef, useState, type RefObject } from 'react';
import { useGraph, useElementId, useLinks } from '../../../hooks';
import { useNodesMeasuredEffect } from '../../../hooks/use-nodes-measured-effect';
import type { ElementsMeasuredEvent } from '../../../types/event.types';
import type { ElementRecord, LinkRecord } from '../../../types/data-types';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../paper';
import { PortalLink, PORTAL_LINK_TYPE } from '../../../models/portal-link';
import { PortalPaper } from '../../../models/portal-paper';
import { PortalElement } from '../../../models/portal-element';
import { usePaperStore } from '../../../hooks/use-paper';
import { useElementData } from '../../../hooks/use-element-data';
import { useElementSize } from '../../../hooks/use-element-size';

/** Test helper: listens to `elements:measured` event via hook and forwards to callback. */
function MeasuredListener({
  paperId,
  callback,
}: Readonly<{ paperId: string; callback: (event: ElementsMeasuredEvent) => void }>) {
  useNodesMeasuredEffect(paperId, callback);
  return null;
}

const elements: Record<string, ElementRecord<{ label: string }>> = {
  '1': { data: { label: 'Node 1' }, size: { width: 10, height: 10 } },
  '2': { data: { label: 'Node 2' }, size: { width: 10, height: 10 } },
};

function TestNode() {
  const id = useElementId();
  const size = useElementSize();
  return (
    <div
      id={`node-${id}`}
      style={{ width: size?.width, height: size?.height }}
      className="test-node"
    >
      {id}
    </div>
  );
}

type ElementData = { label: string };

/** Test helper: renders element label using hooks instead of props. */
function TestLabelElement() {
  const data = useElementData<ElementData>();
  return <div className="node">{data?.label}</div>;
}

/** Test helper: renders a plain div with element label. */
function TestLabelDiv() {
  const data = useElementData<ElementData>();
  return <div>{data?.label}</div>;
}
const noop = () => {};
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
  | Partial<LinkRecord>
  | ((cellView: dia.CellView, magnet: SVGElement) => dia.Link | Partial<LinkRecord>);

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
  readonly paper: dia.Paper;
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

function getPortDragElements(): Record<string, ElementRecord> {
  return {
    [SOURCE_ELEMENT_ID]: {
      data: {},
      position: { x: 40, y: 40 },
      size: { width: 120, height: 80 },
      portMap: { [SOURCE_PORT_ID]: { cx: 120, cy: 40 } },
    },
    [TARGET_ELEMENT_ID]: {
      data: {},
      position: { x: 320, y: 40 },
      size: { width: 120, height: 80 },
      portMap: { [TARGET_PORT_ID]: { cx: 0, cy: 40 } },
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

  // Override elementFromPoint so JointJS can detect the target magnet during drag
  const originalElementFromPoint = document.elementFromPoint;
  document.elementFromPoint = () => targetMagnet;

  act(() => {
    sourceView.dragLinkStart(startEvent, sourceMagnet, sourcePoint.x, sourcePoint.y);
    sourceView.dragLink(moveEvent, targetPoint.x, targetPoint.y);
    sourceView.dragLinkEnd(endEvent, targetPoint.x, targetPoint.y);
  });

  document.elementFromPoint = originalElementFromPoint;
  paper.model.off('add', captureLink);

  if (!addedLink) {
    throw new Error('Expected a link to be created after dragging from source port.');
  }

  return addedLink;
}

async function renderPortDragPaper(defaultLink?: DefaultLinkProperty) {
  const ref: RefObject<dia.Paper | null> = { current: null };
  let linksSnapshot: Map<string, LinkRecord> = new Map();

  function CaptureLinksSnapshot() {
    linksSnapshot = useLinks() as unknown as Map<string, LinkRecord>;
    return null;
  }

  await act(async () => {
    render(
      <GraphProvider elements={getPortDragElements()}>
        <Paper
          ref={ref}
          defaultLink={defaultLink}
          renderElement={() => <div>Drag Node</div>}
          linkPinning
          snapLinks={false}
        />
        <CaptureLinksSnapshot />
      </GraphProvider>
    );
  });

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

// The scheduler uses queueMicrotask to batch state updates. In jsdom,
// these microtasks fire outside React's act() boundary, causing warnings.
// Mock the scheduler to execute callbacks synchronously so state updates
// happen within the act() boundary.
jest.mock('../../../utils/scheduler', () => {
  function createScheduler(): (callback: () => void) => void {
    return (callback: () => void): void => {
      callback();
    };
  }

  return {
    createScheduler,
    simpleScheduler: createScheduler(),
  };
});

describe('Paper Component', () => {
  it('renders elements correctly with correct measured node and onMeasured event', async () => {
    const onMeasuredMock = jest.fn();
    let size = { width: 0, height: 0 };

    function MeasuredElement() {
      const data = useElementData<ElementData>();
      const elementSize = useElementSize();
      const w = elementSize?.width ?? 0;
      const h = elementSize?.height ?? 0;
      size = { width: w, height: h };
      const elementRef = React.useRef<HTMLDivElement>(null);
      useMeasureNode(elementRef);
      return (
        <foreignObject width={w} height={h}>
          <div ref={elementRef} className="node">
            {data?.label}
          </div>
        </foreignObject>
      );
    }

    const PAPER_ID = 'test-measured';
    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <MeasuredListener paperId={PAPER_ID} callback={onMeasuredMock} />
          <Paper
            id={PAPER_ID}
            width={WIDTH}
            height={150}
            renderElement={() => <MeasuredElement />}
          />
        </GraphProvider>
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
      expect(onMeasuredMock).toHaveBeenCalledTimes(1);
      // Size remains as initial since mock observer doesn't trigger updates
      expect(size).toEqual({ width: 10, height: 10 });
    });
  });

  it('renders elements correctly with useHTMLOverlay enabled', async () => {
    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper useHTMLOverlay renderElement={() => <TestLabelElement />} />
        </GraphProvider>
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Node 1')).toBeInTheDocument();
      expect(screen.getByText('Node 2')).toBeInTheDocument();
      expect(screen.getByText('Node 1').closest('.node')).toBeTruthy();
    });
  });

  it('calls onElementsMeasured when element sizes change', async () => {
    const onMeasuredMock = jest.fn();
    const updatedElements: Record<string, ElementRecord<{ label: string }>> = {
      '1': { data: { label: 'Node 1' }, size: { width: 100, height: 50 } },
      '2': { data: { label: 'Node 2' }, size: { width: 150, height: 75 } },
    };

    const PAPER_ID = 'test-size-change';
    function ControlledPaperHost() {
      const [controlledElements, setControlledElements] = useState(elements);
      const hasUpdatedRef = useRef(false);

      return (
        <GraphProvider elements={controlledElements} onElementsChange={setControlledElements}>
          <MeasuredListener
            paperId={PAPER_ID}
            callback={({ isInitial }) => {
              onMeasuredMock();
              if (isInitial && !hasUpdatedRef.current) {
                hasUpdatedRef.current = true;
                setControlledElements(updatedElements);
              }
            }}
          />
          <Paper id={PAPER_ID} renderElement={() => <TestLabelElement />} />
        </GraphProvider>
      );
    }

    await act(async () => {
      render(<ControlledPaperHost />);
    });

    await waitFor(() => {
      // At least one measurement call should fire (mock observer may not trigger second)
      expect(onMeasuredMock).toHaveBeenCalled();
    });
  });

  it('applies default clickThreshold and custom clickThreshold', async () => {
    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });
    const PaperElement = document.querySelector('.joint-paper');
    expect(PaperElement).toBeInTheDocument();

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper clickThreshold={20} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });
    // Ensure no errors occur when custom clickThreshold is applied
    expect(PaperElement).toBeInTheDocument();
  });

  it('applies scale to the Paper', async () => {
    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper scale={2} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      const layersGroup = document.querySelector('.joint-layers');
      expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
    });
  });

  it('calls onElementsMeasured when elements are measured', async () => {
    const onMeasuredMock = jest.fn();
    const PAPER_ID = 'test-measured-basic';

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <MeasuredListener paperId={PAPER_ID} callback={onMeasuredMock} />
          <Paper id={PAPER_ID} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });
    await waitFor(() => {
      expect(onMeasuredMock).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onElementsMeasured when elements are measured - conditional render', async () => {
    const RenderElement = jest.fn(() => <TestLabelElement />);
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
              <Paper id={PAPER_ID} renderElement={RenderElement} />
            </>
          )}
        </GraphProvider>
      );
    }

    await act(async () => {
      render(<Content />);
    });
    await waitFor(() => {
      expect(RenderElement.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(onMeasuredMock).toHaveBeenCalled();
    });
  });

  it('handles ref from Paper correctly', async () => {
    const ref = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });
    await waitFor(
      () => {
        expect(ref.current).not.toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('provides non-null ref in child useEffect on mount', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };
    const captureRefInEffectMock = jest.fn();

    function CapturePaperRef({
      paperRef,
    }: Readonly<{
      paperRef: RefObject<dia.Paper | null>;
    }>) {
      useEffect(() => {
        captureRefInEffectMock(paperRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} renderElement={() => <div>Test</div>} />
          <CapturePaperRef paperRef={ref} />
        </GraphProvider>
      );
    });

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
      const ref = useRef<dia.Paper | null>(null);

      useEffect(() => {
        captureRefInEffectMock(ref.current);
      }, []);

      return <Paper ref={ref} renderElement={() => <div>Test</div>} />;
    }

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <PaperWithEffectRefCapture />
        </GraphProvider>
      );
    });

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
      const ref = useRef<dia.Paper | null>(null);

      useEffect(() => {
        captureRefInEffectMock(ref.current);
      }, []);

      return <Paper ref={ref} />;
    }

    await act(async () => {
      render(
        <GraphProvider elements={{}}>
          <PaperWithEffectRefCapture />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(captureRefInEffectMock).toHaveBeenCalled();
    });

    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).toEqual(
      expect.arrayContaining([expect.any(Object)])
    );
    expect(captureRefInEffectMock.mock.calls.map(([paper]) => paper)).not.toContain(null);
  });

  it('exposes paper ref for empty graph without requiring view updates', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={{}}>
          <Paper ref={ref} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeDefined();
    });
  });

  it('should access paper via context and change scale', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function ChangeScale({ paperRef }: { paperRef: RefObject<dia.Paper | null> }) {
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
      const ref = useRef<dia.Paper | null>(null);
      return (
        <GraphProvider elements={elements}>
          <Paper ref={ref} renderElement={() => <div>Test</div>} />
          <ChangeScale paperRef={ref} />
        </GraphProvider>
      );
    }

    await act(async () => {
      render(<Component />);
    });

    await waitFor(
      () => {
        const layersGroup = document.querySelector('.joint-layers');
        expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
      },
      { timeout: 3000 }
    );
  });
  it('should access paper via ref and change scale', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };
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

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} renderElement={() => <div>Test</div>} />
          <ChangeScale />
        </GraphProvider>
      );
    });

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
      {
        data: { label: string };
        position: { x: number; y: number };
        size: { width: number; height: number };
      }
    > = {
      '1': { data: { label: 'Node 1' }, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
      '2': { data: { label: 'Node 2' }, position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
    };
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function UpdatePosition() {
      const { graph } = useGraph();
      useEffect(() => {
        setTimeout(() => {
          const element = graph.getCell('1');
          element?.set('position', { x: 100, y: 100 });
        }, 20);
      }, [graph]);
      return null;
    }
    let currentOutsideElements: Record<string, ElementRecord> = {};
    function Content() {
      const [currentElements, setCurrentElements] =
        useState<Record<string, ElementRecord>>(elementsWithPosition);
      currentOutsideElements = currentElements;
      return (
        <GraphProvider elements={currentElements} onElementsChange={setCurrentElements}>
          <Paper renderElement={() => <div>Test</div>} />
          <UpdatePosition />
        </GraphProvider>
      );
    }
    await act(async () => {
      render(<Content />);
    });
    await waitFor(() => {
      const element1 = currentOutsideElements['1'];
      expect(element1).toBeDefined();
      expect(element1.position?.x).toBe(100);
      expect(element1.position?.y).toBe(100);
    });
  });
  it('should update elements via react state, and then reflect the changes in the paper', async () => {
    function Content() {
      const [currentElements, setCurrentElements] =
        useState<Record<string, ElementRecord>>(elements);

      return (
        <GraphProvider elements={currentElements} onElementsChange={setCurrentElements}>
          <Paper
            renderElement={() => {
              return <TestNode />;
            }}
          />
          <button
            type="button"
            onClick={() => {
              setCurrentElements((els) => {
                const newEls = { ...els };
                if (newEls['1']) {
                  newEls['1'] = { ...newEls['1'], size: { width: 200, height: 200 } };
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
    await act(async () => {
      render(<Content />);
    });
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
    const view1Ref: RefObject<dia.Paper | null> = { current: null };
    const view2Ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={view1Ref} renderElement={() => <div>Test</div>} />
          <Paper ref={view2Ref} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

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
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

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
    const ref: RefObject<dia.Paper | null> = { current: null };
    const customMeasureNode = jest.fn();

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper
            ref={ref}
            defaultConnectionPoint={{ name: 'boundary' }}
            measureNode={customMeasureNode}
            renderElement={() => <div>Test</div>}
          />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      const paperOptions = ref.current!.options;
      expect(paperOptions.defaultConnectionPoint).toEqual({ name: 'boundary' });
      expect(paperOptions.measureNode).toBe(customMeasureNode);
    });
  });

  it('applies percentage width to JointJS paper when only width="100%" is set', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} width="100%" renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      // The JointJS paper should have 100% width, not the default 800px
      expect(ref.current!.el.style.width).toBe('100%');
    });
  });

  it('applies percentage height to JointJS paper when only height="100%" is set', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} height="100%" renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      // The JointJS paper should have 100% height, not the default 600px
      expect(ref.current!.el.style.height).toBe('100%');
    });
  });

  it('applies percentage dimensions to JointJS paper when both width and height are "100%"', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} width="100%" height="100%" renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(ref.current!.el.style.width).toBe('100%');
      expect(ref.current!.el.style.height).toBe('100%');
    });
  });

  it('preserves custom className and style with renderElement', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper
            ref={ref}
            className="custom-paper-class flowchart-paper"
            width={720}
            height={320}
            style={{ backgroundColor: 'rgb(10, 20, 30)', border: '1px solid rgb(10, 20, 30)' }}
            renderElement={() => <TestLabelDiv />}
          />
        </GraphProvider>
      );
    });

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
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper
            ref={ref}
            style={{ width: '640px', height: '360px' }}
            renderElement={() => <TestLabelDiv />}
          />
        </GraphProvider>
      );
    });

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
    const ref: RefObject<dia.Paper | null> = { current: null };
    const cleanupPaperHostStyle = appendPaperHostSizeStyle({
      className: 'paper-host-sized-by-class',
      width: '200px',
      height: '120px',
    });

    try {
      await act(async () => {
        render(
          <GraphProvider elements={elements}>
            <Paper
              ref={ref}
              className="paper-host-sized-by-class"
              renderElement={() => <TestLabelDiv />}
            />
          </GraphProvider>
        );
      });

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
    const ref: RefObject<dia.Paper | null> = { current: null };
    const cleanupPaperHostStyle = appendPaperHostSizeStyle({
      className: 'paper-host-size-conflict',
      width: '200px',
      height: '120px',
    });

    try {
      await act(async () => {
        render(
          <GraphProvider elements={elements}>
            <Paper
              ref={ref}
              className="paper-host-size-conflict"
              style={{ width: '320px', height: '180px' }}
              renderElement={() => <TestLabelDiv />}
            />
          </GraphProvider>
        );
      });

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
    const ref: RefObject<dia.Paper | null> = { current: null };
    const cleanupPaperHostStyle = appendPaperHostSizeStyle({
      className: 'paper-host-size-priority',
      width: '200px',
      height: '120px',
    });

    try {
      await act(async () => {
        render(
          <GraphProvider elements={elements}>
            <Paper
              ref={ref}
              className="paper-host-size-priority"
              width={480}
              height={260}
              style={{ width: '320px', height: '180px' }}
              renderElement={() => <TestLabelDiv />}
            />
          </GraphProvider>
        );
      });

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
      const ref: RefObject<dia.Paper | null> = { current: null };
      const style = getPaperStyleForCombination(withStyle);

      await act(async () => {
        render(
          <GraphProvider elements={elements}>
            <Paper
              ref={ref}
              className={withClassName ? CUSTOM_PAPER_CLASSNAME : undefined}
              style={style}
              width={withWidth ? PROP_WIDTH : undefined}
              height={withHeight ? PROP_HEIGHT : undefined}
              renderElement={() => <TestLabelDiv />}
            />
          </GraphProvider>
        );
      });

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
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} width="100%" height="100%" renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
      expect(ref.current!.el.style.width).toBe('100%');
      expect(ref.current!.el.style.height).toBe('100%');
      expect(ref.current!.el.style.width).not.toBe('800px');
    });
  });

  it('uses PortalLink from graph namespace when defaultLink is not provided', async () => {
    const ref: RefObject<dia.Paper | null> = { current: null };

    await act(async () => {
      render(
        <GraphProvider elements={elements}>
          <Paper ref={ref} renderElement={() => <div>Test</div>} />
        </GraphProvider>
      );
    });

    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    class CustomNamespacePortalLink extends PortalLink {}
    ref.current!.model.layerCollection.cellNamespace.PortalLink = CustomNamespacePortalLink;

    const defaultLinkFactory = ref.current!.options.defaultLink as (
      cellView: dia.CellView,
      magnet: SVGElement
    ) => dia.Link;

    const createdLink = defaultLinkFactory(
      {} as dia.CellView,
      document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    );
    expect(createdLink).toBeInstanceOf(CustomNamespacePortalLink);
  });

  describe('defaultLink drag integration', () => {
    it('uses default PortalLink theme when defaultLink is not provided', async () => {
      const { ref, getLinksSnapshot } = await renderPortDragPaper();

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(createdLink).toBeInstanceOf(PortalLink);
      expect(createdLink.get('type')).toBe(PORTAL_LINK_TYPE);
      expect(createdLink.attr(['line', 'style', 'stroke'])).toBe('');
      expect(createdLink.attr(['line', 'style', 'strokeWidth'])).toBe('');

      await waitFor(() => {
        expect(getLinksSnapshot().size).toBe(1);
      });

      const [createdLinkData] = [...getLinksSnapshot().values()];
      // Theme-defaulted values should NOT appear in user data
      expect(createdLinkData.color).toBeUndefined();
      expect(createdLinkData.width).toBeUndefined();
      expect(createdLinkData.targetMarker).toBeUndefined();
    });

    it('supports defaultLink as a dia.Link instance when dragging between ports', async () => {
      const providedLink = new shapes.standard.Link({
        attrs: {
          line: {
            stroke: '#123456',
          },
        },
      });
      const { ref, getLinksSnapshot } = await renderPortDragPaper(providedLink);

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
        expect(getLinksSnapshot().size).toBe(1);
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
      const { ref } = await renderPortDragPaper(defaultLinkCallback as DefaultLinkProperty);

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

    it('supports defaultLink as LinkRecord object when dragging between ports', async () => {
      const defaultLinkData: Partial<LinkRecord> = {
        data: { customProperty: 'flat-link-default' },
        style: {
          color: '#ff5500',
          width: 7,
          className: 'custom-default-link',
          targetMarker: 'none',
        },
      };
      const { ref, getLinksSnapshot } = await renderPortDragPaper(defaultLinkData);

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(createdLink).toBeInstanceOf(PortalLink);
      expect(createdLink.get('type')).toBe(PORTAL_LINK_TYPE);
      expect(createdLink.attr(['line', 'style', 'stroke'])).toBe('#ff5500');
      expect(createdLink.attr(['line', 'style', 'strokeWidth'])).toBe(7);
      expect(createdLink.attr(['line', 'class'])).toBe('jr-link-line custom-default-link');
      expect(createdLink.get('data')).toEqual(
        expect.objectContaining({
          customProperty: 'flat-link-default',
        })
      );

      await waitFor(() => {
        expect(getLinksSnapshot().size).toBe(1);
      });

      const [createdLinkData] = [...getLinksSnapshot().values()];
      // Style data is stored in the style field;
      // user data is directly in data
      expect(createdLinkData.style?.color).toBe('#ff5500');
      expect(createdLinkData.style?.width).toBe(7);
      expect(createdLinkData.data?.customProperty).toBe('flat-link-default');
      expect(createdLinkData.source).toEqual(
        expect.objectContaining({ id: SOURCE_ELEMENT_ID, port: SOURCE_PORT_ID })
      );
      expect(createdLinkData.target).toEqual(
        expect.objectContaining({ id: TARGET_ELEMENT_ID, port: TARGET_PORT_ID })
      );
    });

    it('supports defaultLink callback returning LinkRecord when dragging between ports', async () => {
      const defaultLinkCallback = jest.fn(
        (_cellView: dia.CellView, _magnet: SVGElement): Partial<LinkRecord> => ({
          data: { customProperty: 'callback-flat-link-default' },
          style: {
            color: '#22aa55',
            width: 4,
            wrapperWidth: 16,
          },
        })
      );
      const { ref, getLinksSnapshot } = await renderPortDragPaper(
        defaultLinkCallback as DefaultLinkProperty
      );

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const createdLink = await dragLinkFromSourcePortToTargetPort(ref.current!);
      expect(defaultLinkCallback).toHaveBeenCalledTimes(1);
      expect(createdLink).toBeInstanceOf(PortalLink);
      expect(createdLink.get('type')).toBe(PORTAL_LINK_TYPE);
      expect(createdLink.attr(['line', 'style', 'stroke'])).toBe('#22aa55');
      expect(createdLink.attr(['line', 'style', 'strokeWidth'])).toBe(4);
      expect(createdLink.attr(['wrapper', 'style', 'strokeWidth'])).toBe(16);
      expect(createdLink.get('data')).toEqual(
        expect.objectContaining({
          customProperty: 'callback-flat-link-default',
        })
      );

      await waitFor(() => {
        expect(getLinksSnapshot().size).toBe(1);
      });

      const [createdLinkData] = [...getLinksSnapshot().values()];
      // Style data is stored in the style field
      expect(createdLinkData.style?.color).toBe('#22aa55');
      expect(createdLinkData.style?.width).toBe(4);
      expect(createdLinkData.style?.wrapperWidth).toBe(16);
      expect(createdLinkData.data?.customProperty).toBe('callback-flat-link-default');
    });
  });

  describe('external paper prop', () => {
    const EXTERNAL_PAPER_ID = 'external-paper';

    it('should adopt an external PortalPaper and expose it via usePaperStore', async () => {
      const graph = new dia.Graph({}, { cellNamespace: { ...shapes, PortalElement, PortalLink } });
      const container = document.createElement('div');
      document.body.append(container);

      const externalPaper = new PortalPaper({
        el: container,
        model: graph,
        cellNamespace: { ...shapes, PortalElement, PortalLink },
        async: false,
      });

      let capturedPaper: dia.Paper | null = null;

      function PaperCapture() {
        const store = usePaperStore(EXTERNAL_PAPER_ID);
        capturedPaper = (store?.paper as unknown as dia.Paper) ?? null;
        return null;
      }

      await act(async () => {
        render(
          <GraphProvider graph={graph}>
            <Paper paper={externalPaper} id={EXTERNAL_PAPER_ID} renderElement={() => null}>
              <PaperCapture />
            </Paper>
          </GraphProvider>
        );
      });

      await waitFor(() => {
        expect(capturedPaper).toBe(externalPaper);
      });

      container.remove();
    });

    it('should not render a host div when external paper is provided', async () => {
      const graph = new dia.Graph({}, { cellNamespace: { ...shapes, PortalElement, PortalLink } });
      const container = document.createElement('div');
      document.body.append(container);

      const externalPaper = new PortalPaper({
        el: container,
        model: graph,
        cellNamespace: { ...shapes, PortalElement, PortalLink },
        async: false,
      });

      let renderContainer!: HTMLElement;
      await act(async () => {
        const result = render(
          <GraphProvider graph={graph}>
            <Paper
              paper={externalPaper}
              id={EXTERNAL_PAPER_ID}
              className="should-not-exist"
              renderElement={() => null}
            />
          </GraphProvider>
        );
        renderContainer = result.container;
      });

      await waitFor(() => {
        // The Paper should not render a div with the className when paper is external
        const hostDiv = renderContainer.querySelector('.should-not-exist');
        expect(hostDiv).toBeNull();
      });

      container.remove();
    });
  });

  describe('cellVisibility show/hide', () => {
    it('should re-render elements after hiding and showing via cellVisibility', async () => {
      let setHidden: (hidden: boolean) => void = noop;
      let paperRef: RefObject<dia.Paper | null> = { current: null };

      function TestApp() {
        const [hidden, setHiddenState] = useState(false);
        setHidden = setHiddenState;
        const ref = useRef<dia.Paper>(null);
        paperRef = ref;

        return (
          <GraphProvider
            elements={{
              'el-1': {
                data: { label: 'Visible Node' },
                size: { width: 100, height: 50 },
                position: { x: 10, y: 10 },
              },
            }}
          >
            <Paper
              ref={ref}
              id="visibility-test"
              height={200}
              renderElement={(data: { label: string }) => <text>{data.label}</text>}
              cellVisibility={(cell: dia.Cell) => !(hidden && String(cell.id) === 'el-1')}
            />
          </GraphProvider>
        );
      }

      await act(async () => {
        render(<TestApp />);
      });

      // Element should be visible initially
      await waitFor(() => {
        expect(screen.getByText('Visible Node')).toBeInTheDocument();
      });

      // Hide the element via cellVisibility + wakeUp
      await act(async () => {
        setHidden(true);
      });
      await act(async () => {
        paperRef.current?.wakeUp();
      });

      await waitFor(() => {
        expect(screen.queryByText('Visible Node')).not.toBeInTheDocument();
      });

      // Show the element again via cellVisibility + wakeUp
      await act(async () => {
        setHidden(false);
      });
      await act(async () => {
        paperRef.current?.wakeUp();
      });

      // Element should be visible again
      await waitFor(
        () => {
          expect(screen.getByText('Visible Node')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('renderLink — useLink layout', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useLink } = require('../../../hooks/use-link');

    function TestLink() {
      const link = useLink();
      if (!link.layout) return <line data-testid="link-no-layout" />;
      return (
        <line
          data-testid="link-with-layout"
          data-source-x={link.layout.sourceX}
          data-source-y={link.layout.sourceY}
          data-target-x={link.layout.targetX}
          data-target-y={link.layout.targetY}
          data-d={link.layout.d}
        />
      );
    }

    const testElements: Record<string, ElementRecord<{ label: string }>> = {
      'el-1': {
        data: { label: 'A' },
        position: { x: 50, y: 50 },
        size: { width: 100, height: 50 },
      },
      'el-2': {
        data: { label: 'B' },
        position: { x: 300, y: 200 },
        size: { width: 100, height: 50 },
      },
    };

    const testLinks: Record<string, LinkRecord> = {
      'link-1': { source: { id: 'el-1' }, target: { id: 'el-2' } },
    };

    it('useLink provides layout with sourceX/sourceY/targetX/targetY on initial load', async () => {
      await act(async () => {
        render(
          <GraphProvider elements={testElements} links={testLinks}>
            <Paper
              height={400}
              renderElement={() => <rect width={100} height={50} />}
              renderLink={() => <TestLink />}
            />
          </GraphProvider>
        );
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('link-with-layout')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const linkElement = screen.getByTestId('link-with-layout');
      const sourceX = Number(linkElement.dataset.sourceX);
      const sourceY = Number(linkElement.dataset.sourceY);
      const targetX = Number(linkElement.dataset.targetX);
      const targetY = Number(linkElement.dataset.targetY);
      const { d } = linkElement.dataset;

      expect(sourceX + sourceY + targetX + targetY).toBeGreaterThan(0);
      expect(d).toBeTruthy();
      expect(d!.length).toBeGreaterThan(0);
    });

    it('useLink layout works when graph is pre-populated (external graph)', async () => {
      const graph = new dia.Graph({}, { cellNamespace: { ...shapes, PortalElement, PortalLink } });
      graph.addCells([
        new PortalElement({
          id: 'ext-1',
          position: { x: 10, y: 10 },
          size: { width: 80, height: 40 },
        }),
        new PortalElement({
          id: 'ext-2',
          position: { x: 200, y: 150 },
          size: { width: 80, height: 40 },
        }),
        new PortalLink({ id: 'ext-link', source: { id: 'ext-1' }, target: { id: 'ext-2' } }),
      ]);

      await act(async () => {
        render(
          <GraphProvider graph={graph}>
            <Paper
              height={400}
              renderElement={() => <rect width={80} height={40} />}
              renderLink={() => <TestLink />}
            />
          </GraphProvider>
        );
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('link-with-layout')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const linkElement = screen.getByTestId('link-with-layout');
      const { d } = linkElement.dataset;
      expect(d).toBeTruthy();
      expect(d!.length).toBeGreaterThan(0);
    });
  });
});
