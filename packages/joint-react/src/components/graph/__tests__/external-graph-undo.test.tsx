import { act, render, waitFor } from '@testing-library/react';
import { dia } from '@joint/core';
import { GraphProvider, Paper } from '../..';
import { useCell } from '../../../hooks/use-cell';
import { ELEMENT_MODEL_TYPE } from '../../../mvc/element-model';
import { DEFAULT_CELL_NAMESPACE } from '../../../store/graph-store';
import { graphProjection } from '../../../store/graph-projection';
import type { Computed, ElementRecord } from '../../../types/cell.types';

const PAPER_STYLE = { width: 400, height: 400 } as const;

/** Content mounts recorded per cell id — the "did renderElement paint" probe. */
const mounts: string[] = [];

function SubscribingNode() {
  const label = useCell(
    (cell: Computed<ElementRecord<{ readonly label: string }>>) => cell.data.label
  );
  mounts.push(label);
  return <text>{label}</text>;
}
const renderSubscribing = () => <SubscribingNode />;

function elementJSON(id: string, x = 0, y = 0): dia.Cell.JSON {
  return {
    id,
    type: ELEMENT_MODEL_TYPE,
    position: { x, y },
    size: { width: 20, height: 20 },
    data: { label: `label-${id}` },
  };
}

function linkJSON(id: string, source: string, target: string): dia.Cell.JSON {
  return {
    id,
    type: 'standard.Link',
    source: { id: source },
    target: { id: target },
  };
}

function createExternalGraph(): dia.Graph {
  return new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
}

/**
 * CommandManager-style undo of a delete: re-add the removed cells from their
 * stored JSON inside a plain batch — byte-identical to what was removed,
 * which is exactly what makes `mergeCellRecord` hit its identity fast-path
 * if a stale record survived the delete.
 */
function undoDelete(graph: dia.Graph, cells: dia.Cell.JSON[]): void {
  graph.startBatch('undo');
  graph.addCells(cells);
  graph.stopBatch('undo');
}

