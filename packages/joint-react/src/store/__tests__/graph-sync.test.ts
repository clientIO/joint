import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE, type GraphStorePublicSnapshot } from '../graph-store';
import { graphSync } from '../graph-sync';
import { createState } from '../../utils/create-state';
import { createElements } from '../../utils/create';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import { syncGraph } from '../../utils/cell/cell-utilities';

jest.mock('../../utils/cell/cell-utilities', () => {
  const actual = jest.requireActual('../../utils/cell/cell-utilities');
  return {
    ...actual,
    syncGraph: jest.fn().mockImplementation(actual.syncGraph),
  };
});

const mockedSyncGraph = syncGraph as jest.Mock;
describe('graphSync', () => {
  beforeEach(() => {
    mockedSyncGraph.mockClear();
  });

  it('should sync dia.graph <-> state effectively', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );
    const elements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);
    const state = createState<GraphStorePublicSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements, links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    // Here we initially sync the graph with the state.
    // State should not be updated yet.
    graphSync({ graph, store: state });
    expect(graph.getElements()).toHaveLength(2);
    expect(state.getSnapshot().elements).toHaveLength(2);
    expect(mockedSyncGraph).toHaveBeenCalledTimes(1);
    expect(mockedSetState).toHaveBeenCalledTimes(0);
    // Here we update state via state API.
    // State should not be updated yet.
    state.setState((previous) => ({
      ...previous,
      elements: [...previous.elements, { id: '3', width: 100, height: 100, type: 'ReactElement' }],
    }));
    expect(graph.getElements()).toHaveLength(3);
    expect(state.getSnapshot().elements).toHaveLength(3);
    expect(mockedSyncGraph).toHaveBeenCalledTimes(2);
    expect(mockedSetState).toHaveBeenCalledTimes(1);

    // Here we update dia.graph itself via dia.graph API.
    // State should be updated now with 1 update call.
    const newElements = [
      ...state.getSnapshot().elements,
      { id: '4', width: 100, height: 100, type: 'ReactElement' },
    ];
    syncGraph({
      graph,
      elements: newElements as Array<dia.Element | GraphElement>,
      links: [],
    });
    expect(graph.getElements()).toHaveLength(4);
    expect(state.getSnapshot().elements).toHaveLength(4);
    expect(mockedSyncGraph).toHaveBeenCalledTimes(3);
    expect(mockedSetState).toHaveBeenCalledTimes(2);
  });

  it('should sync dia.graph <-> state effectively using normal JointJS API', () => {
    const graph = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...DEFAULT_CELL_NAMESPACE,
        },
      }
    );
    const elements = createElements([
      {
        id: '1',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
      {
        id: '2',
        width: 100,
        height: 100,
        type: 'ReactElement',
      },
    ]);
    const state = createState<GraphStorePublicSnapshot<GraphElement, GraphLink>>({
      newState: () => ({ elements, links: [] }),
      name: 'elements',
    });

    // Mock the setState method to be able to test the state updates.
    const mockedSetState = jest.fn().mockImplementation(state.setState);
    state.setState = mockedSetState;

    // Here we initially sync the graph with the state.
    // State should not be updated yet.
    graphSync({ graph, store: state });
    expect(graph.getElements()).toHaveLength(2);
    expect(state.getSnapshot().elements).toHaveLength(2);
    expect(mockedSetState).toHaveBeenCalledTimes(0);

    // Here we update state via state API.
    // State should not be updated yet.
    state.setState((previous) => ({
      ...previous,
      elements: [...previous.elements, { id: '3', width: 100, height: 100, type: 'ReactElement' }],
    }));
    expect(graph.getElements()).toHaveLength(3);
    expect(state.getSnapshot().elements).toHaveLength(3);
    expect(mockedSetState).toHaveBeenCalledTimes(1);

    // Here we update dia.graph itself via normal JointJS API (not syncCells/batch).
    // State should be updated now with 1 update call.
    const newElement = new dia.Element({
      id: '4',
      type: 'ReactElement',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    graph.addCell(newElement);
    expect(graph.getElements()).toHaveLength(4);
    expect(state.getSnapshot().elements).toHaveLength(4);
    expect(mockedSetState).toHaveBeenCalledTimes(2);
  });
});
