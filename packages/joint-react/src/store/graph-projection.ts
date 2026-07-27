import { type dia } from '@joint/core';
import type { ElementJSONInit, LinkJSONInit, CellId } from '../types/cell.types';
import { graphChanges, type UpdateGraphOptions } from './graph-changes';
import { asReadonlyContainer, createContainer, type ContainerChangeSet } from './state-container';
import { mergeCellRecord, toCellRecord } from '../state/data-mapping/cell-record-merge';

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

  // Pending container change set — accumulates across deferred commits (a
  // transaction batch) and is flushed into the immutable snapshot by
  // `cells.batchSet` whenever `deferCommit` is false. Buckets are kept disjoint
  // (an id lives in exactly one) so `batchSet` never re-adds an existing cell.
  const pendingAdded = new Map<CellId, Element | Link>();
  const pendingChanged = new Map<CellId, Element | Link>();
  const pendingRemoved = new Set<CellId>();

  // Incremental change set for `onIncrementalCellsChange` — a SEPARATE lifecycle
  // from the container set: the container commits live mid-batch (so reactive
  // readers follow a drag), while the incremental callback accumulates until the
  // batch boundary (`!isInsideBatch`) and fires once there.
  const trackChanges = onIncrementalCellsChange !== undefined;
  const added = trackChanges ? new Map<CellId, Element | Link>() : undefined;
  const changed = trackChanges ? new Map<CellId, Element | Link>() : undefined;
  const removed = trackChanges ? new Set<CellId>() : undefined;

  /** Latest staged-or-committed record for `id` (pending wins over committed). */
  function currentRecord(id: CellId): Element | Link | undefined {
    return pendingChanged.get(id) ?? pendingAdded.get(id) ?? cells.get(id);
  }

  /**
   * Merge a graph cell into the pending container set, preserving sub-ref
   * identity. Returns the merged record, or `undefined` when nothing observable
   * changed (the merge returned the previous reference) so callers skip the
   * incremental bookkeeping too — the same "unchanged → no notify" fast path the
   * mutable container had.
   */
  function stageWrite(cell: dia.Cell, isAdd: boolean): Element | Link | undefined {
    const { id } = cell;
    const previous = currentRecord(id);
    const merged = mergeCellRecord<Element, Link>(previous, toCellRecord<Element, Link>(cell));
    if (merged === previous) return undefined;
    pendingRemoved.delete(id);
    if (isAdd || pendingAdded.has(id)) pendingAdded.set(id, merged);
    else pendingChanged.set(id, merged);
    return merged;
  }

  /** Drop a cell from the pending container set (marked removed only if committed). */
  function stageRemove(id: CellId): void {
    pendingAdded.delete(id);
    pendingChanged.delete(id);
    if (cells.has(id)) pendingRemoved.add(id);
  }

  /** Flush the pending container set into the immutable snapshot, then clear it. */
  function flushContainer(): void {
    if (pendingAdded.size === 0 && pendingChanged.size === 0 && pendingRemoved.size === 0) return;
    const changeSet: ContainerChangeSet<Element | Link> = {
      added: pendingAdded,
      changed: pendingChanged,
      removed: pendingRemoved,
    };
    cells.batchSet(changeSet);
    pendingAdded.clear();
    pendingChanged.clear();
    pendingRemoved.clear();
  }

  const graphChangesController = graphChanges({
    graph,
    onElementsSizeChange,
    onChanges: ({ changes, isInsideBatch, deferCommit, isReset }) => {
      for (const [id, change] of changes) {
        const { data, type } = change;
        switch (type) {
          case 'add':
          case 'change': {
            const isAdd = type === 'add';
            stageWrite(data, isAdd);
            if (trackChanges) {
              // Report every primary add/change in the incremental delta using
              // the final staged record — NOT gated on whether this stageWrite
              // observed a change. A cell may have been pre-staged by an earlier
              // connected-links sweep in the same batch (e.g. move a node, then
              // add a link to it), so its own add/change would merge to a no-op
              // here yet must still appear in the delta. This matches the
              // pre-immutable behaviour, which read the record back
              // unconditionally after writing it.
              const staged = currentRecord(id) as Element | Link;
              if (isAdd) added!.set(id, staged);
              else changed!.set(id, staged);
            }
            // Connected-links sweep is only needed on `change` (an element moved
            // or resized — its links' routes need re-snapshotting). Swept links
            // go to the container only, not the incremental callback — matching
            // the previous behaviour.
            if (!isAdd && data.isElement()) {
              for (const link of graph.getConnectedLinks(data)) stageWrite(link, false);
            }
            break;
          }
          case 'remove': {
            if (!data) continue;
            stageRemove(id);
            if (trackChanges) removed!.add(id);
            if (data.isElement()) {
              // Connected links are also removed by JointJS — mirror that.
              for (const link of graph.getConnectedLinks(data)) {
                stageRemove(link.id);
                if (trackChanges) removed!.add(link.id);
              }
            }
            break;
          }
        }
      }

      // A bulk `reset` sends only `add`s for the surviving cells and no per-cell
      // `remove`s, so prune any committed cell the reset dropped — otherwise
      // reactive readers (`useCells`) keep counting ghost cells the canvas
      // (rendered from the graph) no longer shows. Same reconciliation the
      // React-driven `updateGraph()` path does below, keyed off the reset's set.
      if (isReset) {
        const survivingIds = new Set<CellId>(changes.keys());
        for (const item of cells.getSnapshot()) {
          const staleId = item.id;
          if (staleId !== undefined && !survivingIds.has(staleId)) {
            stageRemove(staleId);
            if (trackChanges) removed!.add(staleId);
          }
        }
      }

      // Two commit modes, decided by `deferCommit` (see graph-changes):
      //
      // - Plain batches (interactive drags, `auto-size`, layout) and lone edits
      //   have `deferCommit === false` → flush NOW. Reactive readers and overlays
      //   must follow the element live; deferring here would freeze them mid-drag
      //   and only snap them into place on batch:stop.
      //
      // - Transaction batches (flagged via DEFER_COMMIT_BATCH_OPTION) have
      //   `deferCommit === true` → keep accumulating in `pending*` and flush ONCE
      //   when the transaction closes, so a burst of edits (sync or spread across
      //   `await`s) becomes a single React update. `flushContainer` self-guards
      //   when nothing is pending.
      if (!deferCommit) flushContainer();

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
   * Populate the cells container from current graph state. Called after initial
   * sync to seed state that was missed because graphChanges skips events with
   * `isUpdateFromReact`.
   */
  function syncFromGraph() {
    for (const cell of graph.getCells()) stageWrite(cell, true);
    flushContainer();
  }

  return {
    cells: asReadonlyContainer(cells),
    syncFromGraph,
    updateGraph(update: UpdateGraphOptions<Element, Link>) {
      const { cellIds } = graphChangesController.updateGraph(update);
      if (update.flag !== 'updateFromReact') return;
      if (!update.cells) return;

      // React-origin graph events are ignored by graphChanges (isUpdateFromReact),
      // so sync the container directly from the just-synced cells.
      for (const id of cellIds) {
        const cell = graph.getCell(id);
        if (!cell) continue;
        stageWrite(cell, !cells.has(id) && !pendingAdded.has(id));
      }

      // Fast path: if the post-add container would already match the user's cell
      // count, no committed cell is stale — skip the prune scan and the `userIds`
      // Set allocation. `getSize()` is O(1) and never materialises the snapshot,
      // so a controlled drag (no add/remove) does no O(n) work here.
      // `pendingAdded.size` covers cells not yet committed.
      if (cells.getSize() + pendingAdded.size > cellIds.length) {
        const userIds = new Set<CellId>(cellIds);
        for (const item of cells.getSnapshot()) {
          const { id } = item;
          if (id !== undefined && !userIds.has(id)) stageRemove(id);
        }
      }

      flushContainer();
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