// Customer scenario (externally-owned graph, imperative mutations, undo via
// CommandManager): delete an element that has a link, then undo. The restored
// element must render its React content again and the restored link must be
// visible — not a positioned-but-empty ghost.
describe('external graph — undo of a delete (element with a link)', () => {
  beforeEach(() => {
    mounts.length = 0;
  });

  it('projection prunes the removed element AND its link from the container', async () => {
    const graph = createExternalGraph();
    const projection = graphProjection({ graph });
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0), linkJSON('l1', 'e1', 'e2')]);
    await act(async () => {}); // flush the scheduler microtask
    projection.syncFromGraph();
    expect(projection.cells.getSize()).toBe(3);

    graph.getCell('e1').remove();
    await act(async () => {});

    // The graph holds one cell; the container must agree — a stale record
    // here turns the undo's re-add into a no-op update.
    expect(graph.getCells().length).toBe(1);
    expect(projection.cells.has('e1')).toBe(false);
    expect(projection.cells.has('l1')).toBe(false);
    expect(projection.cells.getSize()).toBe(1);
    projection.destroy();
  });

  it('a layout:update naming a removed cell must not resurrect its record', async () => {
    // The genesis of the customer's stale records: `layout:update` entries
    // (emitted by `setPaperViews` re-broadcasting view mounts, and by app
    // layout pipelines applying ELK results) are written to the container
    // WITHOUT checking the cell still lives in the graph. A delete that lands
    // between computing such a batch and applying it resurrects the record —
    // and from then on every undo re-add is a "no-op update" that never
    // notifies membership, so the cell never renders again.
    const graph = createExternalGraph();
    const projection = graphProjection({ graph });
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0), linkJSON('l1', 'e1', 'e2')]);
    await act(async () => {});
    projection.syncFromGraph();

    const elementCell = graph.getCell('e1');
    const linkCell = graph.getCell('l1');
    elementCell.remove();
    await act(async () => {});
    expect(projection.cells.getSize()).toBe(1);

    // Apply a stale layout batch that still references the removed cells
    // (their models are detached but alive — exactly what a pending
    // view-mount notification or an in-flight ELK result holds).
    graph.trigger('layout:update', {
      changes: new Map([
        ['e1', { type: 'change', data: elementCell }],
        ['l1', { type: 'change', data: linkCell }],
        ['e2', { type: 'change', data: graph.getCell('e2') }],
      ]),
    });
    await act(async () => {});

    expect(projection.cells.has('e1')).toBe(false);
    expect(projection.cells.has('l1')).toBe(false);
    expect(projection.cells.getSize()).toBe(1);
    projection.destroy();
  });

  it('a delayed entry holding the OLD model cannot overwrite a re-added replacement', async () => {
    // After undo installs a replacement model under the same id, a delayed
    // `layout:update` entry may still reference the old detached model with
    // stale attributes. The projection must snapshot the graph's CURRENT
    // model, never the entry's reference.
    const graph = createExternalGraph();
    const projection = graphProjection({ graph });
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0)]);
    await act(async () => {});
    projection.syncFromGraph();

    const oldModel = graph.getCell('e1');
    oldModel.remove();
    await act(async () => {});

    // Undo-style re-add: a NEW model under the same id, moved elsewhere.
    graph.addCell(elementJSON('e1', 300, 300));
    await act(async () => {});

    graph.trigger('layout:update', {
      changes: new Map([['e1', { type: 'change', data: oldModel }]]),
    });
    await act(async () => {});

    const record = projection.cells.get('e1') as { position?: { x: number; y: number } };
    expect(record?.position).toEqual({ x: 300, y: 300 });
    projection.destroy();
  });

  it('a data-less remove entry for an already-removed cell adds no phantom id to the delta', async () => {
    // The paper's view-unmount notification for a deleted cell arrives in a
    // later `layout:update` batch, after the graph removal already reported
    // the id. Removing "again" must not re-report the id in whatever
    // incremental delta flushes next — consumers mirroring an external store
    // would receive stale removals in unrelated batches.
    const graph = createExternalGraph();
    const deltas: string[][] = [];
    const projection = graphProjection({
      graph,
      onIncrementalCellsChange: ({ removed }) => deltas.push([...removed].map(String)),
    });
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0)]);
    await act(async () => {});
    projection.syncFromGraph();

    graph.getCell('e1').remove();
    await act(async () => {});
    expect(deltas.pop()).toContain('e1');

    // View-unmount re-broadcast for the deleted cell (no data, inside batch),
    // then an unrelated move that flushes the next delta.
    graph.trigger('layout:update', {
      changes: new Map([['e1', { type: 'remove' }]]),
    });
    (graph.getCell('e2') as dia.Element).position(120, 0);
    await act(async () => {});

    const flushed = deltas.flat();
    expect(flushed).not.toContain('e1');
    projection.destroy();
  });

  it('a data-less remove entry for a LIVE cell (view unmount) keeps its record', async () => {
    // Paper view-unmount notifications re-broadcast through `layout:update`
    // carry `{ type: 'remove' }` with no cell reference — and can name a cell
    // the paper merely unmounted (viewport culling) while the graph still
    // holds it. That must never delete the live cell's record.
    const graph = createExternalGraph();
    const projection = graphProjection({ graph });
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0), linkJSON('l1', 'e1', 'e2')]);
    await act(async () => {});
    projection.syncFromGraph();
    expect(projection.cells.getSize()).toBe(3);

    graph.trigger('layout:update', {
      changes: new Map([['e1', { type: 'remove' }]]),
    });
    await act(async () => {});

    expect(projection.cells.has('e1')).toBe(true);
    expect(projection.cells.getSize()).toBe(3);
    projection.destroy();
  });

  it('undo still paints after a stale layout:update raced the delete', async () => {
    // Full customer symptom: stale record present → undo re-adds the
    // byte-identical cell → mergeCellRecord identity fast-path → no version
    // bump, no membership change → renderElement never called, link hidden.
    const graph = createExternalGraph();
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0), linkJSON('l1', 'e1', 'e2')]);

    const { container } = render(
      <GraphProvider graph={graph}>
        <Paper style={PAPER_STYLE} id="undo-race-paper" renderElement={renderSubscribing} />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(container.textContent).toContain('label-e1');
    });

    const elementCell = graph.getCell('e1');
    const linkCell = graph.getCell('l1');
    const removedJSON = [elementCell.toJSON(), linkCell.toJSON()];

    await act(async () => {
      elementCell.remove();
      // The race: a view-mount / layout notification for the removed cells
      // flushes after the remove in the same microtask cascade.
      graph.trigger('layout:update', {
        changes: new Map([
          ['e1', { type: 'change', data: elementCell }],
          ['l1', { type: 'change', data: linkCell }],
        ]),
      });
    });
    await waitFor(() => {
      expect(container.textContent).not.toContain('label-e1');
    });

    mounts.length = 0;
    await act(async () => {
      undoDelete(graph, [removedJSON[0], removedJSON[1]]);
    });

    await waitFor(() => {
      expect(container.textContent).toContain('label-e1');
    });
    expect(mounts).toContain('label-e1');

    await waitFor(() => {
      const linkNode = container.querySelector('[model-id="l1"]') as HTMLElement | null;
      expect(linkNode).not.toBeNull();
      expect(linkNode!.style.visibility).not.toBe('hidden');
    });
  });

  it('re-renders the element and shows the link after delete + undo', async () => {
    const graph = createExternalGraph();
    graph.addCells([elementJSON('e1'), elementJSON('e2', 100, 0), linkJSON('l1', 'e1', 'e2')]);

    const { container } = render(
      <GraphProvider graph={graph}>
        <Paper style={PAPER_STYLE} id="undo-paper" renderElement={renderSubscribing} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(container.textContent).toContain('label-e1');
      expect(container.textContent).toContain('label-e2');
    });

    // Delete the element — JointJS removes its connected link with it.
    const removedJSON = [graph.getCell('e1').toJSON(), graph.getCell('l1').toJSON()];
    await act(async () => {
      graph.getCell('e1').remove();
    });
    await waitFor(() => {
      expect(container.textContent).not.toContain('label-e1');
    });

    // Undo: restore element first, then the link (CommandManager order).
    mounts.length = 0;
    await act(async () => {
      undoDelete(graph, [removedJSON[0], removedJSON[1]]);
    });

    // The restored element paints again…
    await waitFor(() => {
      expect(container.textContent).toContain('label-e1');
    });
    expect(mounts).toContain('label-e1');

    // …and the restored link is visible (not parked hidden forever).
    await waitFor(() => {
      const linkNode = container.querySelector('[model-id="l1"]') as HTMLElement | null;
      expect(linkNode).not.toBeNull();
      expect(linkNode!.style.visibility).not.toBe('hidden');
    });
  });
});
