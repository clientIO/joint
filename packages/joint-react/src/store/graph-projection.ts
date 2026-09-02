import { type dia } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import { graphChanges, type UpdateGraphOptions } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import { writeCellToContainer } from '../state/data-mapping/cell-record-merge';

/**
 * A batch of cell changes reported after each graph update, delivered to the
 * `onIncrementalCellsChange` callback of {@link GraphProviderProps}. Lets you
 * apply just the delta to an external store instead of diffing the whole graph.
 * @template Element - Shape of the element cells stored in the graph.
 * @template Link - Shape of the link cells stored in the graph.
 * @expand
 * @group Types
 */
export interface IncrementalCellsChange<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  /** Cells added since the last commit, keyed by cell id. */
  readonly added: Map<CellId, Element | Link>;
  /** Cells whose attributes changed since the last commit, keyed by cell id. */
  readonly changed: Map<CellId, Element | Link>;
  /** Ids of cells removed since the last commit (including a removed element's links). */
  readonly removed: Set<CellId>;
}
/**
 * Callback type for incremental cell changes. Emitted after each graph change batch
 * @group Types
 */
export type OnIncrementalCellsChange<Element extends ElementJSONInit, Link extends LinkJSONInit> = (
  changes: IncrementalCellsChange<Element, Link>
) => void;

/** Options for {@link graphProjection}. */
interface GraphProjectionState<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> {
  readonly graph: dia.Graph;
  readonly onIncrementalCellsChange?: OnIncrementalCellsChange<Element, Link>;
  readonly onElementsSizeChange?: (id: CellId, size: dia.Size) => void;
}

/* eslint-disable sonarjs/cognitive-complexity -- graph→container projection
   keeps add/change/remove plus connected-link sweeps inline for one-pass perf. */
/**
 * Project a JointJS graph into a reactive cells container, keeping the two in
 * sync. Subscribes to graph changes and mirrors add / change / remove events
 * (including connected-link sweeps) into the container, optionally emitting an
 * incremental change set after each commit.
 * @param options - graph to project plus optional change/size callbacks
 * @returns controller exposing the readonly cells container and sync/update/destroy methods
 */
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

  /** Drop a record and report it removed to the incremental delta. */
  function removeRecord(id: CellId): void {
    cells.delete(id);
    if (trackChanges) removed!.add(id);
  }

  const graphChangesController = graphChanges({
    graph,
    onElementsSizeChange,
    onChanges: ({ changes, isInsideBatch, deferCommit, isReset }) => {
      // Elements removed in this batch — swept once after the loop for link
      // records they may have stranded.
      let removedElementIds: Set<CellId> | undefined;

      for (const [id, change] of changes) {
        const { data, type } = change;
        switch (type) {
          case 'add':
          case 'change': {
            // An entry can outlive its cell: `layout:update` batches hold
            // direct cell references, and a removal (or a remove + re-add of
            // the same id) can land before the entry processes. Writing the
            // entry's detached model would resurrect or overwrite the record
            // with stale state, so always snapshot the graph's CURRENT model
            // — and repair a lingering record when the cell is gone.
            const cell = graph.getCell(id);
            if (!cell) {
              if (cells.has(id)) removeRecord(id);
              continue;
            }
            const isAdd = type === 'add';
            const record = writeCellToContainer(cells, cell);
            if (trackChanges) {
              if (isAdd) added!.set(id, record);
              else changed!.set(id, record);
            }
            // Connected-links sweep is only needed on `change` (an element
            // moved or resized — its links' routes need re-snapshotting).
            // On `add`, the link gets its own change-set entry from JointJS
            // and will be written in this loop without re-ordering issues.
            if (!isAdd && cell.isElement()) {
              for (const link of graph.getConnectedLinks(cell)) {
                writeCellToContainer(cells, link);
              }
            }
            break;
          }
          case 'remove': {
            // Only a graph removal when the cell is actually gone — a paper
            // view-unmount notification (no cell reference) can name a cell
            // the paper merely unmounted, e.g. viewport culling.
            if (graph.getCell(id)) continue;
            removeRecord(id);
            if (data?.isElement()) {
              removedElementIds ??= new Set();
              removedElementIds.add(id);
            }
            break;
          }
        }
      }

      // Connected links normally arrive as their own `remove` entries, but a
      // missed one must not strand a record — the element is already out of
      // the graph adjacency, so `getConnectedLinks` cannot name its links.
      // One pass per removal batch; links the graph still holds are kept.
      if (removedElementIds !== undefined) {
        const elementIds = removedElementIds;
        const referencesRemoved = (end: LinkJSONInit['source']): boolean =>
          typeof end === 'object' && end?.id !== undefined && elementIds.has(end.id);
        // Snapshot ids first — `cells.delete` swap-pops the live array, so
        // deleting while iterating `getAll()` would skip entries.
        const staleLinkIds: CellId[] = [];
        for (const item of cells.getAll()) {
          const { id: linkId, source, target } = item as LinkJSONInit;
          if (linkId === undefined || graph.getCell(linkId)) continue;
          if (referencesRemoved(source) || referencesRemoved(target)) staleLinkIds.push(linkId);
        }
        for (const linkId of staleLinkIds) removeRecord(linkId);
      }

      // A bulk `reset` sends only `add`s for the surviving cells and no per-cell
      // `remove`s, so prune any container cell the reset dropped — otherwise
      // reactive readers (`useCells`) keep counting ghost cells the canvas
      // (rendered from the graph) no longer shows. Same reconciliation the
      // React-driven `updateGraph()` path does below, keyed off the reset's set.
      if (isReset) {
        const survivingIds = new Set<CellId>(changes.keys());
        // Snapshot ids first — `cells.delete` swap-pops the live array, so
        // iterating `getAll()` while deleting would skip entries.
        const staleIds: CellId[] = [];
        for (const item of cells.getAll()) {
          if (item.id !== undefined && !survivingIds.has(item.id)) staleIds.push(item.id);
        }
        for (const staleId of staleIds) removeRecord(staleId);
      }

      // Two commit modes, decided by `deferCommit` (see graph-changes):
      //
      // - Plain batches (interactive drags, `auto-size`, layout) and lone edits
      //   have `deferCommit === false` → commit NOW. Reactive readers and
      //   overlays must follow the element live; deferring here would freeze
      //   them mid-drag and only snap them into place on batch:stop.
      //
      // - Transaction batches (flagged via DEFER_COMMIT_BATCH_OPTION) have
      //   `deferCommit === true` → skip the notify. The container keeps
      //   accumulating and flushes ONCE when the transaction closes, so a burst
      //   of edits (sync or spread across `await`s) becomes a single React
      //   update. `commitChanges` self-guards when nothing is pending.
      if (!deferCommit) cells.commitChanges();

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
/* eslint-enable sonarjs/cognitive-complexity */

/**
 * Controller returned by {@link graphProjection}.
 * @group Types
 */
export type GraphProjection<
  Element extends ElementJSONInit = ElementJSONInit,
  Link extends LinkJSONInit = LinkJSONInit,
> = ReturnType<typeof graphProjection<Element, Link>>;
