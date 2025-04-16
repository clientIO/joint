/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, screen, waitFor } from '@testing-library/react';
import { GraphProvider } from '../graph-provider/graph-provider';
import { createElements, type InferElement } from '../../utils/create';
import { Paper } from './paper';
import { MeasuredNode } from '../measured-node/measured-node';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' } },
  { id: '2', data: { label: 'Node 2' } },
]);

type Element = InferElement<typeof initialElements>;
const PAPER_WIDTH = 200;

// we need to mock `new ResizeObserver`, to return the size width 50 and height 50 for test purposes
// Mock ResizeObserver to return a size with width 50 and height 50
jest.mock('../../utils/create-element-size-observer', () => ({
  createElementSizeObserver: jest.fn((element, onResize) => {
    // Simulate a resize event with specific width and height
    onResize({ width: 50, height: 50 });
    // Return a cleanup function that just calls `disconnect` (this is just a placeholder)
    return () => {};
  }),
}));

describe('Paper Component', () => {
  it('renders elements correctly with correct measured node and onElementsMeasured event', async () => {
    const onElementsMeasuredMock = jest.fn();
    let size = { width: 0, height: 0 };
    render(
      <GraphProvider defaultElements={initialElements}>
        <Paper<Element>
          width={PAPER_WIDTH}
          height={150}
          onElementsMeasured={onElementsMeasuredMock}
          renderElement={({ data: { label }, width, height }) => {
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
      expect(onElementsMeasuredMock).toHaveBeenCalledTimes(1);
      expect(size).toEqual({ width: 50, height: 50 });
    });
  });
});
