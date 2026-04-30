import { dia } from '@joint/core';
import { DEFAULT_CELL_NAMESPACE } from '../graph-store';
import { graphView } from '../graph-view';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import type { CellRecord, ElementRecord, LinkRecord } from '../../types/cell.types';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function createGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

describe('graphView — incremental remove of element with connected links', () => {
  it('removes connected links from the container when element is removed', async () => {
    const graph = createGraph();
    const incrementalCallback = jest.fn();
    const view = graphView<ElementRecord, LinkRecord>({
      graph,
      onIncrementalChange: incrementalCallback,
    });

    graph.addCells([
      {
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      },
      {
        id: 'b',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 50, y: 0 },
        size: { width: 10, height: 10 },
      },
      {
        id: 'l1',
        type: LINK_MODEL_TYPE,
        source: { id: 'a' },
        target: { id: 'b' },
      },
    ]);
    await flush();
    incrementalCallback.mockClear();

    (graph.getCell('a') as dia.Element).remove();
    await flush();

    expect(view.cells.has('a')).toBe(false);
    expect(view.cells.has('l1')).toBe(false);
    expect(incrementalCallback).toHaveBeenCalled();
    view.destroy();
  });

  it('mirrors connected-link removal via the cells-delete sweep on element remove', async () => {
    // Drive the reset path so the remove arrives via `change-set` with the
    // element + its connected link both present in the same batch. The
    // graph-view's remove branch then walks `getConnectedLinks` to mirror
    // JointJS's connected-link removal explicitly.
    const graph = createGraph();
    const view = graphView<ElementRecord, LinkRecord>({
      graph,
      onIncrementalChange: () => {
        // tracking enabled to exercise the trackChanges branch
      },
    });

    graph.addCells([
      {
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      },
      {
        id: 'b',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 50, y: 0 },
        size: { width: 10, height: 10 },
      },
      {
        id: 'l1',
        type: LINK_MODEL_TYPE,
        source: { id: 'a' },
        target: { id: 'b' },
      },
    ]);
    await flush();

    // Build a synthetic change-set carrying just the element 'a' as a
    // remove. Because the graph still owns the link 'l1' at the moment
    // the LAYOUT_UPDATE_EVENT fires, the for-of over getConnectedLinks
    // walks the link removal branch (lines 221-223).
    const elementA = graph.getCell('a') as dia.Element;
    const layoutChanges = new Map([['a', { type: 'remove' as const, data: elementA }]]);
    graph.trigger('layout:update', { changes: layoutChanges });
    await flush();

    expect(view.cells.has('a')).toBe(false);
    expect(view.cells.has('l1')).toBe(false);
    view.destroy();
  });
});

describe('graphView — updateGraph branch coverage', () => {
  it('returns early when flag is not "updateFromReact"', () => {
    const graph = createGraph();
    const view = graphView({ graph });
    const cells: readonly CellRecord[] = [
      {
        id: 'a',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord,
    ];

    // No flag → updateGraph should call into graphChanges (which still
    // syncs the graph) but skip the local `writeCell` loop. The container
    // therefore stays empty until an event fires.
    view.updateGraph({ cells });
    expect(view.cells.has('a')).toBe(false);
    view.destroy();
  });

  it('handles a missing cell after syncCells (defensive continue)', () => {
    const graph = createGraph();
    const view = graphView({ graph });

    // Inject a stub `getCell` that returns undefined for 'phantom-id'.
    const realGetCell = graph.getCell.bind(graph);
    jest
      .spyOn(graph, 'getCell')
      .mockImplementation(((id: unknown) => {
        if (id === 'phantom-id') return undefined as unknown as dia.Cell;
        return realGetCell(id as Parameters<typeof realGetCell>[0]);
      }) as typeof graph.getCell);

    // Pass a cell whose id will resolve to undefined post-sync. The internal
    // updateGraph result will include the id from cellIds and writeCell will
    // be skipped via the `continue` branch.
    const cells: readonly CellRecord[] = [
      {
        id: 'phantom-id',
        type: ELEMENT_MODEL_TYPE,
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
      } as CellRecord,
    ];

    expect(() => view.updateGraph({ cells, flag: 'updateFromReact' })).not.toThrow();
    expect(view.cells.has('phantom-id')).toBe(false);
    view.destroy();
  });
});
