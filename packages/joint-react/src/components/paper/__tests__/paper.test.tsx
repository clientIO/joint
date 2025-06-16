/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, screen, waitFor } from '@testing-library/react';
import { GraphProvider } from '../../graph-provider/graph-provider';
import { createElements, type InferElement } from '../../../utils/create';
import { Paper } from '../paper';
import { MeasuredNode } from '../../measured-node/measured-node';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import * as stories from '../paper.stories';
import { usePaper } from '../../../hooks';
import { useEffect } from 'react';

const initialElements = createElements([
  { id: '1', label: 'Node 1' },
  { id: '2', label: 'Node 2' },
]);

type Element = InferElement<typeof initialElements>;
const PAPER_WIDTH = 200;

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

runStorybookSnapshot({
  Component: Paper,
  name: 'Paper',
  stories,
});

describe('Paper Component', () => {
  it('renders elements correctly with correct measured node and onMeasured event', async () => {
    const onMeasuredMock = jest.fn();
    let size = { width: 0, height: 0 };
    render(
      <GraphProvider initialElements={initialElements}>
        <Paper<Element>
          width={PAPER_WIDTH}
          height={150}
          onElementsSizeReady={onMeasuredMock}
          renderElement={({ label, width, height }) => {
            size = { width, height };
            return (
              <foreignObject width={width} height={height}>
                <MeasuredNode>
                  <div className="node">{label}</div>
                </MeasuredNode>
              </foreignObject>
            );
          }}
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
      <GraphProvider initialElements={initialElements}>
        <Paper<Element>
          useHTMLOverlay
          renderElement={({ label }) => <div className="html-node">{label}</div>}
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
      <GraphProvider initialElements={initialElements}>
        <Paper<Element>
          onElementsSizeChange={onElementsSizeChangeMock}
          renderElement={({ label }) => <div className="node">{label}</div>}
        />
      </GraphProvider>
    );

    // Simulate element size change by rerendering with updated elements
    rerender(
      <GraphProvider initialElements={updatedElements}>
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

  it('overwrites default paper element with overwriteDefaultPaperElement', () => {
    const customElement = document.createElement('div');
    customElement.className = 'custom-paper-element';
    render(
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> overwriteDefaultPaperElement={() => customElement} />
      </GraphProvider>
    );
    expect(document.querySelector('.custom-paper-element')).toBeInTheDocument();
  });
  it('should fire custom event on the paper', async () => {
    const handleCustomEvent = jest.fn();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    function FireEvent() {
      const paper = usePaper();
      useEffect(() => {
        paper.trigger('MyCustomEventOnClick', { message: 'Hello from custom event!' });
      }, [paper]);
      return null;
    }
    render(
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> onCustomEvent={handleCustomEvent}>
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
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> />
      </GraphProvider>
    );
    const paperElement = document.querySelector('.joint-paper');
    expect(paperElement).toBeInTheDocument();

    render(
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> clickThreshold={20} />
      </GraphProvider>
    );
    // Ensure no errors occur when custom clickThreshold is applied
    expect(paperElement).toBeInTheDocument();
  });

  it('applies scale to the paper', () => {
    render(
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> scale={2} />
      </GraphProvider>
    );
    const layersGroup = document.querySelector('.joint-layers');
    expect(layersGroup).toHaveAttribute('transform', 'matrix(2,0,0,2,0,0)');
  });

  it('uses default elementSelector and custom elementSelector', async () => {
    const customSelector = jest.fn((item) => ({ ...item, custom: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function RenderElement({ custom }: any) {
      return <rect id={custom ? 'isCustom' : 'nope'} width={50} height={50} fill="blue" />;
    }
    render(
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> elementSelector={customSelector} renderElement={RenderElement} />
      </GraphProvider>
    );

    // Ensure the customSelector is called for each element
    expect(customSelector).toHaveBeenCalledTimes(initialElements.length);

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
      <GraphProvider initialElements={initialElements}>
        <Paper<Element> onElementsSizeReady={onElementsSizeReadyMock} />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onElementsSizeReadyMock).toHaveBeenCalledTimes(1);
    });
  });
});
