/* eslint-disable @eslint-react/web-api/no-leaked-timeout */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createElements, type InferElement } from '../../../utils/create';
import { MeasuredNode } from '../../measured-node/measured-node';
import { act, useEffect, useRef, useState, type RefObject } from 'react';
import type { PaperContext } from '../../../context';
import { useGraph, usePaperContext } from '../../../hooks';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../paper';

const elements = createElements([
  { id: '1', label: 'Node 1', width: 10, height: 10 },
  { id: '2', label: 'Node 2', width: 10, height: 10 },
]);

type Element = InferElement<typeof elements>;
const WIDTH = 200;

// we need to mock `new ResizeObserver`, to return the size width 50 and height 50 for test purposes
// Mock ResizeObserver to return a size with width 50 and height 50
jest.mock('../../../utils/create-element-size-observer', () => ({
  createElementSizeObserver: jest.fn((element, onResize) => {
    // Simulate a resize event with specific width and height
    onResize({ width: 50, height: 50 });
    // Return a cleanup function that just calls `disconnect` (this is just a placeholder)
    return () => {};
  }),
}));

// Mock `useAreElementMeasured` to simulate elements being measured
jest.mock('../../../hooks/use-are-elements-measured', () => ({
  useAreElementMeasured: jest.fn(() => true),
}));

describe('Paper Component', () => {
  it('renders elements correctly with correct measured node and onMeasured event', async () => {
    const onMeasuredMock = jest.fn();
    let size = { width: 0, height: 0 };

    const renderElement = ({ label, width, height }: Element) => {
      size = { width, height };
      return (
        <foreignObject width={width} height={height}>
          <MeasuredNode>
            <div className="node">{label}</div>
          </MeasuredNode>
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
      expect(size).toEqual({ width: 50, height: 50 });
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
    const updatedElements = createElements([
      { id: '1', label: 'Node 1', width: 100, height: 50 },
      { id: '2', label: 'Node 2', width: 150, height: 75 },
    ]);

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
      const { paper } = usePaperContext() ?? {};
      useEffect(() => {
        paper?.trigger('MyCustomEventOnClick', { message: 'Hello from custom event!' });
      }, [paper]);
      return null;
    }

    const customEvents = { MyCustomEventOnClick: handleCustomEvent };
    render(
      <GraphProvider elements={elements}>
        <Paper<Element> customEvents={customEvents}>
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
        <Paper<Element> />
      </GraphProvider>
    );
    const PaperElement = document.querySelector('.joint-paper');
    expect(PaperElement).toBeInTheDocument();

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> clickThreshold={20} />
      </GraphProvider>
    );
    // Ensure no errors occur when custom clickThreshold is applied
    expect(PaperElement).toBeInTheDocument();
  });

  it('applies scale to the Paper', async () => {
    render(
      <GraphProvider elements={elements}>
        <Paper<Element> scale={2} />
      </GraphProvider>
    );

    await waitFor(() => {
      const layersGroup = document.querySelector('.joint-layers');
      expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
    });
  });

  it('uses default elementSelector and custom elementSelector', async () => {
    const customSelector = jest.fn((item) => ({ ...item, custom: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function RenderElement({ custom }: any) {
      return <rect id={custom ? 'isCustom' : 'nope'} width={50} height={50} fill="blue" />;
    }
    render(
      <GraphProvider elements={elements}>
        <Paper<Element> elementSelector={customSelector} renderElement={RenderElement} />
      </GraphProvider>
    );

    await waitFor(() => {
      // Validate that the elements are rendered correctly
      const element = document.querySelector('#isCustom');
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('width', '50');
    });
  });

  it('calls onElementsSizeReady when elements are measured', async () => {
    const onElementsSizeReadyMock = jest.fn();
    render(
      <GraphProvider elements={elements}>
        <Paper<Element> onElementsSizeReady={onElementsSizeReadyMock} />
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

  it('handles ref from Paper correctly', () => {
    const ref = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} />
      </GraphProvider>
    );
    expect(ref.current).not.toBeNull();
  });
  it('should access paper via context and change scale', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function ChangeScale({ paperRef }: { paperRef: RefObject<PaperContext | null> }) {
      useEffect(() => {
        const { paper } = paperRef.current ?? {};
        paper?.scale(2, 2);
      }, [paperRef]);
      return null;
    }

    function Component() {
      const ref = useRef<PaperContext | null>(null);
      return (
        <GraphProvider elements={elements}>
          <Paper<Element> ref={ref} />
          <ChangeScale paperRef={ref} />
        </GraphProvider>
      );
    }

    render(<Component />);

    await waitFor(() => {
      const layersGroup = document.querySelector('.joint-layers');
      expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
    });
  });
  it('should access paper via ref and change scale', async () => {
    const ref: RefObject<PaperContext | null> = { current: null };
    function ChangeScale() {
      const { paper } = ref.current ?? {};
      useEffect(() => {
        paper?.scale(2, 2);
      }, [paper]);
      return null;
    }

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={ref} />
        <ChangeScale />
      </GraphProvider>
    );
  });

  it('should set elements and positions via react state, when change it via paper api', async () => {
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
    let currentOutsideElements: Element[] = [];
    function Content() {
      const [currentElements, setCurrentElements] = useState(elements);
      currentOutsideElements = currentElements;
      return (
        <GraphProvider elements={currentElements} onElementsChange={setCurrentElements}>
          <Paper<Element> />
          <UpdatePosition />
        </GraphProvider>
      );
    }
    render(<Content />);
    await waitFor(() => {
      const element1 = currentOutsideElements.find((element) => element.id === '1');
      expect(element1).toBeDefined();
      // @ts-expect-error we know it's element
      expect(element1.x).toBe(100);
      // @ts-expect-error we know it's element
      expect(element1.y).toBe(100);
    });
  });
  it('should update elements via react state, and then reflect the changes in the paper', async () => {
    function Content() {
      const [currentElements, setCurrentElements] = useState(elements);

      return (
        <GraphProvider elements={currentElements} onElementsChange={setCurrentElements}>
          <Paper<Element>
            renderElement={({ width, height, id }) => {
              return (
                <div id={`node-${id}`} style={{ width, height }} className="test-node">
                  {id}
                </div>
              );
            }}
          />
          <button
            type="button"
            onClick={() => {
              setCurrentElements((els) =>
                els.map((element) =>
                  element.id === '1' ? { ...element, width: 200, height: 200 } : element
                )
              );
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
    const view1Ref: RefObject<PaperContext | null> = { current: null };
    const view2Ref: RefObject<PaperContext | null> = { current: null };

    render(
      <GraphProvider elements={elements}>
        <Paper<Element> ref={view1Ref} />
        <Paper<Element> ref={view2Ref} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(view1Ref.current).not.toBeNull();
      expect(view2Ref.current).not.toBeNull();
      expect(view1Ref.current).not.toBe(view2Ref.current);
      expect(view1Ref.current?.paper).not.toBe(view2Ref.current?.paper);
    });
  });
});
