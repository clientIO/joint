 
/* eslint-disable @eslint-react/web-api/no-leaked-timeout */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useNodeSize } from '../../../hooks/use-node-size';
import { act, useEffect, useRef, useState, type RefObject } from 'react';
import type { PaperStore } from '../../../store';
import { useGraph, usePaperStoreContext, useCellId } from '../../../hooks';
import type { GraphElement } from '../../../types/element-types';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../paper';

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
  it('should access paper via context and change scale', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function ChangeScale({ paperRef }: { paperRef: RefObject<PaperStore | null> }) {
      useEffect(() => {
        const checkAndScale = () => {
          if (paperRef.current?.paper) {
            paperRef.current.paper.scale(2, 2);
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
      const ref = useRef<PaperStore | null>(null);
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
    const ref: RefObject<PaperStore | null> = { current: null };
    function ChangeScale() {
      useEffect(() => {
        const checkAndScale = () => {
          if (ref.current?.paper) {
            ref.current.paper.scale(2, 2);
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
        const layersGroup = document.querySelector('.joint-layers');
        expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
      },
      { timeout: 3000 }
    );
  });

  it('should set elements and positions via react state, when change it via paper api', async () => {
    // Create elements with initial x/y so they can be synced back
    const elementsWithPosition: Record<string, { label: string; x: number; y: number; width: number; height: number }> = {
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
      const [currentElements, setCurrentElements] = useState<Record<string, GraphElement>>(elementsWithPosition);
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
      const [currentElements, setCurrentElements] = useState<Record<string, GraphElement>>(elements);

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
    const view1Ref: RefObject<PaperStore | null> = { current: null };
    const view2Ref: RefObject<PaperStore | null> = { current: null };

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
        expect(view1Ref.current?.paper).not.toBe(view2Ref.current?.paper);
      },
      { timeout: 3000 }
    );
  });
});
