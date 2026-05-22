/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable jsdoc/require-jsdoc */
import { type dia } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import { graphChanges, type UpdateGraphOptions } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import { writeCellToContainer } from '../state/data-mapping/cell-record-merge';

/** Incremental change set emitted by graphProjection after container commits. */
export interface IncrementalCellsChange<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  readonly added: Map<CellId, Element | Link>;
  readonly changed: Map<CellId, Element | Link>;
  readonly removed: Set<CellId>;
}
/**
 * Callback type for incremental cell changes. Emitted after each graph change batch
 */
export type OnIncrementalCellsChange<Element extends ElementJSONInit, Link extends LinkJSONInit> = (
  changes: IncrementalCellsChange<Element, Link>
) => void;

interface GraphProjectionState<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  readonly graph: dia.Graph;
  readonly onIncrementalCellsChange?: OnIncrementalCellsChange<Element, Link>;
  readonly onElementsSizeChange?: (id: CellId, size: dia.Size) => void;
}

export function graphProjection<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
>(options: GraphProjectionState<Element, Link>) {
  const { graph, onIncrementalCellsChange, onElementsSizeChange } = options;

  const cells = createContainer<Element | Link>();

  const trackChanges = onIncrementalCellsChange !== undefined;
  const added = trackChanges ? new Map<CellId, Element | Link>() : undefined;
  const changed = trackChanges ? new Map<CellId, Element | Link>() : undefined;
  const removed = trackChanges ? new Set<CellId>() : undefined;

  const graphChangesController = graphChanges({
    graph,
    onElementsSizeChange,
    onChanges: ({ changes, isInsideBatch }) => {
      let hasChange = false;

      for (const [id, change] of changes) {
        const { data, type } = change;
        switch (type) {
          case 'add':
          case 'change': {
            const isAdd = type === 'add';
            const record = writeCellToContainer(cells, data);
            if (trackChanges) {
              if (isAdd) added!.set(id, record);
              else changed!.set(id, record);
            }
            hasChange = true;
            // Connected-links sweep is only needed on `change` (an element
            // moved or resized — its links' routes need re-snapshotting).
            // On `add`, the link gets its own change-set entry from JointJS
            // and will be written in this loop without re-ordering issues.
            if (!isAdd && data.isElement()) {
              for (const link of graph.getConnectedLinks(data)) {
                writeCellToContainer(cells, link);
              }
            }
            break;
          }
          case 'remove': {
            if (!data) continue;
            cells.delete(id);
            if (trackChanges) removed!.add(id);
            hasChange = true;
            if (data.isElement()) {
              // Connected links are also removed by JointJS — mirror that.
              for (const link of graph.getConnectedLinks(data)) {
                const linkId = link.id;
                cells.delete(linkId);
                if (trackChanges) removed!.add(linkId);
              }
            }
            break;
          }
        }
      }

      if (hasChange) cells.commitChanges();

      const hasTrackedChanges =
        trackChanges &&
        !isInsideBatch &&
        (added!.size > 0 || changed!.size > 0 || removed!.size > 0);

      if (hasTrackedChanges) {
        onIncrementalCellsChange!({ added: added!, changed: changed!, removed: removed! });
        added!.clear();
        changed!.clear();
        removed!.clear();
      }

      changes.clear();
    },
  });

  /**
   * Populate the cells container from current graph state. Called after
   * initial sync to seed state that was missed because graphChanges skips
   * events with `isUpdateFromReact`.
   */
  function syncFromGraph() {
    for (const cell of graph.getCells()) {
      writeCellToContainer(cells, cell);
    }
    if (cells.getSize() > 0) cells.commitChanges();
  }

  return {
    cells: asReadonlyContainer(cells),
    syncFromGraph,
    updateGraph(update: UpdateGraphOptions<Element, Link>) {
      const { cellIds } = graphChangesController.updateGraph(update);
      if (update.flag !== 'updateFromReact') return;
      if (!update.cells) return;

      let hasChange = false;

      for (const id of cellIds) {
        const cell = graph.getCell(id);
        if (!cell) continue;
        writeCellToContainer(cells, cell);
        hasChange = true;
      }

      // Fast path: if the container size already matches the user's cell
      // count, every container entry is a user cell and the prune scan below
      // would be a no-op — skip the O(n) `getAll()` walk and the `userIds`
      // Set allocation entirely. This is the steady-state path for
      // controlled components that update the same set of cells on every
      // React render.
      if (cells.getSize() > cellIds.length) {
        const userIds = new Set<CellId>(cellIds);
        // Snapshot ids first — `cells.delete` swap-pops the live array, so
        // iterating `cells.getAll()` while deleting would skip the entry
        // that lands in the freed slot.
        const containerIds: CellId[] = [];
        for (const item of cells.getAll()) {
          if (item.id !== undefined) containerIds.push(item.id);
        }
        for (const id of containerIds) {
          if (!userIds.has(id)) {
            cells.delete(id);
            hasChange = true;
          }
        }
      }

      if (hasChange) cells.commitChanges();
    },
    destroy() {
      graphChangesController.destroy();
    },
  };
}

export type GraphProjection<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> = ReturnType<typeof graphProjection<Element, Link>>;
