import { render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { useId, useRef } from 'react';
import { act } from 'react';
import { useMeasureNode } from '../../../hooks/use-measure-node';
import { useNodesMeasuredEffect } from '../../../hooks/use-nodes-measured-effect';
import type { FlatElementData } from '../../../types/element-types';
import { GraphProvider } from '../../graph/graph-provider';
import { Paper } from '../paper';

const INITIAL_NODE_WIDTH = 100;
const INITIAL_NODE_HEIGHT = 50;
const MEASURED_NODE_HEIGHT = 30;
const GAP = 20;
const GRID_COLUMNS = 3;

interface AutoLayoutElementData extends FlatElementData {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

type CreateElementsSizeObserverOptions = {
  readonly getLayoutSnapshot: () => { readonly elements: { readonly sizes: Record<string, { width: number; height: number }> } };
  readonly onBatchUpdate: (elements: Record<string, AutoLayoutElementData>) => void;
  readonly onObserveElement: (options: { id: string; isRemoved: boolean; observedElements: number }) => void;
};

jest.mock('../../../store/create-elements-size-observer', () => {
  const actual = jest.requireActual('../../../store/create-elements-size-observer');

  return {
    ...actual,
    createElementsSizeObserver: jest.fn((options: CreateElementsSizeObserverOptions) => {
      const observedIds = new Set<string>();
      let isScheduled = false;

      return {
        add: ({ id }: { readonly id: string }) => {
          observedIds.add(id);
          options.onObserveElement({ id, isRemoved: false, observedElements: observedIds.size });

          if (!isScheduled) {
            isScheduled = true;
            queueMicrotask(() => {
              isScheduled = false;
              const snapshot = options.getLayoutSnapshot();
              const nextElements: Record<string, AutoLayoutElementData> = {};
              for (const observedId of observedIds) {
                const size = snapshot.elements.sizes[observedId];
                if (!size) {
                  continue;
                }
                nextElements[observedId] = {
                  ...size,
                  height: MEASURED_NODE_HEIGHT,
                } as AutoLayoutElementData;
              }
              options.onBatchUpdate(nextElements);
            });
          }

          return () => {
            observedIds.delete(id);
            options.onObserveElement({ id, isRemoved: true, observedElements: observedIds.size });
          };
        },
        clean: () => {
          observedIds.clear();
        },
        has: (id: string) => observedIds.has(id),
      };
    }),
  };
});

const initialElements: Record<string, AutoLayoutElementData> = {
  '1': { label: 'Node 1', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '2': { label: 'Node 2', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '3': { label: 'Node 3', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '4': { label: 'Node 4', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '5': { label: 'Node 5', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '6': { label: 'Node 6', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '7': { label: 'Node 7', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '8': { label: 'Node 8', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
  '9': { label: 'Node 9', width: INITIAL_NODE_WIDTH, height: INITIAL_NODE_HEIGHT },
};

let currentFourthNodeYPositions: number[] = [];

function MeasuredNode({ width, height, label }: Readonly<AutoLayoutElementData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  useMeasureNode(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef}>{label}</div>
    </foreignObject>
  );
}

function renderMeasuredNode(props: AutoLayoutElementData) {
  return <MeasuredNode {...props} />;
}

function handleElementsSizeChange(graph: dia.Graph) {
  const elements = graph.getElements();

  for (const [index, element] of elements.entries()) {
    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    const { width, height } = element.size();
    element.position(column * (width + GAP), row * (height + GAP));
  }

  const fourthNode = graph.getCell('4');
  if (fourthNode?.isElement()) {
    currentFourthNodeYPositions.push(fourthNode.position().y);
  }
}

function AutoLayoutPaper() {
  const paperId = useId();
  useNodesMeasuredEffect(paperId, ({ isInitial, graph }) => {
    if (isInitial) return;
    handleElementsSizeChange(graph);
  });
  return (
    <Paper id={paperId} height={450} renderElement={renderMeasuredNode} />
  );
}

function AutoLayoutTestHost() {
  return (
    <GraphProvider elements={initialElements}>
      <AutoLayoutPaper />
    </GraphProvider>
  );
}

describe('Paper automatic layout', () => {
  it('does not apply an initial stale layout pass before measured sizes are available', async () => {
    const fourthNodeYPositions: number[] = [];
    const expectedRowTwoY = MEASURED_NODE_HEIGHT + GAP;
    currentFourthNodeYPositions = fourthNodeYPositions;

    render(<AutoLayoutTestHost />);

    // Flush microtasks and scheduler (state notifications)
    // Multiple rounds needed: 1) queueMicrotask fires observer, 2) scheduler flushes state via queueMicrotask,
    // 3) React re-renders, 4) useLayoutEffect detects size change
    for (let index = 0; index < 10; index++) {
       
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
    }

    await waitFor(
      () => {
        expect(fourthNodeYPositions.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    expect(fourthNodeYPositions).toEqual([expectedRowTwoY]);
  });
});
